# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-07-20] Next.js web and Node CLI have separate verification**
   Do instead: run focused Vitest through package filters, then root `pnpm build` and `pnpm test` before reporting cross-package work.

## Domain Behavior Guardrails
1. **[2026-07-20] Dev Board writes are atomic InsForge RPCs**
   Do instead: use ticket/project RPCs for lifecycle writes and validate snake_case network rows before mapping them to app types.
