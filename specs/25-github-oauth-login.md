# SPEC 25 — Acceso web con GitHub OAuth

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-09-25
> **Objetivo:** Añadir a `/login` autenticación con GitHub mediante InsForge, permitir altas nuevas y reutilizar cuentas existentes solo cuando coincida un email verificado, conservando el destino de retorno.

## Alcance

**Incluye:**

- Añadir una opción «Continuar con GitHub» en la página existente `/login`, junto al acceso con email y contraseña.
- Usar el flujo OAuth PKCE de InsForge desde el servidor Next.js. El callback intercambia el código y establece la sesión de Forge.
- Permitir que el primer acceso válido con GitHub cree una cuenta nueva.
- Reutilizar una cuenta email/password existente solo cuando InsForge confirme que el email de GitHub coincide y está verificado. No crear ni vincular una cuenta si falta un email utilizable o su verificación; mostrar un error claro.
- Inicializar `profile.name` con el nombre de GitHub disponible. Si no hay nombre, conservar el fallback `Developer`. No sincronizarlo en accesos posteriores.
- Tras autenticar, volver a la ruta local `redirect` solicitada o a `/dev-board`. Cancelaciones y errores vuelven a `/login` con un mensaje.
- Incluir una checklist para configurar la aplicación OAuth de GitHub y el proveedor en InsForge. Los secretos permanecen en InsForge y no se guardan en el repositorio.
- Mantener sin cambios el login con email y contraseña y el manejo de sesión existente.

**Fuera de alcance (para futuras specs):**

- Login OAuth en el CLI o en el MCP. El OAuth de GitHub del MCP autoriza el acceso al servidor MCP; no es el login de usuario de Forge.
- Otros proveedores, como Google o Facebook.
- Una pantalla para vincular cuentas manualmente o administrar proveedores de acceso.
- Editar o sincronizar continuamente el nombre, el avatar u otros datos del perfil.
- Cambios de esquema, migraciones o políticas RLS.
- Restablecimiento de contraseña, magic links u otros cambios al flujo de email/password.

## Modelo de datos

No se agregan tablas, columnas ni RPC. InsForge mantiene la identidad y la sesión; Forge reutiliza su tipo `AuthUser` actual (`id`, `name`, `email`). El nombre de GitHub inicializa `profile.name` si está disponible.

El flujo OAuth usa estas cookies temporales:

```ts
type OAuthFlowCookies = {
  insforge_code_verifier: string; // PKCE verifier emitido por InsForge
  forge_oauth_redirect: string; // ruta local validada; fallback: "/dev-board"
};
```

Ambas cookies son `httpOnly`, `SameSite=Lax`, `path=/`, tienen una duración máxima de 10 minutos y usan `Secure` en producción. Se eliminan al terminar el callback, tanto si el intercambio tiene éxito como si falla. El destino guardado solo acepta rutas locales: empieza con `/` y no con `//`.

## Plan de implementación

### Grupo 1 — Flujo OAuth en el servidor

- [x] 1.1 Crear `apps/web/src/app/api/auth/callback/route.ts` para intercambiar el código PKCE con InsForge, validar email/perfil, limpiar las cookies temporales y redirigir de forma segura al destino o a `/login` con error.
- [x] 1.2 Añadir en `apps/web/src/features/auth/actions.ts` una Server Action que inicie GitHub OAuth, valide el destino local, guarde el verifier y el destino en cookies temporales y redirija a la URL de InsForge. El login por contraseña permanece intacto.
- [x] 1.3 Añadir pruebas unitarias para la acción y el callback: inicio correcto y fallido, código/verifier ausente, email no utilizable, intercambio correcto y limpieza de cookies.

### Grupo 2 — Acceso desde `/login`

- [x] 2.1 Añadir el botón de GitHub a `apps/web/src/features/auth/components/login-form.tsx`, conservando el formulario de email/password y mostrando el estado de carga.
- [x] 2.2 Leer el código de error OAuth en `apps/web/src/app/(auth)/login/page.tsx` y mostrar un mensaje claro en el formulario. Probar el botón, los errores y la conservación del login existente.

### Grupo 3 — Configuración del proveedor

- [x] 3.1 Crear `docs/github-oauth-setup.md` con los pasos para registrar GitHub OAuth y configurar InsForge, distinguiendo el callback de GitHub del callback de Forge. Usar `NEXT_PUBLIC_APP_URL`; no incluir secretos.
- [x] 3.2 Enlazar la guía desde `README.md` y documentar las verificaciones manuales de configuración local y producción.

## Criterios de aceptación

- [x] `/login` muestra el acceso con GitHub y conserva los campos y el envío de email/password.
- [ ] El primer login con un email GitHub disponible y verificado crea una cuenta Forge.
- [ ] Si ese email verificado coincide con una cuenta email/password, el login usa el mismo usuario Forge y conserva sus datos existentes.
- [x] Si GitHub no entrega un email utilizable o verificable, no se crea ni se vincula una sesión y `/login` muestra un mensaje claro.
- [ ] El nombre de GitHub inicializa `profile.name` al crear la cuenta; si no está disponible, el nombre mostrado es `Developer`. El login no sincroniza ese nombre posteriormente.
- [x] Después del OAuth, Forge vuelve al `redirect` local solicitado o a `/dev-board` si no hay destino válido. Un destino externo o `//...` nunca recibe la redirección.
- [x] Cancelar GitHub o recibir un error OAuth devuelve a `/login` con un mensaje y sin dejar una sesión parcial.
- [x] `insforge_code_verifier` y `forge_oauth_redirect` son cookies `httpOnly`, expiran como máximo en 10 minutos y se eliminan al finalizar el callback. Los tokens no aparecen en JavaScript ni en la URL.
- [x] La guía permite configurar GitHub e InsForge en local y producción; no contiene Client ID/Secret reales ni se agregan secretos al repositorio.
- [ ] Las pruebas unitarias del inicio OAuth, callback y formulario pasan sin conectarse a un InsForge real. La creación y vinculación por email verificado se comprueban manualmente contra el proveedor configurado.
- [x] No hay cambios en CLI, MCP, migraciones ni esquema de datos.

## Decisiones

- **Sí:** GitHub OAuth se añade solo a la web, en `/login`, junto al login con email/password. El OAuth existente del MCP es independiente.
- **No:** Cambiar el login del CLI o MCP, ni añadir otros proveedores en esta spec.
- **Sí:** El primer acceso válido con GitHub puede crear una cuenta. No se añade una página de registro aparte.
- **Sí:** Reutilizar una cuenta email/password cuando el email de GitHub coincida y esté verificado. No unir cuentas usando un email sin verificar; tampoco se añade una pantalla de vinculación manual.
- **Sí:** Si el proveedor no entrega un email utilizable y verificado, detener el flujo y mostrar un error. No crear una identidad incompleta.
- **Sí:** Usar el nombre de GitHub para inicializar `profile.name` si está disponible y conservar el fallback `Developer`.
- **No:** Sincronizar el perfil en logins posteriores, importar avatar ni añadir gestión de perfil.
- **Sí:** Conservar el destino local solicitado y volver a `/dev-board` por defecto. Los errores y cancelaciones regresan a `/login`.
- **Sí:** Usar el OAuth PKCE SSR de InsForge, con cookies temporales `httpOnly`; el callback intercambia el código en el servidor.
- **No:** Exponer tokens o secretos de GitHub en el navegador o guardarlos en el repositorio. La configuración se documenta para GitHub e InsForge.
- **No:** Añadir tablas, columnas, RPC, migraciones o cambios RLS. Se reutiliza la identidad InsForge existente.

## Riesgos

| Riesgo                                                                                                                                                | Mitigación                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La documentación de InsForge consultada describe asociación automática de email para Google, pero no confirma que GitHub enlace por email verificado. | Verificar manualmente el caso GitHub existente + cuenta email/password con el mismo email verificado. No fusionar cuentas desde el cliente; si InsForge no garantiza el enlace, revisar esta spec antes de implementar esa parte. |
| GitHub puede no proporcionar un email utilizable/verificado, por lo que algunas personas no podrán usar este acceso.                                  | Mostrar un mensaje claro y conservar el acceso alternativo con email/password.                                                                                                                                                    |
| Un callback de GitHub o InsForge mal configurado puede interrumpir el retorno a Forge.                                                                | La guía distingue el callback registrado en GitHub del retorno a la ruta de Forge, y cubre configuración local y producción.                                                                                                      |
| GitHub puede no proporcionar un nombre de perfil.                                                                                                     | Mantener `Developer` como fallback.                                                                                                                                                                                               |

## Qué **no** está en esta spec

- Login OAuth en el CLI o en el MCP; el OAuth de GitHub del MCP sigue siendo una autorización distinta.
- Otros proveedores, como Google o Facebook.
- Vinculación manual de cuentas, edición o sincronización del perfil y avatar.
- Restablecimiento de contraseña, magic links, migraciones, cambios de esquema o políticas RLS.

Cada uno, si llega, va en su propia spec.
