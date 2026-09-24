# `@forge/mcp` — Forge remote MCP server

Cloudflare Worker that exposes the Forge Dev Board to MCP clients (Claude web/mobile, Claude Code, opencode, Cursor, MCP Inspector) over a remote Model Context Protocol endpoint. Read tools query InsForge with the owner's session. Write tools create, move, update handoff, comment, pause, and resume tickets. They do not delete.

- Production endpoint: `https://forge-mcp.ejacobotiniano.workers.dev/mcp`
- Auth: OAuth 2.1 via GitHub (`@cloudflare/workers-oauth-provider`) with a single allowed login (`ALLOWED_GITHUB_LOGIN`)
- Runtime: `agents/mcp` (`ForgeMcp` Durable Object) over the shared `@forge/core` services

Full from-scratch walkthrough (accounts, OAuth App, KV, secrets, deploy, clients): [`docs/mcp-remote-setup.md`](../../docs/mcp-remote-setup.md) (Spanish).

## Tools

| Tool                       | Input                                                                             | Returns                                                      |
| -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `forge_list_projects`      | `{}`                                                                              | `Project[]`                                                  |
| `forge_get_project`        | `{ projectId }`                                                                   | `Project`                                                    |
| `forge_list_tickets`       | `{ projectId, column? }`                                                          | `TicketSummary[]` (no description)                           |
| `forge_next_ticket`        | `{ projectId? }`                                                                  | `NextTicketContext` (ticket, project, comments, in progress) |
| `forge_get_ticket`         | `{ ticketId }`                                                                    | `{ ticket, comments }`                                       |
| `forge_activity_report`    | `{ days?, since?, until?, projectId?, columns? }`                                 | `ActivityReport`                                             |
| `forge_create_ticket`      | `{ projectId, title, description?, column?, priority? }`                          | `Ticket`                                                     |
| `forge_move_ticket`        | `{ ticketId, column, branch?, prUrl?, clearBranch?, clearPrUrl? }`                | `Ticket`                                                     |
| `forge_update_ticket`      | `{ ticketId, branch?, prUrl?, clearBranch?, clearPrUrl? }` (at least one handoff) | `Ticket`                                                     |
| `forge_add_ticket_comment` | `{ ticketId, body }`                                                              | `TicketComment`                                              |
| `forge_pause_ticket`       | `{ ticketId }`                                                                    | `Ticket`                                                     |
| `forge_resume_ticket`      | `{ ticketId }`                                                                    | `Ticket`                                                     |

Business errors come back as `isError: true` with the exact core message (for example `Project not found.`). Input validation is handled by Zod schemas before the handler runs.

## Authentication

Two independent layers:

1. **MCP client → Worker.** The Worker is wrapped in `OAuthProvider`, so `/mcp` requires a bearer token. `GET /authorize` redirects to GitHub; `/callback` validates a random state stored in KV bound to a `__Host-CONSENTED_STATE` cookie, checks the login allowlist, and calls `completeAuthorization`. Dynamic client registration (`/register`), PKCE, and the discovery documents are provided by `@cloudflare/workers-oauth-provider`.
2. **Worker → InsForge.** Single-user session. `FORGE_REFRESH_TOKEN` (from `~/.forge/session.json`) seeds the Durable Object; every tool call refreshes the access token and persists the rotated refresh token in DO storage. The stored token wins; if it fails, the server falls back to the seed.

## Local development

Create `apps/mcp/.dev.vars` (ignored by git, see `.dev.vars.example`):

```bash
INSFORGE_URL="https://<project>.insforge.app"
INSFORGE_ANON_KEY="anon_..."
FORGE_REFRESH_TOKEN="..."
```

The refresh token comes from the CLI login:

```bash
forge-cli login
node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.env.HOME+'/.forge/session.json','utf8')).refreshToken)"
```

Commands:

```bash
pnpm dev:mcp                              # wrangler dev on http://127.0.0.1:8787
pnpm test:mcp                             # vitest with mocked services
pnpm --filter @forge/mcp typecheck
```

Non-secret values (GitHub client id, allowed login, InsForge URL and anon key) live in `wrangler.jsonc` under `vars`. Testing the OAuth flow locally also needs `GITHUB_CLIENT_SECRET` in `.dev.vars`; Claude cannot reach localhost, so use the MCP Inspector against the deployed Worker for end-to-end checks.

## Deploy

1. `pnpm --filter @forge/mcp exec wrangler login`
2. KV namespace: `pnpm --filter @forge/mcp exec wrangler kv namespace create OAUTH_KV` and copy the id into `wrangler.jsonc`.
3. Secrets (the **name** is the command argument; the value is pasted at the prompt or piped):

```bash
pnpm --filter @forge/mcp exec wrangler secret put GITHUB_CLIENT_SECRET
node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.env.HOME+'/.forge/session.json','utf8')).refreshToken)" | pnpm --filter @forge/mcp exec wrangler secret put FORGE_REFRESH_TOKEN
```

4. `pnpm --filter @forge/mcp exec wrangler deploy`
5. GitHub OAuth App redirect URIs: keep `http://localhost:8787/callback` and add `https://forge-mcp.<account>.workers.dev/callback`.

## Connecting clients

The server implements OAuth 2.1 with dynamic client registration (`/register`), PKCE (`S256`), and loopback redirect flexibility (RFC 8252), so any MCP client that supports remote HTTP servers with OAuth can connect. The clients below were verified against the deployed Worker.

### Claude

**Settings → Connectors → Add custom connector** with the Worker URL. The connector is added from claude.ai and syncs to the Claude mobile apps; free plans allow one custom connector.

### Claude Code

```bash
claude mcp add --transport http forge https://forge-mcp.ejacobotiniano.workers.dev/mcp --scope user
```

`claude mcp list` shows `Needs authentication` until the first sign-in; run `/mcp` inside a session and complete the GitHub authorization. Servers added with `--scope user` are available in every project.

### opencode

Global config (`~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "forge": {
      "type": "remote",
      "url": "https://forge-mcp.ejacobotiniano.workers.dev/mcp",
      "enabled": true
    }
  }
}
```

```bash
opencode mcp auth forge     # completes the OAuth flow in the browser
opencode mcp debug forge    # shows discovery/auth status without authorizing
```

Tokens are stored in `~/.local/share/opencode/mcp-auth.json`; `opencode mcp logout forge` clears them.

### Cursor

Global config (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "forge": { "url": "https://forge-mcp.ejacobotiniano.workers.dev/mcp" }
  }
}
```

Authenticate from Cursor's MCP settings (prompts on first use) or with `cursor-agent mcp login forge`; `cursor-agent mcp list` reports `requires_authentication` until then. The Cursor IDE and the `cursor-agent` CLI store credentials separately, so sign in to each one you use.

### Clients without remote OAuth

`npx -y mcp-remote https://forge-mcp.ejacobotiniano.workers.dev/mcp` bridges any stdio-only client: it performs the OAuth flow locally and stores tokens under `~/.mcp-auth`.

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest
# Transport: Streamable HTTP
# URL: https://forge-mcp.ejacobotiniano.workers.dev/mcp
```

## Troubleshooting

| Symptom                                                                                 | Cause and fix                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401 Unauthorized` on `/mcp`                                                            | Expected without a bearer token; the client must complete the OAuth flow.                                                                                                                                              |
| `GitHub token exchange failed: The client_id and/or client_secret passed are incorrect` | The `GITHUB_CLIENT_SECRET` value is stale or was uploaded under the wrong name. Check names with `wrangler secret list`, regenerate the secret in GitHub, and upload it again (name as argument, value at the prompt). |
| `This GitHub account is not allowed to use this server`                                 | The GitHub login must match `ALLOWED_GITHUB_LOGIN` in `wrangler.jsonc`.                                                                                                                                                |
| `OAuth state does not match this session`                                               | Cookies were blocked or the flow was finished in another browser. Retry the authorization from the same browser.                                                                                                       |
| Tools respond `Forge session refresh failed: ...`                                       | The Forge refresh token expired or was revoked. Run `forge-cli login` and update `FORGE_REFRESH_TOKEN`; new sessions seed from the secret and stale DOs fall back to it.                                               |
| Nothing in the logs                                                                     | `pnpm --filter @forge/mcp exec wrangler tail`; tokens and board content are never logged.                                                                                                                              |

## Security notes

- `/mcp` rejects any caller without the GitHub allowlist; there is no anonymous mode.
- Secrets live only in `.dev.vars` (ignored) or Cloudflare secrets; never commit them.
- The Worker keeps its own Forge session and never exposes the refresh token to MCP clients.
- Ticket writes are create, move, handoff update, agent comment, pause, and resume. Delete, time adjustment, and title, description, or priority edits stay in `forge-cli` and the web app.
