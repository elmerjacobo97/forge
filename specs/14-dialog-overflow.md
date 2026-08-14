# SPEC 14 — Control de overflow en dialogs

> **Estado:** Implementado
> **Fecha:** 2026-08-14
> **Objetivo:** Evitar que el contenido largo de los dialogs de la aplicación web supere `90vh`, manteniendo header y footer accesibles mediante scroll interno del cuerpo.

## Resumen

Auditar los dialogs bajo `apps/web/src` y aplicar límites de altura locales. Los formularios conservarán sus datos, APIs, persistencia y validaciones actuales; el cambio se limita al layout y al comportamiento visual del scroll.

## Alcance

**Incluye:**

- Aplicar `max-h-[90vh]` y `overflow-hidden` a los dialogs de formularios con riesgo de crecer verticalmente.
- Mantener `DialogHeader` y `DialogFooter` fuera del área desplazable.
- Hacer desplazable el cuerpo del formulario con scroll nativo.
- Limitar descripciones de tickets, proyectos y bookmarks a `max-h-48`, con `overflow-y-auto` y resize vertical.
- Limitar el campo `Context` general de resources con el mismo patrón.
- Conservar el editor de contenido de resources en `max-h-52`, `overflow-y-auto` y `resize-none`.
- Conservar y armonizar los límites existentes de resources, uptime monitor y command palette.
- Verificar manualmente en `1440×900` y `390×844`.

**Fuera de alcance:**

- Crear un componente global `DialogBody`.
- Modificar globalmente `Textarea` o `InputGroupTextarea`.
- Modificar cualquier archivo bajo `apps/web/src/components/ui` (primitives shadcn/ui).
- Cambiar datos, APIs, persistencia, schemas o validaciones funcionales.
- Añadir tests automatizados específicos de layout.
- Modificar `specs/.spec-config.yml`.

## Archivos y patrones afectados

- `features/bookmarks/components/add-bookmark-dialog.tsx` y `edit-bookmark-dialog.tsx`: cuerpo desplazable y descripción limitada.
- `features/dev-board/components/project-form.tsx` y `ticket-form.tsx`: cuerpo desplazable y descripción limitada.
- `features/resources/components/add-resource-dialog.tsx` y `edit-resource-dialog.tsx`: límite de dialog y wrapper de cuerpo existente.
- `features/resources/components/resource-form-fields.tsx`: límite del contexto general; el editor de contenido especializado permanece en `max-h-52`.
- `features/uptime-monitor/components/monitor-form-dialog.tsx`: conservar el header y footer accesibles separando el cuerpo scrollable.
- `components/command-palette.tsx`: añadir el límite de altura del consumidor y conservar el patrón de lista existente; el primitive shadcn/ui queda intacto.

Los dialogs de confirmación y formularios simples sin riesgo de overflow permanecen sin cambios.

## Plan de implementación

1. Añadir clases locales `max-h-[90vh]`, `overflow-hidden` y filas de grid que permitan reducir el cuerpo sin afectar header/footer.
2. Envolver o marcar el contenido del formulario con `min-h-0 overflow-y-auto`, dejando los botones fuera del viewport desplazable.
3. Añadir `max-h-48 overflow-y-auto resize-y` a descripciones y contexto general.
4. Mantener `max-h-52 overflow-y-auto resize-none` en el contenido de resources y `max-h-72 overflow-y-auto` en la lista del command palette.
5. Ejecutar `pnpm build:web`, `pnpm test:web`, `pnpm lint` y `git diff --check`.

## Criterios de aceptación

- [ ] Ningún dialog afectado supera `90vh` en viewport `1440×900` o `390×844`.
- [ ] Header, footer y botones permanecen visibles y accesibles mientras el cuerpo hace scroll.
- [ ] Descripciones de tickets, proyectos y bookmarks permiten resize vertical, pero no crecen más allá de `max-h-48` y desplazan su contenido internamente.
- [ ] El contexto general de resources usa el mismo límite y scroll.
- [ ] El editor de contenido de resources conserva `max-h-52`, scroll interno y `resize-none`.
- [ ] La lista del command palette conserva scroll nativo y su límite existente.
- [ ] No cambian datos, APIs, persistencia ni validaciones.
- [ ] Las validaciones indicadas terminan correctamente.

## Decisiones

- **Sí:** usar clases y wrappers locales para evitar imponer scroll a dialogs simples.
- **No:** modificar globalmente `DialogContent`, `Textarea` o `InputGroupTextarea`, porque existen usos fuera de dialogs con necesidades distintas.
- **Sí:** usar scrollbars nativos visibles en los cuerpos desplazables.
- **Sí:** usar `resize-y` solo en campos generales y conservar `resize-none` para el editor especializado de resources.
- **No:** añadir tests UI automatizados; la aceptación visual se verifica manualmente en los dos tamaños indicados.
- **Excepción:** el command palette conserva `no-scrollbar` del primitive shadcn/ui; la regla de no modificar `apps/web/src/components/ui` tiene prioridad.

## Riesgos

| Riesgo                                                                                            | Mitigación                                                                        |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| El grid del dialog conserva el tamaño mínimo del formulario y empuja el footer fuera del viewport | Usar `min-h-0` en el cuerpo y filas `minmax(0,1fr)` en los dialogs afectados.     |
| Un textarea con `field-sizing-content` vuelve a expandir el dialog                                | Aplicar límites y `overflow-y-auto` localmente en cada campo multilinea afectado. |
| Un cambio global rompe herramientas que usan Textarea fuera de dialogs                            | No tocar los primitives; limitar las clases a los consumidores afectados.         |

## Qué no está en esta spec

- Un nuevo componente compartido `DialogBody`.
- Cambios de lógica, validación, persistencia, API o modelo de datos.
- Rediseño de dialogs simples sin contenido multilinea o listas largas.
