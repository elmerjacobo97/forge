# SPEC 02 — CLI Forge para bookmarks vía Appwrite

> **Status:** Approved
> **Depends on:** Ninguna
> **Date:** 2026-07-18
> **Objective:** Crear el CLI `forge` en el monorepo, autenticado contra Appwrite, con CRUD de bookmarks y skills para que agentes lo invoquen por comando.

## Alcance

**Incluye:**

- Crear el paquete `apps/cli` (`@forge/cli`) en el workspace pnpm, con binario `forge`.
- Autenticación interactiva contra Appwrite (`forge login` / `forge logout` / `forge whoami`) con sesión y config en `~/.forge/`.
- Configurar endpoint, project ID e IDs de tablas/colecciones necesarios para bookmarks (mismo proyecto Appwrite que la web).
- CRUD de bookmarks vía CLI, alineado al modelo web:
  - `forge bookmark create` — campos: `title`, `url`, `category`, `description`, `tags`
  - `forge bookmark list`
  - `forge bookmark get <id>`
  - `forge bookmark update <id>`
  - `forge bookmark delete <id>`
- Categorías válidas: `docs` | `git` | `tool` | `article` | `other`.
- Salida legible por defecto y flag `--json` en los comandos de datos.
- Skills para agentes en `.claude/skills/` y `.agents/skills/` que documenten cuándo y cómo invocar `forge bookmark …`.
- Registrar el paquete en `pnpm-workspace.yaml` y documentar instalación/uso local (link del binario o `pnpm --filter @forge/cli`).
- Pruebas unitarias de parsing/validación de comandos bookmark (sin depender de Appwrite real en CI).

**Fuera de alcance (specs futuras):**

- Comandos para tickets (dev-board), snippets u otras features.
- Servidor MCP.
- Generación de contenido con IA desde el CLI (SPEC 01 / Function Groq).
- Publicar el CLI en npm.
- Auth con API key de Appwrite.
- Modo offline / localStorage.
- UI o cambios en `apps/web` más allá de lo imprescindible para compartir tipos (si se comparte, mínimo).

## Modelo de datos

Reutiliza el modelo de Bookmark de la web. No cambia el esquema Appwrite.

```ts
type Category = "docs" | "git" | "tool" | "article" | "other";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  category: Category;
  description: string;
  tags: string[];
  createdAt: string; // row.$createdAt
};
```

Fila Appwrite (tabla bookmarks): `title`, `url`, `category`, `description`, `tags`, `userId` + metadatos `$id` / `$createdAt`. Permisos por usuario (read/update/delete del dueño), igual que la web.

Config y sesión del CLI en `~/.forge/`:

```ts
// ~/.forge/config.json
type ForgeConfig = {
  endpoint: string;
  projectId: string;
  databaseId: string;
  bookmarksTableId: string;
};

// ~/.forge/session.json (o equivalente que use el SDK)
type ForgeSession = {
  userId: string;
  // sesión Appwrite persistida por el cliente Node (cookie/JWT según SDK)
};
```

Entradas de comandos:

```ts
type BookmarkCreateInput = {
  title: string; // min 2
  url: string; // URL válida
  category: Category;
  description: string; // 5-200
  tags: string[]; // lista; en CLI puede venir como --tags a,b,c
};

type BookmarkUpdateInput = Partial<BookmarkCreateInput>;
```

Convenciones:

- `tags` en Appwrite es `string[]`; en flags CLI se acepta lista separada por comas.
- `--json` imprime el objeto `Bookmark` (o array en `list`); sin flag, texto legible.
- Validación con las mismas reglas que `bookmarksSchema` de la web (salvo `tagsString` → `tags[]`).

## Plan de implementación

1. Crear `apps/cli` con `package.json` (`@forge/cli`, binario `forge`), `tsconfig.json` y un `src/main.ts` que imprima ayuda básica. Registrar el paquete en `pnpm-workspace.yaml`. Comprobar: `pnpm --filter @forge/cli exec forge --help` (o equivalente) responde sin error.

2. Añadir lectura/escritura de `~/.forge/config.json` y comando `forge init` (o flags en login) para guardar `endpoint`, `projectId`, `databaseId`, `bookmarksTableId`. Comprobar: tras init, el archivo existe con esos campos.

3. Integrar el SDK Node de Appwrite: `forge login` (email/password), `forge logout`, `forge whoami`. Persistir sesión en `~/.forge/`. Comprobar: login real contra el proyecto → `whoami` muestra el usuario; logout deja de estar autenticado.

4. Implementar cliente de bookmarks en el CLI (list/create/get/update/delete) contra la misma tabla que la web, con permisos por usuario. Comprobar manualmente con cuenta de prueba: create → list → get → update → delete.

5. Exponer los subcomandos `forge bookmark create|list|get|update|delete` con flags (`--title`, `--url`, `--category`, `--description`, `--tags`) y validación alineada al schema web. Comprobar: create con campos inválidos falla con mensaje claro; create válido aparece en la web.

6. Añadir flag global/por comando `--json` y formateo texto por defecto. Comprobar: `list --json` es JSON parseable; sin flag es texto legible.

7. Escribir skills en `.claude/skills/` y `.agents/skills/` (ej. `forge-bookmarks`) con ejemplos del flujo “añade esta URL a bookmarks”. Comprobar: un agente con la skill encuentra el comando correcto en la documentación de la skill.

8. Añadir pruebas unitarias de validación/parsing de inputs bookmark (sin Appwrite). Ajustar `AGENTS.md` / docs mínimas del CLI. Comprobar: `pnpm --filter @forge/cli test` (o el script acordado) pasa; `pnpm build` del workspace no se rompe.

## Criterios de aceptación

- [ ] Existe `apps/cli` como `@forge/cli` en el workspace y el binario `forge` responde a `--help`.
- [ ] `forge init` (o el flujo equivalente) escribe `~/.forge/config.json` con `endpoint`, `projectId`, `databaseId` y `bookmarksTableId`.
- [ ] `forge login` con credenciales válidas deja una sesión usable; `forge whoami` muestra el usuario autenticado.
- [ ] `forge logout` invalida/elimina la sesión local; comandos de bookmark posteriores fallan pidiendo login.
- [ ] `forge bookmark create` con `title`, `url`, `category`, `description` y `tags` válidos crea una fila visible en la web de Bookmarks del mismo usuario.
- [ ] `forge bookmark list` lista solo los bookmarks del usuario autenticado.
- [ ] `forge bookmark get <id>` muestra un bookmark existente; con id inexistente o de otro usuario falla de forma clara.
- [ ] `forge bookmark update <id>` modifica solo los campos indicados y persiste el cambio en Appwrite/web.
- [ ] `forge bookmark delete <id>` elimina el bookmark; deja de aparecer en `list` y en la web.
- [ ] Inputs inválidos (URL malformed, category desconocida, description fuera de rango) rechazan el comando con mensaje de error no vacío y código de salida ≠ 0.
- [ ] Con `--json`, `list`/`get`/`create`/`update` emiten JSON parseable; sin el flag, emiten texto legible.
- [ ] Existen skills en `.claude/skills/` y `.agents/skills/` que documentan el flujo de bookmarks con ejemplos de comandos `forge`.
- [ ] Las pruebas unitarias de validación/parsing del CLI pasan sin red ni Appwrite.

## Decisiones

- **Sí:** CLI habla directo con Appwrite (SDK Node). No hace falta un backend propio; Appwrite ya es la API.
- **No:** Backend intermedio Nest/Express/etc. Añade coste y duplica lo que Appwrite ya ofrece.
- **Sí:** v1 solo bookmarks con CRUD. Prueba el patrón CLI ↔ Appwrite ↔ agentes antes de ampliar.
- **No:** tickets y snippets en esta spec. Van en specs siguientes reutilizando auth/config del CLI.
- **Sí:** auth interactiva (email/password) y sesión/config en `~/.forge/`. Encaja con uso personal y permisos por usuario.
- **No:** API key de Appwrite en v1. Salta permisos por usuario y es más fácil de filtrar mal.
- **Sí:** agentes descubren comandos vía skills en `.claude/skills/` y `.agents/skills/`.
- **No:** servidor MCP en esta spec. El CLI + skills basta para el flujo “añade esta URL a bookmarks”.
- **Sí:** binario `forge` en `apps/cli` dentro del monorepo.
- **No:** repo separado ni publicar a npm en v1.
- **Sí:** salida texto por defecto y `--json` opcional.
- **No:** JSON-only. Empeora uso humano en terminal.
- **Sí:** reutilizar la misma tabla/permisos de bookmarks que la web.
- **No:** colección o schema paralelo para el CLI.

## Riesgos

| Riesgo                                                                         | Mitigación                                                                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| El SDK Node de Appwrite maneja sesión distinto al browser (cookies vs archivo) | Usar el mecanismo de persistencia documentado del SDK Node; guardar solo en `~/.forge/` y cubrir login/logout/whoami en aceptación manual. |
| Plataforma Appwrite bloquea orígenes/clientes no web                           | Verificar en login real que el project permite clientes API/server; documentar el requisito en el README del CLI.                          |
| `update` no existe aún en el servicio web de bookmarks                         | Implementar update en el CLI contra `tablesDB.updateRow`; no exigir cambios de UI salvo que se quiera paridad después.                     |
| Skills desactualizadas respecto a flags reales                                 | Escribir las skills en el mismo PR que los comandos finales; ejemplos copiados de `--help`.                                                |
| Credenciales en `~/.forge/` en máquina compartida                              | Permisos de archivo restringidos (usuario only); no loguear password ni session token.                                                     |

## Qué **no** está en esta spec

- Tickets (dev-board), snippets u otras entidades.
- Servidor MCP.
- Generación IA desde el CLI.
- Publicación a npm.
- Auth con API key.
- Modo offline.

Cada uno de esos, si entra, va en su propia spec.
