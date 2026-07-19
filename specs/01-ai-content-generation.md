# SPEC 01 — Generación de contenido con IA

> **Status:** Approved
> **Depends on:** Ninguna
> **Date:** 2026-07-18
> **Objective:** Añadir generación segura con Groq para completar los campos derivados de Bookmarks y Snippets desde sus formularios.

## Alcance

**Incluye:**

- Crear `functions/ai-content-generator/` como Appwrite Function en Node.js y TypeScript.
- Usar Groq con `openai/gpt-oss-20b` y `GROQ_API_KEY` almacenada únicamente en el entorno de la Function.
- Aceptar dos modos de generación: `bookmark` y `snippet`.
- Generar para Bookmarks `category`, `description` en inglés y entre 3 y 5 tags únicos en minúsculas, usando `title`, `url` y contenido público extraído de la página.
- Limitar el fetch de Bookmarks a URLs HTTP(S) públicas, bloqueando redes privadas y aplicando límites de tiempo, redirecciones y tamaño.
- Generar para Snippets `kind`, `content` en inglés, `language` y entre 3 y 5 tags únicos en minúsculas usando únicamente `title`.
- Limitar el contenido generado para Snippets a 4.000 caracteres.
- Dejar `language` vacío para `note` y `prompt`; usar un identificador técnico para `config` y `snippet`.
- Añadir un icon button dentro de `Description` para Bookmarks y dentro de `Content` para Snippets.
- Deshabilitar el botón hasta tener entradas válidas, mostrar carga durante la solicitud y proporcionar tooltip y nombre accesible.
- Rellenar los campos derivados sin guardar automáticamente; el usuario podrá revisar y editar antes de guardar.
- Mostrar un toast ante errores, conservar los valores actuales y permitir reintentar.
- Permitir ejecuciones únicamente a usuarios autenticados.
- Registrar la Function en `appwrite.config.json` y conectar la web mediante el SDK compartido de Appwrite.
- Eliminar la configuración local de clave y modelo Groq, dejando únicamente General Settings.
- Añadir pruebas unitarias, ejecutar el build y documentar una comprobación manual de ambos formularios.

**Fuera de alcance:**

- Generar o modificar `title` y `url`.
- Añadir una URL o instrucciones adicionales al formulario de Snippets.
- Guardar automáticamente el resultado generado.
- Generar contenido al editar registros existentes.
- Permitir uso anónimo de la Function.
- Elegir proveedor o modelo desde la interfaz.
- Conservar claves de Groq en `sessionStorage`, `localStorage` o variables `VITE_*`.
- Usar Groq Compound, búsqueda web del proveedor u otros proveedores de IA.
- Desplegar la Function en un proyecto Appwrite remoto; esta spec entrega código y configuración versionados.
- Añadir pruebas end-to-end automatizadas.

## Modelo de datos

La persistencia existente de `Bookmark` y `Snippet` no cambia. La generación solo completa sus campos actuales antes de guardarlos.

```ts
type AiGenerationRequest =
  | {
      type: "bookmark";
      title: string;
      url: string;
    }
  | {
      type: "snippet";
      title: string;
    };

type BookmarkGeneration = {
  category: "docs" | "git" | "tool" | "article" | "other";
  description: string; // 5-200 caracteres
  tags: string[]; // 3-5 valores únicos en minúsculas
};

type SnippetGeneration = {
  kind: "note" | "prompt" | "config" | "snippet";
  content: string; // 1-4.000 caracteres
  language: string | null;
  tags: string[]; // 3-5 valores únicos en minúsculas
};

type AiGenerationResponse =
  | {
      type: "bookmark";
      data: BookmarkGeneration;
    }
  | {
      type: "snippet";
      data: SnippetGeneration;
    };
```

Contexto interno extraído para Bookmarks:

```ts
type FetchedPageContext = {
  finalUrl: string;
  title: string | null;
  description: string | null;
  text: string;
};
```

Errores públicos de la Function:

```ts
type AiGenerationErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "URL_NOT_ALLOWED"
  | "FETCH_FAILED"
  | "GENERATION_FAILED"
  | "INVALID_RESPONSE";

type AiGenerationError = {
  error: {
    code: AiGenerationErrorCode;
    message: string;
  };
};
```

Configuración nueva:

- `GROQ_API_KEY`: variable secreta disponible solo en `ai-content-generator`.
- `VITE_APPWRITE_AI_CONTENT_FUNCTION_ID`: identificador público usado por la web para ejecutar la Function.
- Modelo fijo en servidor: `openai/gpt-oss-20b`.
- No se añaden tablas, columnas ni documentos nuevos en Appwrite.

## Plan de implementación

1. Añadir `functions/*` a `pnpm-workspace.yaml` y crear `functions/ai-content-generator/` como paquete TypeScript ejecutable, con `package.json`, `tsconfig.json` y un handler mínimo en `src/main.ts`.
2. Definir y validar en la Function las solicitudes `bookmark` y `snippet`, las respuestas discriminadas y los errores públicos; añadir pruebas para entradas válidas, campos ausentes y modos desconocidos.
3. Implementar la validación segura de URLs y la extracción HTML en `src/fetch-page.ts`, bloqueando hosts locales y redes privadas, y limitando redirecciones, tiempo y tamaño; cubrir estos casos con pruebas unitarias.
4. Implementar en `src/generate-content.ts` el cliente Groq, los prompts en inglés y los JSON Schema estrictos para `openai/gpt-oss-20b`; validar límites, enums, tags y respuesta del modelo mediante mocks.
5. Conectar autenticación, extracción web y generación en `src/main.ts`, traduciendo cada fallo al código público correspondiente sin exponer detalles internos ni `GROQ_API_KEY`.
6. Registrar `ai-content-generator` en `appwrite.config.json`, incluyendo runtime, build, entrypoint y permisos de ejecución solo para usuarios autenticados.
7. Crear `apps/web/src/features/ai-generation/services/ai-generation-service.ts` y sus esquemas/tipos para ejecutar la Function, interpretar su respuesta y rechazar respuestas inválidas; añadir pruebas unitarias con Appwrite simulado.
8. Exportar el singleton `functions` desde `apps/web/src/lib/appwrite.ts` y documentar `VITE_APPWRITE_AI_CONTENT_FUNCTION_ID` en `apps/web/.env.example`.
9. Integrar generación en `add-bookmark-dialog.tsx`: validar `title` y `url`, mostrar el botón dentro de Description, controlar carga y aplicar `category`, `description` y `tagsString` sin guardar.
10. Integrar generación en `add-snippet-dialog.tsx`: validar `title`, mostrar el botón dentro de Content, controlar carga y aplicar `kind`, `content`, `language` y `tagsString` sin guardar.
11. Añadir tooltip, nombre accesible, estado deshabilitado, spinner y manejo por toast en ambos botones, conservando el formulario ante cualquier fallo.
12. Eliminar `ai-settings-tab.tsx`, `use-settings.ts`, los tipos y claves locales de Groq; simplificar `settings.tsx` para mostrar únicamente General Settings.
13. Actualizar scripts raíz para que `pnpm build` y `pnpm test` verifiquen tanto `@forge/web` como `@forge/ai-content-generator`, manteniendo comandos filtrados para ejecutar cada paquete por separado.
14. Actualizar `AGENTS.md` con el nuevo paquete, comandos enfocados, variables de entorno y frontera entre navegador y Function.

## Criterios de aceptación

- [ ] `pnpm install` reconoce `@forge/web` y `@forge/ai-content-generator` como paquetes del workspace.
- [ ] `pnpm build` completa el typecheck y build de ambos paquetes sin errores.
- [ ] `pnpm test` ejecuta y aprueba las pruebas de la web y de la Function.
- [ ] `appwrite.config.json` contiene `ai-content-generator` con runtime, entrypoint, build y permisos para usuarios autenticados.
- [ ] `GROQ_API_KEY` solo se lee desde el entorno server-side de la Function.
- [ ] Ningún archivo servido al navegador contiene o solicita una clave Groq.
- [ ] Una ejecución no autenticada es rechazada con `UNAUTHORIZED`.
- [ ] Solicitudes con modo o campos inválidos son rechazadas con `INVALID_INPUT`.
- [ ] El modo `bookmark` rechaza protocolos distintos de HTTP(S), localhost, direcciones loopback y redes privadas.
- [ ] El fetch de Bookmarks aplica límites verificables de redirecciones, tiempo y tamaño.
- [ ] Una respuesta HTML válida produce contexto limitado con URL final, título, descripción y texto visible.
- [ ] Groq usa exactamente `openai/gpt-oss-20b` y salida estructurada estricta.
- [ ] La respuesta de Bookmark contiene una categoría permitida, descripción de 5 a 200 caracteres y entre 3 y 5 tags únicos en minúsculas.
- [ ] La respuesta de Snippet contiene un tipo permitido, contenido de 1 a 4.000 caracteres y entre 3 y 5 tags únicos en minúsculas.
- [ ] `language` queda vacío para `note` y `prompt`, y contiene un identificador técnico para `config` y `snippet`.
- [ ] El botón IA de Bookmark permanece deshabilitado hasta tener `title` válido y URL válida.
- [ ] El botón IA de Snippet permanece deshabilitado hasta tener `title` válido.
- [ ] Cada botón aparece dentro de su textarea, tiene tooltip, nombre accesible y spinner durante la solicitud.
- [ ] Una generación exitosa rellena todos los campos derivados sin crear automáticamente el registro.
- [ ] El usuario puede modificar los valores generados antes de guardar.
- [ ] Un fallo de fetch, Groq o validación muestra un toast, conserva todos los valores actuales y permite reintentar.
- [ ] Una respuesta incompleta o ajena al esquema no modifica parcialmente el formulario.
- [ ] La configuración de clave y modelo Groq ya no aparece en Settings ni se guarda en `sessionStorage`.
- [ ] La prueba manual contra una Function de desarrollo configurada completa correctamente un Bookmark basado en `https://namethatui.com/`.
- [ ] La prueba manual contra una Function de desarrollo configurada completa correctamente un Snippet usando solo su título.

## Decisiones

- **Sí:** Appwrite Function para ejecutar Groq. Protege la clave y aprovecha infraestructura existente.
- **No:** llamadas directas a Groq desde el navegador. Expondrían la clave o exigirían credenciales por usuario.
- **Sí:** Groq con `openai/gpt-oss-20b`. Ofrece salida estructurada con menor latencia y consumo que `openai/gpt-oss-120b`.
- **No:** `openai/gpt-oss-120b` en esta versión. Capacidad adicional no justifica mayor costo para este alcance.
- **Sí:** un único `ai-content-generator` con modos discriminados. Evita duplicar cliente, validación y manejo de errores.
- **No:** Functions separadas para Bookmarks y Snippets. Añadirían configuración y despliegues duplicados.
- **Sí:** JSON Schema estricto y validación local de la respuesta. Ningún dato del modelo se considera confiable sin validar.
- **Sí:** fetch server-side controlado para Bookmarks. La URL sola no aporta contexto fiable.
- **No:** Groq Compound o búsqueda web del proveedor. El fetch propio permite límites y comportamiento predecible.
- **Sí:** bloqueo de hosts locales y redes privadas. La Function no debe convertirse en un vector SSRF.
- **Sí:** parser HTML dedicado. Es más fiable que regex para extraer metadatos y texto visible.
- **Sí:** usuarios autenticados exclusivamente. Reduce abuso y consumo no atribuido.
- **Sí:** generación en inglés. Coincide con la interfaz y los datos actuales.
- **Sí:** Snippets se generan únicamente desde `title`. No se añade URL ni campo de instrucciones.
- **Sí:** rellenar el formulario sin guardar. El usuario conserva control sobre el resultado final.
- **No:** aplicar solo campos vacíos. La acción explícita de generar debe producir una propuesta completa y coherente.
- **Sí:** icon button dentro de Description y Content. Mantiene la acción junto al resultado que genera.
- **Sí:** toast de error y formulario intacto. Un fallo externo no debe destruir trabajo manual.
- **Sí:** eliminar clave y modelo Groq de Settings y `sessionStorage`. El servidor pasa a ser la única fuente de configuración.
- **No:** selector de proveedor o modelo. Queda fuera hasta existir una necesidad concreta.
- **Sí:** código y configuración Appwrite versionados.
- **No:** despliegue remoto obligatorio y pruebas E2E en esta spec. Requieren credenciales e infraestructura externa.

## Riesgos

| Riesgo                                                     | Mitigación                                                                                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| SSRF mediante IP privada, DNS rebinding o redirección      | Validar protocolo y host, resolver direcciones antes de conectar y repetir validación después de cada redirección.               |
| Página lenta, enorme o con redirecciones infinitas         | Aplicar timeout, máximo de redirecciones, límite de bytes y cancelación de descarga.                                             |
| Prompt injection dentro del contenido HTML                 | Tratar el contenido extraído como datos no confiables, delimitarlo en el prompt y aceptar únicamente el JSON Schema esperado.    |
| HTML sin metadata o con texto inutilizable                 | Combinar título, meta description y texto visible; devolver `FETCH_FAILED` si no existe contexto suficiente.                     |
| Respuesta inválida o fuera de límites                      | Usar salida estructurada estricta y validar nuevamente con Zod antes de responder o modificar el formulario.                     |
| Abuso por usuarios autenticados o consumo inesperado       | Restringir permisos de ejecución y conservar logs server-side; rate limiting avanzado queda para otra spec si resulta necesario. |
| Groq elimina o cambia `openai/gpt-oss-20b`                 | Centralizar el identificador del modelo y traducir errores del proveedor a `GENERATION_FAILED` sin fallback silencioso.          |
| Contenido generado incorrecto o inseguro                   | No guardar automáticamente y exigir revisión explícita del usuario antes de persistir.                                           |
| Diferencias entre entorno local y Function desplegada      | Versionar runtime, build, entrypoint y variables requeridas en configuración y documentación.                                    |
| Eliminación de una clave Groq guardada en la sesión actual | Retirar las claves sin migración; `sessionStorage` era temporal y dejará de ser fuente válida.                                   |

## Lo que **no** incluye esta spec

- Generación o modificación de títulos y URLs.
- URL o instrucciones adicionales para Snippets.
- Guardado automático de resultados.
- Generación durante la edición de registros existentes.
- Uso anónimo de IA.
- Claves Groq en navegador.
- Selección de proveedor o modelo desde Settings.
- Groq Compound, búsqueda web o proveedores alternativos.
- Rate limiting avanzado, cuotas por usuario o métricas de consumo.
- Despliegue remoto obligatorio.
- Pruebas end-to-end automatizadas.

Cada ampliación deberá definirse en una spec independiente.
