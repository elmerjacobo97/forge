# SPEC 15 — Generador de contraseñas

> **Estado:** Approved
> **Depende de:** Ninguna
> **Fecha:** 2026-08-17
> **Objetivo:** Añadir una herramienta autenticada que genere en el navegador una contraseña criptográficamente aleatoria y configurable, permita regenerarla o copiarla y no persista su valor.

## Scope

**Incluye:**

- Crear feature `apps/web/src/features/password-generator/`.
- Añadir ruta autenticada `/password-generator`.
- Registrar `password-generator` en `apps/web/src/lib/tools.ts` dentro de `Generators`.
- Mostrar la herramienta como utility tool en la landing.
- Generar una contraseña por acción usando `crypto.getRandomValues`.
- Generar una contraseña inicial al cargar la página.
- Permitir longitud de 8 a 128 caracteres, con 20 como valor inicial.
- Activar por defecto mayúsculas, minúsculas, números y símbolos.
- Usar el conjunto de símbolos `!@#$%^&*()-_=+[]{};:,.?`.
- Garantizar al menos un carácter de cada conjunto activo.
- Mostrar la contraseña generada de forma visible.
- Mostrar indicador de entropía: débil `<40`, media `40–79`, fuerte `≥80` bits.
- Permitir regenerar y copiar la contraseña.
- Gestionar copia mediante helper local de la feature.
- Mostrar error inline si Clipboard API falla.
- Bloquear la generación y explicar el problema si `crypto.getRandomValues` no está disponible.
- Conservar el resultado al cambiar opciones y mostrar aviso hasta pulsar `Regenerate`.
- Mantener textos y mensajes visibles en inglés.
- Añadir pruebas unitarias, pruebas de componente y smoke manual en desktop y móvil.
- No modificar componentes bajo `apps/web/src/components/ui`.

**Fuera de alcance:**

- Bóveda de contraseñas, credenciales, autocompletado o extensión de navegador.
- Persistencia en base de datos, `localStorage`, URL, logs o historial.
- Sincronización entre dispositivos.
- Endpoint, Server Action, API pública o soporte CLI.
- Generación de lotes o historial de resultados.
- Passphrases o conjuntos de símbolos configurables.
- Fallback basado en `Math.random`.
- Mejorar globalmente `useCopy`.
- Crear componentes compartidos fuera de la feature.
- Promocionar la herramienta como spotlight en la landing.

## Data model

Esta feature no introduce datos persistidos. Todo el estado vive temporalmente en React y desaparece al salir o recargar la página.

```ts
type CharacterSet = "uppercase" | "lowercase" | "numbers" | "symbols";

type PasswordOptions = {
  length: number; // 8–128
  enabledSets: Record<CharacterSet, boolean>;
};

type StrengthLevel = "weak" | "medium" | "strong";

type PasswordStrength = {
  entropyBits: number;
  level: StrengthLevel;
};

type PasswordGeneratorState = {
  options: PasswordOptions;
  password: string;
  strength: PasswordStrength | null;
  needsRegeneration: boolean;
  copyStatus: "idle" | "success" | "error";
  error: string | null;
};
```

Reglas:

- `length` inicia en `20`.
- Los cuatro conjuntos inician activos.
- `password` nunca se persiste, serializa en URL, registra en logs ni envía al servidor.
- `needsRegeneration` se activa al cambiar opciones después de generar.
- La entropía estimada usa `length × log2(poolSize)`.
- La clasificación usa `<40` débil, `40–79` media y `≥80` fuerte.
- La generación requiere al menos un conjunto activo.

## Implementation plan

1. Añadir `@testing-library/react` y `@testing-library/dom` como dependencias de desarrollo en `apps/web/package.json`; usar `jsdom` solo en el test de componente mediante directiva de Vitest. Actualizar `pnpm-lock.yaml`.
2. Crear `apps/web/src/features/password-generator/utils/password.ts` con alfabetos, validación, generación criptográfica, cobertura de conjuntos, entropía y clasificación. Añadir `utils/password.test.ts` para cubrir límites, caracteres, conjuntos activos, errores y umbrales.
3. Crear `apps/web/src/features/password-generator/password-generator.tsx` y el helper local de portapapeles. Añadir `password-generator.test.tsx` para cubrir generación inicial, regeneración, aviso de configuración pendiente, copia exitosa, error de copia y ausencia de `crypto`.
4. Crear `apps/web/src/app/(authenticated)/password-generator/page.tsx` y añadir `/password-generator` a `apps/web/src/proxy.ts` para proteger la ruta con la sesión existente.
5. Registrar la herramienta en `apps/web/src/lib/tools.ts` con id `password-generator`, ruta `/password-generator`, categoría `Generators` e icono existente. Añadirla a `utilityIds` en `apps/web/src/features/landing/components/landing-tools.tsx`.
6. Ajustar estados accesibles y responsive: labels asociados, `aria-live` para resultado y errores, foco visible, controles utilizables en móvil y ausencia de serialización o logging del valor. Ejecutar smoke manual en `1440×900` y `390×844`.

## Acceptance criteria

- [ ] Usuario autenticado puede abrir `/password-generator`.
- [ ] Usuario no autenticado es redirigido al flujo de login existente.
- [ ] La herramienta aparece en sidebar, command palette y landing como utility tool.
- [ ] La página genera una contraseña inicial sin interacción adicional.
- [ ] La contraseña inicial tiene 20 caracteres.
- [ ] Longitud acepta valores entre 8 y 128.
- [ ] Mayúsculas, minúsculas, números y símbolos están activos por defecto.
- [ ] El conjunto de símbolos usado es exactamente `!@#$%^&*()-_=+[]{};:,.?`.
- [ ] La salida contiene al menos un carácter de cada conjunto activo.
- [ ] La salida tiene exactamente la longitud configurada.
- [ ] Desactivar todos los conjuntos bloquea la generación y muestra error inline.
- [ ] Generación usa `crypto.getRandomValues` y no usa `Math.random` como fallback.
- [ ] La ausencia de `crypto.getRandomValues` bloquea la generación y muestra explicación.
- [ ] `Regenerate` reemplaza una única contraseña sin recargar la página.
- [ ] Cambiar opciones conserva la salida actual y muestra aviso para regenerar.
- [ ] El indicador calcula entropía estimada y clasifica `<40` como débil, `40–79` como media y `≥80` como fuerte.
- [ ] Copiar muestra confirmación cuando Clipboard API termina correctamente.
- [ ] Un fallo de Clipboard API muestra error inline y conserva la contraseña visible.
- [ ] La contraseña no se guarda en base de datos, `localStorage`, URL, logs, queries ni requests.
- [ ] Todos los textos visibles están en inglés.
- [ ] Controles tienen labels accesibles, foco visible y resultado/errores anunciables.
- [ ] Interfaz funciona en `1440×900` y `390×844`.
- [ ] No se modifican archivos bajo `apps/web/src/components/ui`.
- [ ] Tests unitarios y de componente pasan.
- [ ] `pnpm build:web` termina correctamente.
- [ ] `pnpm test:web` termina correctamente.
- [ ] `pnpm lint` termina correctamente.
- [ ] `git diff --check` termina correctamente.

## Decisions

- **Sí:** crear una herramienta independiente `/password-generator`; encaja con la arquitectura de utilities de Forge.
- **No:** crear una bóveda, porque requiere cifrado, persistencia, recuperación y otra spec.
- **Sí:** generar en navegador con `crypto.getRandomValues`; evita enviar contraseñas al servidor.
- **No:** usar `Math.random` como fallback; no garantiza seguridad criptográfica.
- **Sí:** mantener estado únicamente en React; evita persistir secretos.
- **No:** usar base de datos, `localStorage`, URL, historial o sincronización.
- **Sí:** generar una contraseña por acción; mantiene UI y exposición mínima.
- **No:** generar lotes o implementar historial.
- **Sí:** usar longitud configurable y toggles de conjuntos; ofrece control sin añadir presets rígidos.
- **Sí:** usar 20 caracteres por defecto y rango 8–128.
- **Sí:** exigir un carácter de cada conjunto activo; hace efectiva la selección del usuario.
- **Sí:** usar símbolos ASCII compatibles; evita problemas frecuentes de compatibilidad.
- **No:** permitir alfabetos de símbolos personalizados en esta spec.
- **Sí:** mostrar la contraseña visible con indicador de entropía; facilita inspección y copia.
- **Sí:** conservar el resultado al cambiar opciones y mostrar aviso; evita reemplazos accidentales.
- **Sí:** usar helper local para Clipboard API; evita modificar `useCopy` y sus consumidores.
- **No:** modificar componentes shadcn/ui o crear componentes compartidos.
- **Sí:** integrar catálogo, sidebar, command palette y landing utility.
- **Sí:** mantener textos visibles en inglés para seguir el producto existente.
- **Sí:** añadir tests unitarios y de componente con Testing Library, además de smoke manual.
- **No:** añadir endpoint, Server Action, soporte CLI o API pública.

## Risks

| Riesgo                                                                         | Mitigación                                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `crypto.getRandomValues` no está disponible o la página no usa contexto seguro | Bloquear generación y mostrar explicación; no usar fallback inseguro.                |
| Selección aleatoria con sesgo estadístico                                      | Usar selección uniforme con rechazo y cubrirla con tests deterministas.              |
| La garantía de un carácter por conjunto hace que la entropía sea estimada      | Etiquetar el valor como estimado y calcularlo según longitud y pool disponible.      |
| Clipboard API falla por permisos o navegador                                   | Capturar rechazo, mostrar error inline y conservar la contraseña visible.            |
| Usuario cambia opciones pero copia contraseña anterior                         | Mantener `needsRegeneration` y mostrar aviso hasta regenerar.                        |
| Contraseña larga desborda en móvil                                             | Usar layout responsive y permitir lectura completa sin romper controles.             |
| Ruta queda pública por olvidar `proxy.ts`                                      | Añadir `/password-generator` a la lista de rutas protegidas y verificar redirección. |
| Catálogo y landing quedan desincronizados                                      | Actualizar `tools.ts` y `landing-tools.tsx` en el mismo cambio.                      |
| Test de componente falla por entorno `node`                                    | Usar Testing Library y directiva `jsdom` únicamente en el test de componente.        |
| El valor aparece accidentalmente en logs o URLs                                | Mantenerlo en estado efímero y evitar serialización, telemetría y requests.          |

## Qué **no** está en esta spec

- Bóveda de contraseñas o gestión de credenciales.
- Persistencia, historial o sincronización.
- Autocompletado o extensión de navegador.
- API, backend, Server Action o soporte CLI.
- Generación por lotes.
- Passphrases o alfabetos personalizados.
- Fallback con `Math.random`.
- Modificación de `useCopy` global.
- Modificación de componentes shadcn/ui.
- Nuevos componentes compartidos.

Cada elemento futuro deberá definirse en su propia spec.
