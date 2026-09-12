# SPEC 18 — Servidor MCP remoto de Forge (solo lectura)

> **Estado:** Implementado
> **Depende de:** SPEC 03 — CLI Forge para tickets; SPEC 04 — Dev Board proyectos; SPEC 17 — Loop de agente sobre tickets
> **Fecha:** 2026-09-11
> **Objetivo:** Exponer tickets y proyectos de Forge a Claude (web y móvil) mediante un servidor MCP remoto en Cloudflare Workers, solo lectura, reutilizando los services del CLI extraídos a `packages/forge-core`, con OAuth de GitHub restringido al usuario dueño.

## Contexto

Hoy el acceso de agentes a Forge es local: `forge-cli` más las skills en `~/.agents/skills`. Eso cubre escritorio, no celular. MCP local (stdio) tampoco sirve para Claude móvil: Anthropic conecta desde su nube a servidores públicos HTTPS, nunca desde tu dispositivo. ChatGPT queda descartado: sus MCP apps son solo web (no móvil) y los writes solo están en planes Business/Enterprise. Telegram o Hermes requieren VPS; fuera de alcance.

La ruta viable es un servidor MCP remoto (Streamable HTTP) en Cloudflare Workers: free tier suficiente (100k requests/día, Durable Objects SQLite gratis), plantilla oficial de OAuth con GitHub lista para usar, y aislamiento total de la web de Vercel (`https://forge.elmerjacobo.dev`), que no se toca.

La v1 es solo lectura. Escribir tickets desde el celular queda para una fase 2, con confirmación explícita del cliente.

SPEC 17 dejó "Servidor MCP" explícitamente fuera de alcance. Esta spec lo retoma y amplía.

## Alcance

**Incluye:**

- Nuevo paquete `packages/forge-core` con schemas, services, helpers puros y types compartidos, sin dependencias de `node:fs`.
- Refactor del CLI para consumir `@forge/core`; `apps/cli` pasa a empaquetarse con `esbuild` (bundle del core incluido) para seguir publicando un solo paquete npm.
- Nuevo app `apps/mcp`: Worker de Cloudflare con `agents/mcp` + `@cloudflare/workers-oauth-provider` y login OAuth de GitHub con allowlist por usuario.
- Seis tools MCP read-only: `forge_list_projects`, `forge_get_project`, `forge_list_tickets`, `forge_next_ticket`, `forge_get_ticket`, `forge_activity_report`.
- Sesión de Forge single-user: refresh token propio guardado como secret, refresco y rotación persistida en Durable Object storage.
- Tests vitest para core y tools del Worker (services mockeados).
- Documentación: `apps/mcp/README.md`, actualización de `AGENTS.md`, `.gitignore` para `.dev.vars`, y esta spec al día.
- Verificación end-to-end: MCP Inspector contra el Worker desplegado y conexión del connector en Claude web (se hereda en Claude móvil).

**Fuera de alcance (specs futuras):**

- Tools de escritura: crear, editar, mover o comentar tickets.
- Telegram, Hermes o cualquier bot conversacional.
- ChatGPT (web o móvil): descartado por limitaciones de la plataforma.
- OAuth por usuario contra InsForge (multi-tenant). Esta spec es single-user.
- Tools de bookmarks y resources; solo tickets y proyectos.
- Cambios en `apps/web` (Vercel), en el esquema SQL o en migraciones.
- Dominio propio `mcp.elmerjacobo.dev` (se usa `*.workers.dev`; el custom domain queda como mejora opcional).
- Caché, rate limiting propio, analítica o métricas más allá del dashboard de Cloudflare.
- Soporte de MCP prompts/resources: solo tool calls.

## Arquitectura

```
Claude web / Claude móvil
      |  OAuth 2.1 (GitHub, allowlist)
      v
Worker apps/mcp  ---- Durable Object (McpAgent + sesión Forge)
      |                 |- refresh token + rotación
      |                 '- tools read-only
      v
@forge/core services
      |
      v
InsForge (RLS del usuario, sin cambios de esquema)
```

Capas de autenticación:

- **Capa A — Claude hacia el Worker:** OAuth de GitHub con allowlist de login. Sin login autorizado no se llega a `/mcp`. Reutiliza la plantilla `remote-mcp-github-oauth` de Cloudflare.
- **Capa B — Worker hacia InsForge:** el Worker actúa como el usuario dueño con el refresh token de `~/.forge/session.json` (opción single-user). InsForge aplica RLS normal; no hay tokens de servicio ni bypass.

## Extracción de `packages/forge-core`

Mueve desde `apps/cli/src`:

- Schemas: `bookmark-schema.ts`, `project-schema.ts`, `resource-schema.ts`, `ticket-schema.ts`.
- Services: `bookmarks-service.ts`, `resources-service.ts`, `projects-service.ts`, `dev-board-service.ts`, `activity-service.ts`.
- Helpers puros: `insforge-data.ts`, `dev-board-helpers.ts`, `report-helpers.ts`.
- Tipos: `types.ts` (`Ticket`, `TicketSummary` nuevo, `Project`, `TicketComment`, `NextTicketContext`, `ActivityReport`, `ColumnId`, `PRIORITIES`, `COLUMNS`, etc.).

Se queda en `apps/cli` (depende de `node:fs`, `process` o es presentación):

- `config.ts`, `session.ts`, `web-env.ts`, `version.ts`.
- `insforge.ts`: conserva `requireConfig`, `requireSession` y `createAuthedClient` (fs), y delega la creación del cliente al factory del core.
- `flags.ts`, `format.ts`, `report-format.ts`, `main.ts`, `commands/*`.

Reglas del paquete:

- Nombre `@forge/core`, `private: true`, `type: module`, build con `tsc` a `dist` (JS + declarations), `exports` de un solo entry `src/index.ts` como frontera pública del paquete.
- `createForgeClient({ url, anonKey, accessToken? })` nuevo en el core; reemplaza el `createClient` de `apps/cli/src/insforge.ts:66`.
- Cero imports de `node:*` dentro del core. Los services ya son puros sobre `InsForgeClient` (verificado: ningún `*-service.ts` importa builtins de Node).
- `pnpm-workspace.yaml` ya incluye `packages/*`; no requiere cambios.
- Tests que se mueven con el código: `apps/cli/tests/{schemas,services}/*` y `apps/cli/tests/lib/{dev-board-helpers,report-helpers}.test.ts` pasan a `packages/forge-core/tests/{schemas,services,lib}`; el helper `apps/cli/tests/helpers/insforge-client.ts` se mueve también.
- `apps/cli/tests/lib/{config-session,flags,format,report-format,version}.test.ts` se quedan en el CLI.

Estrategia de publish del CLI:

- `apps/cli` no declara `@forge/core` en `package.json`: lo resuelve por `paths` de tsconfig, alias de vitest y alias de esbuild, y lo bundlea. El manifest publicado no menciona el paquete interno.
- `apps/cli/package.json` mantiene `files: ["bin", "dist"]` y el binario `bin/forge-cli.js` sigue importando `dist/main.js`.
- El `package.json` publicado no debe referenciar `@forge/core`; el tarball es autocontenido.
- Typecheck separado con `tsc --noEmit` (mismo `strict` de hoy).
- El flujo de release `vX.Y.Z` y Trusted Publishing de SPEC 12 no cambia.

Scripts raíz:

- Nuevos: `build:core`, `test:core`, `test:core:watch`, `test:core:coverage`.
- `build` pasa a core → web + cli; `test` y `test:coverage` incluyen core; `test:watch` corre los tres en paralelo.

## Contrato de tools

Nombres con prefijo `forge_` para evitar colisiones. Salida en JSON compacto (sin pretty-print) para no gastar contexto. En listados se devuelve `TicketSummary`, no el ticket completo.

`TicketSummary`:

```ts
export interface TicketSummary {
  id: string;
  projectId: string;
  title: string;
  column: ColumnId;
  priority: Priority;
  branch: string | null;
  prUrl: string | null;
  createdAt: string;
}
```

| Tool                    | Entrada                                           | Salida                                          | Service core                                         |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `forge_list_projects`   | `{}`                                              | `Project[]`                                     | `projects.list()`                                    |
| `forge_get_project`     | `{ projectId }`                                   | `Project`                                       | `projects.get()`                                     |
| `forge_list_tickets`    | `{ projectId, column? }`                          | `TicketSummary[]`                               | `board.list(projectId, column)`                      |
| `forge_next_ticket`     | `{ projectId? }`                                  | `NextTicketContext`                             | `board.next({ projectId })`                          |
| `forge_get_ticket`      | `{ ticketId }`                                    | `{ ticket: Ticket, comments: TicketComment[] }` | `board.get()` + `board.listComments()`               |
| `forge_activity_report` | `{ days?, since?, until?, projectId?, columns? }` | `ActivityReport`                                | `projects` + `board` + `activity` + `report-helpers` |

Reglas:

- `days` por defecto 7; `since`/`until` ISO 8601; `columns` subset de `COLUMNS`; misma semántica que `forge-cli ticket report` (`apps/cli/src/commands/ticket.ts:290`).
- Errores de negocio del core (`"Ticket not found."`, `"Project not found."`) se devuelven como `isError: true` con ese mensaje exacto. Nunca stack traces ni tokens.
- Solo se invocan métodos de lectura: `list`, `get`, `next`, `listComments`, `listEvents`, `listCommentsInRange`, `resolveReportWindow`, `groupActivity`. Ninguna tool llama `create`, `update`, `move`, `delete`, `addComment`, timers o RPCs.
- Inputs validados con Zod; los schemas ya existen en el core para tickets y proyectos.
- Sin texto formateado para humanos: el agente recibe datos estructurados y redacta.

## Sesión de Forge en el Worker

- Secrets/vars del Worker:

| Nombre                  | Tipo   | Contenido                                                  |
| ----------------------- | ------ | ---------------------------------------------------------- |
| `GITHUB_CLIENT_ID`      | secret | OAuth App de GitHub (callback del Worker)                  |
| `GITHUB_CLIENT_SECRET`  | secret | secreto de la OAuth App                                    |
| `COOKIE_ENCRYPTION_KEY` | secret | clave aleatoria para el provider de OAuth                  |
| `FORGE_REFRESH_TOKEN`   | secret | refresh token de `~/.forge/session.json` (semilla inicial) |
| `ALLOWED_GITHUB_LOGIN`  | var    | tu login de GitHub; cualquier otro recibe 403              |
| `INSFORGE_URL`          | var    | URL del proyecto InsForge                                  |
| `INSFORGE_ANON_KEY`     | var    | anon key (pública, la misma del `.env.local` de la web)    |

- Al primer uso, el agente siembra el storage del Durable Object con `FORGE_REFRESH_TOKEN`.
- En cada tool call: `client.auth.refreshSession({ refreshToken })`, usar `accessToken` para las queries, y guardar el refresh token rotado en el DO storage. La ejecución single-threaded del DO evita carreras de rotación.
- Si el refresh falla (revocado/expirado), el error indica volver a correr `forge-cli login` y actualizar el secret con `wrangler secret put`.
- Logs del Worker (`wrangler tail`) no deben imprimir tokens, bodies de refresh ni contenido de tickets.

## Plan de implementación

1. Actualizar `AGENTS.md` (nuevo paquete y app, comandos de build/test) y aprobar esta spec.
2. Crear `packages/forge-core`: `package.json`, `tsconfig.json`, `vitest.config.ts`, mover los archivos listados, crear `src/index.ts` con la superficie pública y `createForgeClient`.
3. Mover los tests de schemas/services/helpers a `packages/forge-core/tests` y verificar `pnpm --filter @forge/core test`.
4. Refactor del CLI: actualizar imports a `@forge/core`, reducir `insforge.ts` al factory + fs, añadir `scripts/build.mjs`, cambiar `build` a `node ./scripts/build.mjs && tsc --noEmit`, resolver el core por `paths`/alias (sin declararlo en package.json). Verificar que la salida de todos los comandos no cambia.
5. Actualizar scripts raíz y `AGENTS.md`; correr `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format:check`.
6. Verificar el publish del CLI: `npm pack --dry-run` (sin `@forge/core` en dependencies), instalar el tarball en un temp y correr `forge-cli --help` y `forge-cli --version`.
7. Crear `apps/mcp` con `wrangler` + `agents/mcp` (sin OAuth todavía): `wrangler.jsonc` con binding del Durable Object y storage SQLite, `.dev.vars` ignorado y la tool `forge_list_projects`. El wrapper de `@cloudflare/workers-oauth-provider` (plantilla `remote-mcp-github-oauth`) y el KV de OAuth se integran al conectar GitHub, en los pasos 12-13.
8. Spike temprano: una tool trivial `forge_list_projects` contra InsForge real en `wrangler dev` para confirmar que `@forge/core` y `@insforge/sdk` corren en el runtime de Workers. Si falla, detenerse y reevaluar hosting antes de seguir.
9. Implementar `forge-session.ts` (siembra, refresh, rotación en DO storage) y las seis tools con schemas Zod, mapeo a `TicketSummary` y manejo de errores `isError`.
10. Tests vitest de las tools con services del core mockeados (sin red), siguiendo el patrón de mocks del CLI.
11. Deploy a `forge-mcp.<cuenta>.workers.dev`; verificar las seis tools con `npx @modelcontextprotocol/inspector` contra el Worker real.
12. Manual (usuario): crear la GitHub OAuth App con el callback del Worker, `wrangler login`, cargar los secrets, correr `forge-cli login` y subir `FORGE_REFRESH_TOKEN`.
13. Conectar el connector en claude.ai (Connectors → Add custom connector), verificar que aparece en la app móvil y probar "dime qué tickets tengo pendientes" y "dame el reporte de la semana".
14. Documentar en `apps/mcp/README.md`: setup, secrets, deploy, rotación de token, troubleshooting de OAuth; añadir `.dev.vars` a `.gitignore` y marcar esta spec como implementada.

## Criterios de aceptación

**Core y CLI:**

- [ ] `packages/forge-core` existe con schemas, services, helpers y types; sin imports de `node:*`.
- [ ] `apps/cli` no contiene copias duplicadas de los archivos movidos; importa todo desde `@forge/core`.
- [ ] Todos los comandos del CLI conservan comportamiento y salida actuales; `pnpm test:cli` pasa.
- [ ] `apps/cli/package.json` publicado no referencia `@forge/core`; `npm pack --dry-run` no lo lista como dependency.
- [ ] El tarball instalado en un temp corre `forge-cli --help` y `forge-cli --version` sin `@forge/core` instalado.
- [ ] `pnpm build`, `pnpm test` y `pnpm lint` pasan.
- [ ] `pnpm-workspace.yaml` no requiere cambios para incluir `packages/forge-core`.

**Worker MCP:**

- [ ] `wrangler dev` levanta `apps/mcp` y el MCP Inspector lista exactamente las seis tools con sus schemas.
- [ ] Cada tool devuelve datos reales de la cuenta Forge del usuario.
- [ ] Solo lectura verificada por revisión: ninguna tool invoca métodos de mutación del core ni RPCs de escritura.
- [ ] Los listados devuelven `TicketSummary` (sin descripción) para cuidar el contexto.
- [ ] `forge_activity_report` respeta `days`/`since`/`until`/`projectId`/`columns` igual que el CLI.
- [ ] Errores de negocio llegan como `isError` con el mensaje exacto del core; sin stack traces.
- [ ] Un login de GitHub fuera de la allowlist no obtiene token ni acceso a `/mcp`.
- [ ] El refresh token rota tras cada llamada y queda persistido; reiniciar el agente no pide re-login.
- [ ] Si el refresh falla, el error es claro y no filtra detalles del token.

**Claude:**

- [ ] El connector se agrega en claude.ai por URL HTTPS y completa el OAuth de GitHub.
- [ ] El connector aparece y funciona en Claude móvil (iOS/Android).
- [ ] "Dime qué tickets tengo pendientes" responde con datos reales.
- [ ] "Dame el reporte de la semana" responde con el reporte estructurado.
- [ ] Deshabilitar el connector en una conversación no rompe las demás tools de Claude.

**Seguridad y docs:**

- [ ] Ningún secreto en el repo; `.dev.vars` está en `.gitignore` y los secrets reales viven en Cloudflare.
- [ ] La allowlist de GitHub es obligatoria y está documentada.
- [ ] `wrangler tail` u otros logs no imprimen tokens ni contenido sensible.
- [ ] `apps/mcp/README.md` documenta setup, secrets, deploy, rotación y troubleshooting.
- [ ] `AGENTS.md` refleja `packages/forge-core` y `apps/mcp` con sus comandos.

**General:**

- [ ] No se modifica ningún archivo bajo `apps/web` ni ninguna migración SQL.
- [ ] `pnpm format` sobre los archivos nuevos o tocados.
- [ ] El flujo de release del CLI (tag `vX.Y.Z`, Trusted Publishing) sigue intacto.

## Decisiones

- **Sí:** Cloudflare Workers como hosting; plantilla OAuth de GitHub ya resuelta, free tier suficiente (DO SQLite incluido) y cero acoplamiento con el deploy de Vercel.
- **No:** Vercel para el MCP; obliga a implementar OAuth 2.1 + consentimiento a mano y acopla el MCP al ciclo de deploy de la web.
- **No:** función edge de InsForge; endpoint único sin endpoints de discovery OAuth y Streamable HTTP dudoso para connectors.
- **Sí:** OAuth de GitHub con allowlist de login en vez de URL secreta o no-auth; el server es público y debe rechazar a cualquiera que no sea el dueño.
- **Sí:** single-user con refresh token propio como secret; Forge tiene un solo usuario y RLS sigue aplicando como él.
- **Sí:** v1 solo lectura; el modelo debe ganarse la confianza antes de habilitar mutaciones desde el celular.
- **Sí:** extraer `packages/forge-core`; MCP y CLI deben compartir una sola implementación de services y schemas.
- **Sí:** core privado + CLI bundleado con `esbuild`; el paquete npm sigue siendo uno y autocontenido, y el core no se publica como API interna. `esbuild` ya está en el lockfile con provenance; `tsup` queda descartado porque arrastra `chokidar@4.0.3`, que perdió provenance y viola el trust policy del workspace.
- **Sí:** `agents/mcp` con Durable Object; da estado para OAuth y para la rotación del refresh token, y es el camino documentado con `workers-oauth-provider`. Si su API resulta inestable, alternativa: `@modelcontextprotocol/sdk` stateless + KV.
- **Sí:** seis tools con prefijo `forge_` y salida JSON compacta; menos contexto y cero ambigüedad de nombres en clientes con varios servers.
- **Sí:** listados con `TicketSummary`; el contexto del agente es el recurso escaso, `forge_get_ticket` da el detalle.
- **Sí:** `FORGE_REFRESH_TOKEN` como secret de arranque y rotación en DO storage; el login interactivo solo ocurre en la máquina del usuario.
- **Sí:** tocar `AGENTS.md` y README en esta spec; el setup del Worker es manual y necesita documentación operativa.
- **No:** Telegram, Hermes o ChatGPT en esta spec; cada canal tiene sus límites y merece spec propia.
- **No:** tools de bookmarks/resources todavía; tickets y proyectos cubren el caso de uso que motivó la idea.
- **No:** OAuth multi-tenant contra InsForge; no hay segundo usuario y agrega complejidad sin valor.
- **No:** custom domain en esta spec; `*.workers.dev` sirve para v1 y el dominio propio se mapea después.

## Riesgos

| Riesgo                                                                         | Mitigación                                                                                                                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@insforge/sdk` no corre en el runtime de Workers (APIs no fetch)              | Spike temprano con `forge_list_projects` antes de implementar las seis tools; si falla, reevaluar hosting (VPS o ruta Vercel).                                      |
| La API de `agents/mcp` cambia entre versiones                                  | Pinear versiones exactas en `package.json`; fallback documentado a `@modelcontextprotocol/sdk` stateless.                                                           |
| InsForge podría invalidar refresh tokens viejos si agrega reuse detection      | El seed de `.dev.vars` sigue válido tras varias rotaciones (verificado); si cambia, mover la sesión a un store global compartido (KV) en vez de por Durable Object. |
| `vitest-pool-workers` no digiere el SDK (`@supabase/postgrest-js` CJS/ESM)     | Spike con `wrangler dev` y llamada MCP real; tests unitarios de handlers puros con services mockeados, sin runtime de Workers.                                      |
| La extracción del core rompe tests o el build del CLI                          | Mover archivos y tests en el mismo commit, correr `pnpm test`/`build` tras cada paso y verificar el tarball con `npm pack` antes de seguir.                         |
| El cambio a `esbuild` altera la salida publicada del CLI                       | Typecheck con `tsc --noEmit` y smoke test del tarball (`--help`/`--version`); el binario y `files` no cambian.                                                      |
| Rotación de refresh token con pérdida de sesión                                | Guardar cada token rotado en DO storage tras el refresh; si el refresh falla, mensaje claro con el paso de `wrangler secret put`.                                   |
| Refresh token comprometido o filtrado en logs                                  | Solo como `wrangler secret`, nunca en repo ni logs; allowlist de GitHub impide que terceros usen el server; rotar el token si hay duda.                             |
| Callback de OAuth mal configurado en la GitHub OAuth App                       | Documentar la URL exacta del Worker en el README con checklist de setup y troubleshooting de `redirect_uri`.                                                        |
| Payloads grandes de tickets (descripciones/comentarios) inflan el contexto     | `TicketSummary` en listados; detalle completo solo en `forge_get_ticket` y `forge_next_ticket`; reporte acotado por ventana.                                        |
| El DoS de contextos largos en Claude no aplica pero `next` global puede crecer | El core ya pagina de 100 en 100 y el ranking se hace en memoria sobre `todo`, conjunto pequeño.                                                                     |
| Rate limiting inexistente en `/mcp`                                            | OAuth de GitHub + allowlist limita el acceso a una sola identidad; el free tier absorbe el uso personal. Si crece, agregar reglas de Cloudflare.                    |
| Deriva entre `apps/cli` y `apps/mcp` al evolucionar services                   | Una sola fuente: `@forge/core`; cualquier cambio de contrato se hace ahí y ambos consumidores lo heredan.                                                           |

## Qué **no** está en esta spec

- Tools de escritura (`create`, `update`, `move`, `comment`, `delete`, timers).
- Telegram, Hermes, WhatsApp o bots conversacionales.
- ChatGPT web o móvil.
- OAuth por usuario contra InsForge (multi-tenant).
- Tools de bookmarks y resources.
- Cambios en `apps/web`, migraciones o esquema SQL.
- Dominio propio `mcp.elmerjacobo.dev`.
- Caché, rate limiting propio, métricas o analítica.
- MCP prompts y resources: solo tool calls.
- Realtime o notificaciones push desde el Worker.

Cada elemento futuro deberá definirse en su propia spec.
