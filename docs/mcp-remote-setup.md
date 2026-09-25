# Configurar el MCP remoto de Forge desde cero

Guía completa para levantar el servidor MCP remoto de Forge (SPEC 18) desde cero: cuentas, OAuth de GitHub, KV, secrets, deploy y conexión de clientes. Complementa `apps/mcp/README.md` (operación diaria) y `specs/18-forge-mcp-remote.md` (spec).

## Qué vas a construir

```
Claude web / móvil, Claude Code, opencode, Cursor  o  MCP Inspector
        │  OAuth 2.1 (GitHub, allowlist)
        ▼
Worker forge-mcp (Cloudflare)  ──  Durable Object (sesión Forge, rotación de token)
        │
        ▼
@forge/core services  →  InsForge (RLS de tu cuenta, lectura y escritura de tickets)
```

El Worker expone seis herramientas de consulta (`forge_list_projects`, `forge_get_project`, `forge_list_tickets`, `forge_next_ticket`, `forge_get_ticket`, `forge_activity_report`) y seis de escritura de tickets (`forge_create_ticket`, `forge_move_ticket`, `forge_update_ticket`, `forge_add_ticket_comment`, `forge_pause_ticket`, `forge_resume_ticket`). Las escrituras no incluyen borrado ni edición de título, descripción o prioridad; ver `apps/mcp/README.md` para los parámetros actuales.

## 1. Requisitos

- Node 20+ y `pnpm`.
- Cuenta de GitHub.
- Cuenta de Cloudflare (gratis, sin tarjeta).
- `forge-cli` con sesión activa en tu máquina: `forge-cli whoami` debe responder tu usuario.

## 2. Cloudflare: cuenta y login local

1. Crear cuenta: https://dash.cloudflare.com/sign-up
2. Autenticar Wrangler en tu terminal (abre el navegador):
   ```bash
   pnpm --filter @forge/mcp exec wrangler login
   ```
3. Verificar:
   ```bash
   pnpm --filter @forge/mcp exec wrangler whoami
   ```
   Debes ver tu email y el Account ID.
4. Anota tu subdominio workers.dev (dashboard → **Workers & Pages**). Aquí es `ejacobotiniano.workers.dev`.

## 3. GitHub OAuth App

1. Abre https://github.com/settings/applications/new y llena:

| Campo                     | Valor                                                  |
| ------------------------- | ------------------------------------------------------ |
| Application name          | `Forge MCP`                                            |
| Homepage URL              | `https://forge.elmerjacobo.dev`                        |
| Application description   | `Remote MCP server for the Forge Dev Board` (opcional) |
| Redirect URI              | `http://localhost:8787/callback`                       |
| Allow wildcard matching   | Apagado                                                |
| Enable Device Flow        | Apagado                                                |
| Expire user access tokens | Default (marcado)                                      |

2. **Register application** → copia el **Client ID** (es público, va en `wrangler.jsonc`).
3. **Generate a new client secret** → cópialo y guárdalo en tu gestor de contraseñas. Solo se muestra una vez.
4. Si el secret se filtra o se sube mal, vuelve aquí y **regenera** (el anterior queda inválido).
5. El callback de producción se agrega en el paso 7.

## 4. Configuración del repo

- `apps/mcp/wrangler.jsonc` ya define el Worker: binding del Durable Object (`MCP_OBJECT` → `ForgeMcp`, migración SQLite), el KV `OAUTH_KV` y las `vars` no secretas:
  - `GITHUB_CLIENT_ID` (público)
  - `ALLOWED_GITHUB_LOGIN` (tu usuario de GitHub; aquí `elmerjacobo97`)
  - `INSFORGE_URL` e `INSFORGE_ANON_KEY` (públicas, las mismas del front)
- Para desarrollo local crea `apps/mcp/.dev.vars` (está ignorado por git; hay un `.dev.vars.example`):

  ```bash
  INSFORGE_URL="https://<proyecto>.insforge.app"
  INSFORGE_ANON_KEY="anon_..."
  FORGE_REFRESH_TOKEN="..."
  ```

- El refresh token sale de tu login del CLI:

  ```bash
  forge-cli login
  node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.env.HOME+'/.forge/session.json','utf8')).refreshToken)"
  ```

## 5. KV namespace (estado OAuth)

```bash
pnpm --filter @forge/mcp exec wrangler kv namespace create OAUTH_KV
```

Copia el `id` que imprime y pégalo en `apps/mcp/wrangler.jsonc` dentro de `kv_namespaces`. Aquí quedó `cfdedac087224487ba75c3e84e8e92d9`.

## 6. Secrets

Los secretos viven en Cloudflare, nunca en el repo.

1. Client secret de GitHub. **El nombre va como argumento del comando; el valor se pega cuando Wrangler lo pregunta:**

   ```bash
   pnpm --filter @forge/mcp exec wrangler secret put GITHUB_CLIENT_SECRET
   ```

   > Pitfall real: si pasas el valor como argumento (`wrangler secret put 5e42...`), el secret queda con el valor como **nombre**. Se corrige borrándolo (`wrangler secret delete <nombre>`) y regenerando el client secret.

2. Refresh token de Forge, por pipe (nunca se imprime):

   ```bash
   node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.env.HOME+'/.forge/session.json','utf8')).refreshToken)" | pnpm --filter @forge/mcp exec wrangler secret put FORGE_REFRESH_TOKEN
   ```

3. Verifica que existan exactamente los dos nombres (no muestra valores):

   ```bash
   pnpm --filter @forge/mcp exec wrangler secret list
   ```

## 7. Deploy y callback definitivo

```bash
pnpm --filter @forge/mcp exec wrangler deploy
```

Imprime la URL del Worker, por ejemplo `https://forge-mcp.ejacobotiniano.workers.dev`.

Luego vuelve a la GitHub OAuth App y **agrega** (sin quitar el de localhost):

```
https://forge-mcp.<tu-subdominio>.workers.dev/callback
```

## 8. Verificación sin navegador

```bash
B=https://forge-mcp.ejacobotiniano.workers.dev

# Sin token debe dar 401 y anunciar el discovery OAuth
curl -sS -o /dev/null -D - -X POST $B/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# Metadata del servidor de autorización
curl -sS $B/.well-known/oauth-protected-resource
curl -sS $B/.well-known/oauth-authorization-server
```

Opcional (requiere registrar un cliente de prueba vía DCR):

```bash
curl -sS -X POST $B/register -H 'content-type: application/json' \
  -d '{"client_name":"spike","redirect_uris":["https://example.com/cb"],"grant_types":["authorization_code","refresh_token"],"response_types":["code"],"token_endpoint_auth_method":"none"}'
```

Con el `client_id` devuelto, `GET /authorize` con PKCE debe responder `302` hacia `github.com/login/oauth/authorize` con tu Client ID, el callback y la cookie `__Host-CONSENTED_STATE`.

## 9. Conectar clientes

### Claude (web y móvil)

1. https://claude.ai → `Settings` → `Connectors` → `Add custom connector`.
2. Nombre `Forge`, URL `https://forge-mcp.<tu-subdominio>.workers.dev/mcp`.
3. `Add` → `Connect` → login de GitHub → `Authorize`.
4. El connector se sincroniza a las apps de iOS/Android. El plan free permite 1 connector custom.
5. Prueba: "dime los tickets pendientes en Forge" y "dame el reporte de actividad de la última semana".

### Claude Code

```bash
claude mcp add --transport http forge https://forge-mcp.<tu-subdominio>.workers.dev/mcp --scope user
```

`--scope user` deja el server disponible en todos tus proyectos. `claude mcp list` muestra `Needs authentication` hasta el primer login; dentro de una sesión, `/mcp` abre la autorización de GitHub y conecta.

### opencode

Config global (`~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "forge": {
      "type": "remote",
      "url": "https://forge-mcp.<tu-subdominio>.workers.dev/mcp",
      "enabled": true
    }
  }
}
```

```bash
opencode mcp auth forge     # completa el flujo OAuth en el navegador
opencode mcp debug forge    # muestra discovery/estado sin autorizar
```

Los tokens quedan en `~/.local/share/opencode/mcp-auth.json`; `opencode mcp logout forge` los borra.

### Cursor

Config global (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "forge": { "url": "https://forge-mcp.<tu-subdominio>.workers.dev/mcp" }
  }
}
```

Autentica desde los ajustes de MCP de Cursor (lo pide al primer uso) o con `cursor-agent mcp login forge`. `cursor-agent mcp list` reporta `requires_authentication` hasta completar el login. El IDE de Cursor y el CLI `cursor-agent` guardan credenciales por separado: inicia sesión en cada uno que uses.

### Clientes sin OAuth remoto

`npx -y mcp-remote https://forge-mcp.<tu-subdominio>.workers.dev/mcp` actúa de puente para clientes solo-stdio: hace el flujo OAuth localmente y guarda los tokens en `~/.mcp-auth`.

### MCP Inspector (pruebas locales)

```bash
npx @modelcontextprotocol/inspector@latest
```

Abre el enlace que imprime (con token de sesión) y:

1. Pestaña **Servers** → **Add manually**.
2. Server ID `forge`; **Transport** `Streamable HTTP`; URL del Worker; Add.
3. **Connect** → GitHub → Authorize.
4. Pestaña **Tools** → **List Tools** (deben salir 6) → elegir una → **Execute Tool**.
   - Los campos opcionales (por ejemplo `projectId` en `forge_next_ticket`) se pueden dejar vacíos.

## 10. Sesión Forge y rotación

- `FORGE_REFRESH_TOKEN` siembra la sesión; cada tool call refresca el access token y guarda el refresh rotado en el storage del Durable Object.
- Cada sesión MCP crea su propio DO: las sesiones nuevas siembran del secret; las que ya tienen token guardado lo usan y caen al seed si falla.
- Si vuelves a hacer `forge-cli login`, actualiza el secret con el comando del paso 6.2. No requiere redeploy.

## 11. Troubleshooting

| Síntoma                                                                                 | Causa y arreglo                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401 Unauthorized` en `/mcp`                                                            | Normal sin token: el cliente debe completar el flujo OAuth.                                                                                                |
| `GitHub token exchange failed: The client_id and/or client_secret passed are incorrect` | El secret está vencido o quedó con nombre incorrecto. Revisa `wrangler secret list` (solo nombres), regenera el client secret en GitHub y súbelo de nuevo. |
| `This GitHub account is not allowed to use this server`                                 | El login debe coincidir con `ALLOWED_GITHUB_LOGIN` en `wrangler.jsonc`.                                                                                    |
| `OAuth state does not match this session`                                               | Cookies bloqueadas o flujo terminado en otro navegador; reintenta desde el mismo navegador.                                                                |
| Tools responden `Forge session refresh failed: ...`                                     | El refresh token expiró o fue revocado: `forge-cli login` y actualiza `FORGE_REFRESH_TOKEN`.                                                               |
| Nada en logs                                                                            | `pnpm --filter @forge/mcp exec wrangler tail`. Los tokens y el contenido del board nunca se imprimen.                                                      |
| El Inspector conecta pero no hay tools                                                  | Falta **List Tools**; y recuerda que las tools se listan con el cliente ya autorizado.                                                                     |

## 12. Costos

Todo entra en el free tier: Workers (100k requests/día), Durable Objects con SQLite y KV. Suficiente para uso personal; no requiere tarjeta.

## Valores de esta instalación

| Dato             | Valor                                          |
| ---------------- | ---------------------------------------------- |
| Worker           | `https://forge-mcp.ejacobotiniano.workers.dev` |
| Subdominio       | `ejacobotiniano.workers.dev`                   |
| KV `OAUTH_KV`    | `cfdedac087224487ba75c3e84e8e92d9`             |
| GitHub OAuth App | `Forge MCP` — Client ID `Ov23lig4KNW92JjjcRw1` |
| Allowlist        | `elmerjacobo97`                                |

## Referencias

- `apps/mcp/README.md` — operación, secrets y troubleshooting del Worker.
- `specs/18-forge-mcp-remote.md` — spec completa del epic.
- Cloudflare: https://developers.cloudflare.com/workers/ · https://developers.cloudflare.com/kv/
- OAuth para MCP: https://github.com/cloudflare/workers-oauth-provider
- Claude connectors: https://support.anthropic.com
