# AGENTS.md

## Project
Forge — Tauri v2 desktop app bundling local-first developer utilities (JSON, UUID, JWT, Base64, hashes, QR, regex, timestamps, etc.). Product intent in `docs/product.md` (Spanish): each utility is an independent, offline, privacy-respecting module; principles are simple/fast/private/local. Currently at template stage — `src/App.tsx` and `src-tauri/src/lib.rs` still hold the boilerplate `greet` example.

## Stack
- Frontend: React 19 + TypeScript + Vite 7, Tailwind v4, shadcn (style `radix-nova`, baseColor `neutral`, icons `lucide`, CSS variables).
- Backend: Rust via Tauri v2; crate name `forge_lib`.
- Package manager: **pnpm** (lockfile + `pnpm-workspace.yaml` present; `tauri.conf.json` hardcodes `pnpm dev` / `pnpm build`).

## Commands
- `pnpm install` — install deps.
- `pnpm tauri dev` — run the full app (Rust shell + Vite frontend). This is the real dev command.
- `pnpm dev` — web-only Vite; `invoke()` calls fail (no Tauri runtime). Fine for pure UI work.
- `pnpm tauri build` — production bundle (runs `pnpm build`, then Rust bundler).
- `pnpm build` — `tsc && vite build` (frontend typecheck + build).

## Verification
- **No `lint`, `test`, or formatter scripts exist.** `.prettierrc` is empty; no test runner is configured.
- Typecheck = `pnpm build` (runs `tsc`) or `pnpm exec tsc --noEmit`.
- `tsconfig.json` is strict: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all on — unused imports/vars fail the build.

## Architecture
- Two source trees: `src/` (frontend TS) and `src-tauri/` (Rust).
- Frontend entry: `src/main.tsx` -> `src/App.tsx`. Path alias `@/*` -> `src/*` (set in both `tsconfig.json` and `vite.config.ts`).
- Rust entry: `src-tauri/src/main.rs` -> `forge_lib::run()` in `src-tauri/src/lib.rs`. The `_lib` suffix is intentional (avoids Windows crate-name collision) — keep it.
- Adding a Tauri command: define `#[tauri::command] fn` in `lib.rs`, register it in `tauri::generate_handler![...]`, call from TS via `invoke("name", { args })` from `@tauri-apps/api/core`.
- Permissions: `src-tauri/capabilities/default.json` (currently `core:default` + `opener:default`). New plugins require a permission entry here or their IPC is blocked.
- Frontend builds to `dist/`; Tauri reads it from `../dist` (`tauri.conf.json` `frontendDist`).

## Conventions & gotchas
- Vite port `1420` is `strictPort: true` — do not change it; Tauri's `devUrl` expects it. Vite is configured to ignore `src-tauri/**`.
- Tailwind v4: no `tailwind.config.js`. Theme is defined via `@theme` in `src/index.css`; shadcn design tokens live there as CSS vars (oklch, light + `.dark`).
- shadcn components live in `src/components/ui/`; add with `pnpm dlx shadcn@latest add <name>`. Aliases and style are in `components.json`.
- `cn()` merge helper is in `src/lib/utils.ts` (clsx + tailwind-merge).
- `src-tauri/src/main.rs` sets `windows_subsystem = "windows"` in release — **do not remove** (prevents an extra console window on Windows).
- `.gitignore` excludes `.codegraph/` and `.docs/`; no CI workflows are configured.
