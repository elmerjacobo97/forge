# Forge

> El toolkit web para desarrolladores modernos.

## Visión

Forge es una aplicación web diseñada para centralizar las utilidades que los desarrolladores utilizan diariamente en un solo lugar, con una experiencia rápida, moderna y accesible desde cualquier navegador, sin instalación.

En lugar de depender de decenas de sitios web, pequeñas herramientas online dispersas o scripts personales, Forge ofrece una colección de utilidades integradas — más un backend propio (Appwrite) para lo que necesita persistir — para mejorar la productividad del desarrollo de software.

Nuestro objetivo es convertirnos en la pestaña que todo desarrollador abre al iniciar su jornada de trabajo.

---

# Problema

Los desarrolladores cambian constantemente entre múltiples herramientas para realizar tareas simples:

- Formatear JSON.
- Generar UUIDs.
- Decodificar JWT.
- Convertir timestamps.
- Codificar y decodificar Base64.
- Probar expresiones regulares.
- Convertir colores.
- Generar hashes.
- Crear códigos QR.
- Validar archivos.
- Manipular texto.

Cada cambio de contexto implica:

- pérdida de tiempo;
- dependencia de sitios de terceros con anuncios, límites o downtime;
- distracciones;
- posibles riesgos de privacidad al compartir datos sensibles con servicios que no controlas.

---

# Solución

Forge reúne todas estas utilidades en una única aplicación web, priorizando:

- velocidad;
- privacidad razonable (tus datos, tu cuenta, tu backend);
- experiencia de usuario;
- acceso instantáneo desde cualquier navegador, sin instalar nada;
- interfaz consistente.

La filosofía del producto es simple:

> "Todo lo que un desarrollador necesita, en una sola pestaña."

---

# Público objetivo

## Principal

Desarrolladores de software.

- Frontend
- Backend
- Full Stack
- Mobile
- DevOps
- QA Automation

---

## Secundario

Profesionales técnicos que trabajan con datos y herramientas de desarrollo.

- Ingenieros de software
- Arquitectos
- Estudiantes
- Profesores
- Equipos técnicos

---

# Propuesta de valor

Forge permite ahorrar tiempo eliminando tareas repetitivas y reduciendo el cambio constante entre pestañas y páginas web dispersas.

Beneficios principales:

- Todas las utilidades en un solo lugar, sin instalar nada.
- Herramientas de cómputo puro (formatters, converters, generators) corren 100% en el navegador — el dato sensible no sale del cliente salvo que la herramienta lo requiera explícitamente (HTTP Tester, generación asistida por IA).
- Lo que necesita persistir (bookmarks, snippets, Dev Board) vive en tu propia cuenta Appwrite, no en un tercero anónimo.
- Interfaz moderna y consistente.
- Herramientas optimizadas para flujos de trabajo reales.
- Actualizaciones frecuentes con nuevas utilidades.

---

# Principios del producto

## Simplicidad

Cada herramienta debe resolver un problema específico sin complejidad innecesaria.

---

## Rapidez

Abrir una utilidad y utilizarla debe tomar segundos, sin login para las herramientas de cómputo puro.

---

## Privacidad

Las herramientas de cómputo puro procesan todo client-side; nada se envía a un servidor. Lo que sí persiste (bookmarks, snippets, Dev Board) queda en la cuenta Appwrite del propio usuario, no en un backend de terceros ni compartido entre usuarios sin permiso explícito.

---

## Calidad

Pocas herramientas, pero bien diseñadas y confiables.

---

## Escalabilidad

Forge debe crecer mediante módulos independientes (features) que puedan incorporarse sin afectar la experiencia general.

---

# Estrategia de crecimiento

El producto evoluciona de forma incremental.

## Etapa 1 — Hecho

Colección de utilidades esenciales (~26 tools de cómputo puro: JSON, JWT, Base64, hashes, timestamps, colores, texto, etc.).

Objetivo logrado: convertirse en una herramienta que el usuario abre a diario.

---

## Etapa 2 — En curso

Herramientas más avanzadas para desarrolladores profesionales, con backend propio cuando aporta valor real.

Ya construido:

- Dev Board (kanban + time tracking) y Bookmarks/Snippets sobre Appwrite.
- HTTP Tester para requests reales.
- Mock Data Generator.
- Generación asistida por IA (Appwrite Function + Groq) ya integrada en bookmarks y snippets para autocompletar contenido.

Próximo en esta etapa:

- Saved HTTP collections/environments (extender HTTP Tester).
- Extender IA asistida a más herramientas (regex, cURL↔código, mock data por lenguaje natural).
- Team workspaces (Appwrite Teams) para compartir Dev Board/bookmarks/snippets.

---

## Etapa 3 — Extender el alcance sin salir del navegador

Nada de integraciones a nivel sistema operativo (eso requeriría una app nativa, fuera de alcance mientras Forge sea browser-only, ver `AGENTS.md`). En su lugar:

- PWA instalable (icono, funciona standalone, sigue siendo 100% web).
- CLI (`forge-cli`, ya existe) para automatizar bookmarks/proyectos/tickets desde la terminal.
- MCP server sobre la misma API para que agentes de IA operen Forge directamente.
- Atajos de teclado por herramienta (hoy solo Cmd+K / Cmd+/ globales).

---

## Etapa 4

Crear un ecosistema extensible mediante módulos o plugins desarrollados por la comunidad.

---

# Modelo de monetización

## Plan Gratuito

Incluye todas las utilidades esenciales, Dev Board/bookmarks/snippets personales, y generación asistida por IA con cuota razonable.

Objetivo:

Maximizar la adopción y construir comunidad.

---

## Forge Pro

Suscripción mensual o anual.

Beneficios potenciales:

- Saved HTTP collections/environments ilimitadas.
- Team workspaces (Dev Board y bookmarks/snippets compartidos entre miembros).
- Feature flags dashboard.
- Mayor cuota de generación IA y acceso a más herramientas IA-asistidas.
- Historial extendido y personalización avanzada.
- Acceso anticipado a nuevas utilidades.

---

## Licencia de por vida

Alternativa para usuarios que prefieren un único pago.

Incluye:

- acceso permanente a la versión Pro;
- actualizaciones durante un período definido o de por vida, según la estrategia comercial.

---

## Empresas

Licencias para equipos de desarrollo, sobre Team workspaces.

Posibles beneficios:

- administración centralizada (Appwrite Teams, roles/permisos);
- SSO / auditoría;
- soporte prioritario;
- funcionalidades empresariales (feature flags, webhook inspector, etc.).

---

# Estrategia de distribución

- Sitio web oficial.
- GitHub.
- PWA instalable desde el navegador.
- Redes sociales.
- Contenido educativo.
- Comunidades de desarrolladores.
- Recomendación entre usuarios.

---

# Estrategia de marketing

Forge crecerá principalmente mediante contenido técnico.

Cada nueva utilidad podrá presentarse mediante:

- videos cortos;
- artículos;
- publicaciones en redes sociales;
- demostraciones;
- tutoriales.

La propia evolución del producto será parte de la estrategia de adquisición.

---

# Diferenciadores

- Enfoque exclusivo en desarrolladores.
- Acceso instantáneo desde el navegador, sin instalación.
- Backend propio (Appwrite): tus datos en tu cuenta, no dispersos entre sitios de terceros.
- Interfaz moderna y minimalista.
- Alto rendimiento.
- Extensible vía CLI y, próximamente, MCP para agentes de IA.
- Evolución continua basada en necesidades reales del desarrollo diario.

---

# Objetivo a largo plazo

Convertirse en la aplicación web de referencia para utilidades de desarrollo, ofreciendo una experiencia unificada, rápida y confiable que acompañe a los desarrolladores durante toda su jornada de trabajo.

Forge busca ser una herramienta que permanezca siempre a una pestaña de distancia, reduciendo la fricción en las tareas cotidianas y permitiendo que los desarrolladores dediquen más tiempo a crear software y menos tiempo a buscar herramientas.
