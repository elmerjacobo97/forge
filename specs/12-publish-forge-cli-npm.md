# SPEC 12 — Publicar forge-cli en npm

> **Estado:** APROBADO
> **Depende de:** SPEC 02 (CLI Forge)
> **Fecha:** 2026-07-22
> **Objetivo:** Publicar el CLI como paquete npm público `@codigoconelmer/forge-cli` (binario `forge-cli`) con releases por tag `vX.Y.Z` vía GitHub Actions y Trusted Publishing.

## Alcance

**Incluye:**

- Renombrar el paquete publicable a `@codigoconelmer/forge-cli` (mantener el binario `forge-cli`).
- Quitar `private: true` y configurar `publishConfig.access: public`.
- Completar metadatos npm en `apps/cli/package.json`: `license` (MIT), `repository`, `homepage`, `bugs`, `engines`, `files` (`bin`, `dist`).
- Añadir `LICENSE` (MIT) usable por el paquete CLI (raíz del repo o `apps/cli/`, según convenga al publish).
- Asegurar que el tarball solo incluye artefactos necesarios (`bin/`, `dist/`) y no secretos ni fuentes innecesarias.
- Documentar en `apps/cli/README.md` instalación global vía npm (`npm install -g @codigoconelmer/forge-cli`) y el flujo de release.
- Exigir que los tags `vX.Y.Z` se creen sobre commits ya presentes en `main` (no desde `development` ni otras ramas).
- Workflow de GitHub Actions que, al pushear un tag `vX.Y.Z` coincidente con `version` en `apps/cli/package.json`: instala, build, test del CLI y publica a npm con Trusted Publishing (OIDC / provenance).
- Primer publish real verificado con `npm install -g @codigoconelmer/forge-cli` y `forge-cli --help`.

**Fuera de alcance (specs futuras):**

- Publicar otros paquetes del monorepo (`@forge/web`, packages compartidos).
- Changesets u otra herramienta multi-paquete de releases.
- Homebrew, Scoop, o binarios nativos empaquetados.
- Firma adicional fuera de npm provenance (p. ej. cosign).
- Renombrar el binario a `forge` (sigue vedado por conflicto con Laravel Forge CLI / Herd).
- Cambios de features del CLI (nuevos comandos, auth, etc.).
- Publicación automática en cada merge a `main` (solo tags `v*`).
- Publicar desde `development` u otras ramas que no sean `main`.

## Modelo de datos

Esta feature no introduce estructuras de datos nuevas. Reutiliza el modelo y el paquete CLI de SPEC 02 (`apps/cli`, binario `forge-cli`).

## Plan de implementación

1. Añadir `LICENSE` MIT en la raíz del repo (o `apps/cli/LICENSE` si el publish lo requiere) y referenciarla desde `apps/cli/package.json` con `"license": "MIT"`.
2. Actualizar `apps/cli/package.json`: `name` → `@codigoconelmer/forge-cli`, quitar `private`, añadir `publishConfig.access: public`, `repository`/`homepage`/`bugs`/`engines`, y confirmar `files` + `bin` correctos. Verificar que `pnpm --filter @forge/cli build` y `pnpm --filter @forge/cli test` siguen pasando (ajustar filtros/scripts del workspace si el rename lo exige).
3. Ajustar referencias internas al nombre del paquete (README del CLI, docs/skills que digan `@forge/cli` como nombre npm) sin cambiar el binario `forge-cli`. Manual: `pnpm --filter … forge-cli -- --help` sigue funcionando en local.
4. Añadir script o chequeo de release (p. ej. en CI) que falle si el tag `vX.Y.Z` no coincide con `version` en `apps/cli/package.json`.
5. Crear `.github/workflows/publish-cli.yml`: trigger en push de tags `v*`; checkout; setup pnpm/Node; `pnpm install`; build + test del CLI; `npm publish` del paquete CLI con Trusted Publishing (OIDC) y provenance. Documentar en el README los pasos de configuración única en npm (trusted publisher → este repo/workflow). Opcionalmente rechazar tags cuyo commit no esté en `main`.
6. Actualizar `apps/cli/README.md` con instalación global npm y el flujo: merge a `main` → bump `version` en `main` → tag `vX.Y.Z` en ese commit → push tag → Actions publica.
7. Primer release: merge a `main` → bump `version` en `main` (p. ej. `0.1.0` si aún no hay publish) → tag `vX.Y.Z` en ese commit de `main` → push del tag → verificar en Actions y con `npm install -g @codigoconelmer/forge-cli` + `forge-cli --help`.

## Criterios de aceptación

- [ ] El nombre del paquete en `apps/cli/package.json` es `@codigoconelmer/forge-cli` y no está marcado como `private`.
- [ ] `publishConfig.access` es `public` y existen `license` (MIT), `repository`, `homepage`, `bugs` y `engines`.
- [ ] El binario publicado/instalado sigue siendo `forge-cli` (no `forge`).
- [ ] `pnpm build:cli` y `pnpm test:cli` pasan en el repo.
- [ ] Existe un workflow de GitHub Actions que publica solo ante tags `v*` y valida que el tag coincide con `version`.
- [ ] El workflow usa Trusted Publishing (OIDC); no requiere un `NPM_TOKEN` de larga duración en secrets para el camino feliz.
- [ ] El README indica que los releases se hacen con tags sobre `main`, no desde `development`.
- [ ] El workflow documenta/asume release desde `main` (tag apuntando a commit de `main`).
- [ ] `apps/cli/README.md` documenta `npm install -g @codigoconelmer/forge-cli` y el flujo de release por tag.
- [ ] El paquete aparece en npm como público: https://www.npmjs.com/package/@codigoconelmer/forge-cli
- [ ] Tras instalar desde npm, `forge-cli --help` muestra la ayuda sin error.

## Decisiones

- **Sí:** nombre npm `@codigoconelmer/forge-cli`. Alineado con `@codigoconelmer/driftwatch` y bajo tu scope controlado.
- **No:** nombre plano `forge-cli`. Ya existe otro paquete en npm con ese nombre (`forge-cli@0.2.1`); además no sigue tu convención de scope.
- **Sí:** binario `forge-cli` (sin cambiar a `forge`). Evita choque con Laravel Forge CLI / Herd (decisión de SPEC 02).
- **Sí:** licencia MIT. Código abierto, simple, habitual en CLIs.
- **Sí:** releases por tag git `vX.Y.Z` + GitHub Actions. Evita publicar “a mano” como único camino y no obliga a Changesets con un solo paquete publicable.
- **Sí:** Trusted Publishing (OIDC) + provenance. Evita tokens npm de larga duración en GitHub Secrets.
- **Sí:** tags de release solo desde `main`. Evita publicar trabajo en curso de `development`.
- **No:** publish disparado por pushes a `development`.
- **No:** Changesets / release-please en esta spec. Overkill mientras solo se publique el CLI.
- **No:** publish en cada push a `main`. Solo tags explícitos reducen publishes accidentales.
- **Sí:** primer publish real dentro del criterio de hecho. “Solo dejarlo listo” dejaría trabajo pendiente y riesgo de descubrir fallos tarde.
- **No:** publicar `@forge/web` u otros paquetes del monorepo aquí.

## Riesgos

| Riesgo                                                               | Mitigación                                                                                                                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag `vX.Y.Z` no coincide con `version` en `package.json`             | El workflow falla antes de `npm publish` si no coinciden.                                                                                     |
| Trusted Publisher mal configurado en npm (repo/workflow incorrectos) | Documentar el setup único en el README; el primer publish valida el camino.                                                                   |
| El tarball incluye secretos o archivos de más                        | `files: ["bin", "dist"]` + revisión de `npm pack --dry-run` antes del primer tag.                                                             |
| Filtros pnpm/`@forge/cli` se rompen al renombrar el `name`           | Mantener scripts del workspace apuntando al path `apps/cli` o actualizar el filter en el mismo paso del rename; verificar build/test locales. |
| Alguien publica una versión incorrecta por tag accidental            | Solo tags `v*`; no publish en `main`; versión debe existir y coincidir.                                                                       |
| Tag creado desde `development` con código no mergeado                | Convención documentada: solo taggear commits de `main`; opcionalmente el workflow puede rechazar tags cuyo commit no esté en `main`.          |

## Qué **no** entra en este spec

- Publicar otros paquetes del monorepo.
- Changesets / release-please.
- Homebrew, Scoop o binarios nativos.
- Firma adicional fuera de npm provenance.
- Renombrar el binario a `forge`.
- Nuevas features del CLI.
- Publish automático en cada merge a `main`.
- Publicar desde `development` u otras ramas que no sean `main`.

Cada uno de esos, si llega, va en su propio spec.
