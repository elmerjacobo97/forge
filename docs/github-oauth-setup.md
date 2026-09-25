# Configurar GitHub OAuth para Forge Web

Esta guía configura el acceso GitHub de la web de Forge. Hay dos callbacks distintos: GitHub devuelve al backend de InsForge; después, InsForge devuelve al callback de Forge. No intercambies esas URL.

## Configuración rápida

1. Crea una GitHub OAuth App para el proyecto/backend de InsForge que usarás.
2. Configura GitHub OAuth en **InsForge → Authentication → Auth Methods** y guarda allí el Client ID y Client Secret.
3. Permite en la configuración de Auth de InsForge las URL de retorno de Forge para cada entorno.
4. Define `NEXT_PUBLIC_APP_URL` en local y en producción.
5. Ejecuta las verificaciones manuales de abajo.

## Los dos callbacks

| Callback              | Quién lo registra                                         | URL                                                         |
| --------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| **GitHub → InsForge** | En la GitHub OAuth App, como _Authorization callback URL_ | `<NEXT_PUBLIC_INSFORGE_URL>/api/auth/oauth/github/callback` |
| **InsForge → Forge**  | En las URL de redirección permitidas de InsForge Auth     | `<NEXT_PUBLIC_APP_URL>/api/auth/callback`                   |

Por ejemplo, con InsForge alojado y Forge local, el callback de GitHub sigue apuntando al backend de InsForge, mientras que el callback de Forge es `http://localhost:3000/api/auth/callback`. No pongas la URL de Forge en el campo _Authorization callback URL_ de GitHub.

Si usas un backend InsForge local, su callback de GitHub suele ser `http://localhost:7130/api/auth/oauth/github/callback`. Para un backend alojado, copia su origen exacto de `NEXT_PUBLIC_INSFORGE_URL`. Si GitHub no acepta varios callbacks para los distintos backends, crea una OAuth App separada para cada backend/entorno.

## GitHub e InsForge

1. En GitHub, abre **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Registra la app. El _Homepage URL_ es el sitio de Forge; el _Authorization callback URL_ es el callback **GitHub → InsForge** de la tabla.
3. Copia el Client ID y genera un Client Secret. Trátalos como credenciales: no los pegues en el código, en este documento ni en variables `NEXT_PUBLIC_*`.
4. En el dashboard del proyecto InsForge, abre **Authentication → Auth Methods → GitHub OAuth**. Habilita el proveedor y guarda allí el Client ID y el Client Secret, o usa las credenciales compartidas que ofrece el dashboard.
5. En la configuración de redirecciones permitidas de InsForge Auth, agrega el callback **InsForge → Forge** de cada entorno. Debe coincidir exactamente, incluyendo esquema, host y ruta.

## URL de Forge por entorno

En `apps/web/.env.local`, define el origen público donde corre la web local:

```dotenv
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

En el entorno de despliegue, define la misma variable con el origen HTTPS real de Forge, sin ruta, por ejemplo `https://forge.example.com`. Añade `<NEXT_PUBLIC_APP_URL>/api/auth/callback` a las redirecciones permitidas de InsForge para ese entorno. Reinicia el servidor local tras cambiar `.env.local`.

`NEXT_PUBLIC_INSFORGE_URL` debe seguir apuntando al backend InsForge elegido. La aplicación construye el callback de Forge como `<NEXT_PUBLIC_APP_URL>/api/auth/callback`; InsForge gestiona el salto intermedio hacia GitHub.

## Verificación manual

Haz estas pruebas en local y repite las aplicables después de configurar producción:

- [ ] El botón de GitHub inicia el consentimiento y vuelve a Forge tras autorizar.
- [ ] Un primer acceso con GitHub y email verificado crea una cuenta Forge.
- [ ] Un usuario email/password y una cuenta GitHub con el mismo email verificado terminan en el mismo usuario Forge, sin duplicar cuentas.
- [ ] Si GitHub no proporciona un email utilizable y verificado, Forge vuelve a `/login` con un mensaje y no deja una sesión iniciada.
- [ ] Cancelar el consentimiento vuelve a `/login` con un mensaje.
- [ ] Un `redirect` local vuelve a esa ruta; un destino externo o que empieza con `//` no sale de Forge y usa `/dev-board`.
- [ ] Las cookies temporales `insforge_code_verifier` y `forge_oauth_redirect` son `httpOnly`, expiran en no más de 10 minutos y desaparecen tras el callback.
- [ ] El Client Secret no aparece en el repositorio, en variables públicas, JavaScript del navegador ni URL.

La asociación de cuentas por email depende del comportamiento de InsForge. No la des por verificada hasta completar la prueba de usuario existente; si InsForge no la garantiza para GitHub, revisa la spec antes de habilitar este flujo para usuarios.
