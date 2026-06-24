# AGENTS.md

## Project
Forge — Tauri v2 desktop app bundling local-first developer utilities (JSON, UUID, JWT, Base64, hashes, QR, regex, timestamps, diff, HTTP tester, color, etc.). Product intent in `docs/product.md` (Spanish): each utility is an independent, offline, privacy-respecting module; principles are simple/fast/private/local.

## Stack
- Frontend: React 19 + TypeScript + Vite 7, Tailwind v4, shadcn (style `radix-nova`, baseColor `neutral`, icons `lucide`, CSS variables). Also: react-hook-form + zod, cmdk, sonner (toasts), next-themes, react-resizable-panels.
- Backend: Rust via Tauri v2; crate name `forge_lib`.
- Package manager: **pnpm** (lockfile + `pnpm-workspace.yaml` present; `tauri.conf.json` hardcodes `pnpm dev` / `pnpm build`).

## Commands
- `pnpm install` — install deps.
- `pnpm tauri dev` — run the full app (Rust shell + Vite frontend). This is the real dev command.
- `pnpm dev` — web-only Vite; `invoke()` calls fail (no Tauri runtime). Fine for pure UI work.
- `pnpm tauri build` — production bundle (runs `pnpm build`, then Rust bundler).
- `pnpm build` — `tsc && vite build` (frontend typecheck + build).
- `pnpm doctor` — runs `react-doctor` (a11y/perf/bundle audit). Not a build/test step.

## Verification
- **No `lint`, `test`, or formatter scripts exist.** `.prettierrc` is empty; no test runner is configured.
- Typecheck = `pnpm build` (runs `tsc`) or `pnpm exec tsc --noEmit`.
- `tsconfig.json` is strict: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all on — unused imports/vars fail the build.

## Architecture
- Two source trees: `src/` (frontend TS) and `src-tauri/` (Rust).
- Frontend entry: `src/main.tsx` -> `src/App.tsx` -> `@/components/layout/app-shell` (the real shell; `App.tsx` only delegates). Shell + sidebar in `src/components/layout/`.
- Path alias `@/*` -> `src/*` (set in both `tsconfig.json` and `vite.config.ts`).
- Each utility lives in its own folder `src/features/<name>/<name>.tsx` (currently 19). New feature = new folder + registration in the sidebar (`src/components/layout/sidebar.tsx`). Most utilities are purely client-side; only those needing the OS go through Tauri.
- Rust entry: `src-tauri/src/main.rs` -> `forge_lib::run()` in `src-tauri/src/lib.rs`. The `_lib` suffix is intentional (avoids Windows crate-name collision) — keep it.
- Tauri commands live in `src-tauri/src/commands/` (module `commands`, declared in `lib.rs` via `mod commands;`), not inline in `lib.rs`. `lib.rs` only wires plugins + the `generate_handler!` list. Current commands: `hash_file` (all platforms), `color::pick_color` (**macOS-only** — guarded by `#[cfg(target_os = "macos")]`).
- Adding a Tauri command: define `#[tauri::command] fn` in `src-tauri/src/commands/<name>.rs`, export it from `commands/mod.rs`, register it in `tauri::generate_handler![...]` in `lib.rs`, call from TS via `invoke("name", { args })` from `@tauri-apps/api/core`.
- Plugins registered in `lib.rs`: `tauri_plugin_opener`, `tauri_plugin_http`.
- Permissions: `src-tauri/capabilities/default.json` — `core:default`, `opener:default`, and `http:default` with an allow-list of `http://*` and `https://*`. New plugins require a permission entry here or their IPC is blocked.
- Frontend builds to `dist/`; Tauri reads it from `../dist` (`tauri.conf.json` `frontendDist`).

## Conventions & gotchas
- Vite port `1420` is `strictPort: true` — do not change it; Tauri's `devUrl` expects it. Vite is configured to ignore `src-tauri/**`.
- Tailwind v4: no `tailwind.config.js`. Theme is defined via `@theme` in `src/index.css`; shadcn design tokens live there as CSS vars (oklch, light + `.dark`).
- shadcn components live in `src/components/ui/`; add with `pnpm dlx shadcn@latest add <name>`. Aliases and style are in `components.json`.
- `cn()` merge helper is in `src/lib/utils.ts` (clsx + tailwind-merge). Shared non-UI helpers live in `src/lib/tools.ts` and `src/lib/hooks/`.
- `src-tauri/src/main.rs` sets `windows_subsystem = "windows"` in release — **do not remove** (prevents an extra console window on Windows).
- `.gitignore` excludes `.codegraph/` and `.docs/`; no CI workflows are configured.