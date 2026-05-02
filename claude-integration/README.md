# Integración de Claude (Anthropic) en el TFG — ResurgeNet

Este directorio documenta el proceso completo de integración de Claude como asistente de desarrollo activo sobre el repositorio ResurgeNet, como parte del Trabajo de Fin de Grado.

---

## ¿Qué es Claude?

Claude es un asistente de inteligencia artificial desarrollado por Anthropic. En este proyecto se ha utilizado la versión **Claude Sonnet 4.6**, accesible desde [claude.ai](https://claude.ai), sin necesidad de instalar nada en local — todo funciona en la nube.

---

## Motivación: por qué se decidió usar Claude en la última iteración del TFG

### Contexto del proyecto

El proyecto ResurgeNet ha sido desarrollado íntegramente por la alumna utilizando **Visual Studio Code** como editor de código, sin asistencia de IA durante las fases de desarrollo principales. El diseño de la arquitectura, la programación del frontend, el backend en Laravel y la configuración de la infraestructura Docker son fruto del trabajo propio.

En la **última iteración del proyecto**, se tomó la decisión de incorporar un asistente de inteligencia artificial con un objetivo concreto y acotado: explorar el enfoque de **trabajador supervisado**, es decir, delegar en la IA tareas bien definidas sobre el repositorio (análisis de configuración, corrección de errores, generación de documentación) mientras la alumna actúa como supervisora que revisa, valida y decide qué cambios se aplican. Este experimento forma parte del TFG como caso práctico de uso de IA en el ciclo de vida del desarrollo software.

### Herramienta considerada en primer lugar — GitHub Copilot en la nube

Antes de decantarse por Claude, se intentó usar **GitHub Copilot** en su modalidad de chat en la nube para esta fase final. La idea era aprovechar el plan de estudiante ya disponible y, si era necesario, mejorarlo para tener más capacidad. Sin embargo, esto no fue posible por razones externas al proyecto:

**El 20 de abril de 2026, GitHub pausó los nuevos registros y las mejoras de plan para Copilot Pro, Pro+ y Student.** La razón oficial fue que el uso del modo agente se había intensificado de forma inesperada — era habitual que unos pocos requests de agente generaran un coste que superaba el precio del plan mensual completo, lo que comprometió la infraestructura y la estructura de precios de GitHub. Para proteger a los usuarios existentes, GitHub bloqueó temporalmente tanto los nuevos registros como las actualizaciones de plan.

Además, los usuarios del plan Student comenzaron a encontrar el límite semanal de tokens agotado tras apenas unas pocas sesiones de trabajo intenso, haciendo inviable su uso para un experimento de la envergadura que se planteaba en el TFG.

GitHub anunció que estos límites se relajarían a partir del 1 de junio de 2026, cuando se complete la transición a un modelo de facturación basado en uso real de tokens. Pero en el momento en que se necesitaba la herramienta, la mejora de plan estaba bloqueada y el plan Student era insuficiente.

### Por qué Claude fue la alternativa más viable

Ante la imposibilidad de usar GitHub Copilot, se buscó una alternativa que cumpliera los mismos objetivos: un asistente de IA en la nube capaz de integrarse con el repositorio y operar sobre él de forma autónoma bajo supervisión. Claude, accesible desde [claude.ai](https://claude.ai), fue la alternativa elegida por los siguientes motivos:

**Sin bloqueo de plan ni límites semanales restrictivos**
A diferencia de GitHub Copilot, Claude no tenía el plan bloqueado ni imponía límites semanales que interrumpieran sesiones de trabajo largas. Esto permitió completar el experimento en una única sesión continua sin cortes.

**Funcionamiento completamente en la nube**
Todo el procesamiento ocurre en los servidores de Anthropic. El ordenador local no interviene más allá de mostrar el navegador, eliminando por completo cualquier dependencia del hardware disponible.

**Integración real con GitHub mediante Git MCP**
A través del conector **Claude Github MCP Connector**, Claude puede leer y escribir directamente sobre el repositorio — hacer commits, crear ficheros, modificar configuraciones — todo desde el chat. Esto permite el modelo de trabajador supervisado de forma natural: Claude propone y ejecuta, la alumna revisa y aprueba.

**Capacidad de razonamiento sobre el proyecto completo**
Claude puede analizar la arquitectura global del proyecto, detectar problemas de configuración que afectan a varias capas y explicar razonadamente cada decisión, lo que facilita la supervisión y el aprendizaje.

**Accesible desde el navegador sin instalaciones**
No requiere ninguna configuración adicional. Basta con abrir [claude.ai](https://claude.ai) en el navegador.

### El enfoque de trabajador supervisado

El modelo de uso adoptado en esta fase es deliberadamente el de **trabajador supervisado**: Claude actúa como un colaborador que ejecuta tareas técnicas concretas sobre el repositorio, pero siempre bajo la dirección y supervisión de la alumna. En ningún momento Claude toma decisiones de forma autónoma — cada cambio es revisado y validado antes de considerarse parte del proyecto.

Este enfoque permite explorar de forma controlada cómo la IA puede integrarse en un flujo de trabajo de desarrollo real, qué tipo de tareas delega mejor y cuáles requieren más supervisión, y cómo documentar ese proceso de forma transparente como parte del TFG.

---

## Proceso de integración de Claude con GitHub

### Objetivo

El objetivo de esta integración era conseguir que Claude pudiera no solo leer el código del repositorio, sino también escribir sobre él directamente: crear ficheros, modificar configuraciones y hacer commits, todo desde el chat de [claude.ai](https://claude.ai) sin salir del navegador.

Para entender por qué esto requirió un proceso de varios intentos, es necesario comprender primero algunos conceptos clave.

### Conceptos previos

#### ¿Qué es un conector o integración?

Claude, como herramienta de IA, funciona de forma aislada por defecto: responde preguntas y genera texto, pero no tiene acceso a sistemas externos como GitHub. Para que pueda interactuar con servicios externos, necesita conectarse a ellos a través de **conectores** — puentes que autorizan a Claude a comunicarse con esos servicios en nombre del usuario.

En Claude, estos conectores se gestionan desde **Settings → Integrations** o desde el menú `+` del chat.

#### ¿Qué es MCP?

**MCP (Model Context Protocol)** es un protocolo estándar creado por Anthropic que define cómo los asistentes de IA como Claude pueden conectarse e interactuar con herramientas y servicios externos de forma segura y estructurada. Es, en términos sencillos, el "lenguaje común" que permite a Claude hablar con GitHub, Figma, u otros servicios.

Un **servidor MCP** es el componente que expone las operaciones de un servicio (por ejemplo, "leer un fichero", "hacer un commit", "crear un issue") de forma que Claude pueda invocarlas. Cuando Claude tiene acceso a un servidor MCP de GitHub, puede ejecutar esas operaciones directamente desde el chat.

#### ¿Qué diferencia hay entre leer y escribir en un repositorio?

Cuando Claude accede a un repositorio de GitHub puede hacerlo con distintos niveles de permiso:

- **Solo lectura:** Claude puede ver el contenido de los ficheros, listar ramas, leer el historial de commits, etc. Pero no puede modificar nada — es como poder abrir y leer un documento sin poder editarlo.
- **Lectura y escritura:** Claude puede además crear ficheros, modificarlos, hacer commits y push al repositorio. Es como tener acceso completo de edición.

La diferencia es importante porque no todos los conectores conceden permisos de escritura — algunos, por diseño, son de solo lectura por razones de seguridad.

#### ¿Qué es OAuth y por qué GitHub pide autorización?

**OAuth** es un mecanismo de autorización estándar que permite que una aplicación (en este caso Claude) acceda a los recursos de otra (GitHub) en nombre del usuario, sin que el usuario tenga que compartir su contraseña. Cuando GitHub muestra una pantalla preguntando "¿Quieres autorizar a esta aplicación?", está usando OAuth para que el usuario conceda explícitamente el acceso. Este paso es obligatorio por seguridad: sin él, Claude no puede interactuar con el repositorio.

Además de la autorización OAuth, las GitHub Apps (aplicaciones instaladas en GitHub) necesitan ser también **instaladas** en la cuenta y **configuradas** para indicar a qué repositorios concretos tienen acceso. Autorizar y instalar son dos pasos distintos.

---

### Pasos realizados para conseguir la integración

#### 1. Primer intento — Integración nativa de GitHub en Claude

Lo primero que se probó fue el conector que aparece por defecto en Claude bajo el nombre **"Integración con GitHub"**.

**Cómo se activó:**
1. Acceder a [claude.ai](https://claude.ai) → avatar → **Settings** → **Integrations**
2. Conectar la **"Integración con GitHub"** y autorizar el acceso con la cuenta de GitHub

**Resultado:** Claude podía leer ficheros del repositorio y listar su contenido, pero al intentar hacer un commit devolvía un error 403 (acceso denegado). Este conector está diseñado por Anthropic para adjuntar ficheros de GitHub como contexto en el chat y sincronizar repositorios en los Proyectos de Claude — no para operar sobre el repositorio con permisos de escritura.

#### 2. Segundo intento — GitHub Copilot MCP

Se probó también el conector de **GitHub Copilot** disponible en el listado de integraciones de Claude, pensando que al ser un conector específico de GitHub podría tener más permisos.

**Resultado:** Igualmente de solo lectura. Este conector está orientado a asistencia de código en el IDE de Visual Studio Code y no expone operaciones de escritura sobre repositorios a través de MCP.

#### 3. Solución final — Claude Github MCP Connector

La solución llegó a través de un conector diferente llamado **Git MCP**, que aparece en el menú `+` del chat de Claude (en la sección **Conectores**) pero no en el listado de integraciones de Settings. Este conector corresponde a la aplicación **Claude Github MCP Connector**, desarrollada por Anthropic específicamente para permitir que Claude opere sobre repositorios de GitHub con permisos completos de lectura y escritura.

El proceso de activación fue el siguiente:

**Paso 1 — Limpiar autorizaciones anteriores**

Antes de conectar el nuevo conector, fue necesario revocar los accesos anteriores desde GitHub para forzar que el flujo de autorización OAuth se iniciara de cero:
1. Ir a [github.com/settings/apps/authorizations](https://github.com/settings/apps/authorizations)
2. Revocar el acceso de **Claude** y **Claude Github MCP Connector** si aparecían en la lista

**Paso 2 — Conectar Git MCP desde Claude**
1. En claude.ai → **Settings** → **Conectores**
2. Buscar y conectar **Git MCP**
3. GitHub muestra la pantalla de autorización OAuth del **Claude Github MCP Connector by Anthropic**, solicitando permiso para verificar la identidad de GitHub y actuar en nombre del usuario
4. Hacer clic en **Authorize**

Este paso autoriza la aplicación a nivel de cuenta de GitHub (OAuth), pero aún no le da acceso a ningún repositorio concreto.

**Paso 3 — Instalar la aplicación y dar acceso al repositorio**

Tras la autorización OAuth, la aplicación queda instalada como una **GitHub App** en la cuenta. Hay que configurar a qué repositorios puede acceder:
1. Ir a [github.com/settings/installations](https://github.com/settings/installations)
2. Verificar que **Claude Github MCP Connector** aparece en la pestaña **Installed GitHub Apps**
3. Hacer clic en **Configure**
4. En **Repository access**, seleccionar **"Only select repositories"** y añadir **ResurgeNet**
5. Guardar los cambios

Este paso es el que realmente otorga a Claude permiso de escritura sobre el repositorio ResurgeNet.

**Paso 4 — Activar Git MCP en la conversación**

Los conectores en Claude deben activarse también por conversación. En el chat de claude.ai:
1. Hacer clic en el botón **`+`** de la barra de escritura
2. Ir a **Conectores**
3. Activar el toggle de **Git MCP**

A partir de este momento, Claude tiene acceso completo de lectura y escritura sobre el repositorio ResurgeNet y puede hacer commits, crear ficheros y modificar el código directamente desde el chat.

### Resumen de conectores probados

| Conector | Lectura | Escritura | Cómo activarlo |
|---|---|---|---|
| Integración con GitHub (nativa) | ✅ | ❌ | Settings → Integrations |
| GitHub Copilot MCP | ✅ | ❌ | Settings → Integrations |
| **Claude Github MCP Connector** | ✅ | ✅ | Settings → Conectores → Git MCP + instalación en GitHub |

---

## Cambios realizados por Claude en el repositorio

### Sesión: 02/05/2026

#### Análisis inicial del proyecto

Claude leyó el `README.md` e identificó que ResurgeNet es una plataforma web para la gestión de comercios afectados por catástrofes naturales, construida con:
- **Frontend:** HTML, CSS, JavaScript + jQuery (puerto 3000)
- **Backend:** PHP + Laravel (puerto 8080)
- **Base de datos:** MySQL (`ResurgeNet`)
- **Infraestructura:** Docker + Nginx

#### Problema detectado en `docker-compose.yml`

Al analizar la configuración, Claude detectó que ejecutar `docker-compose up --build` desde un clon limpio del repositorio dejaba la base de datos **completamente vacía**, por dos motivos:

1. **El backup `.sql` no estaba referenciado en el `docker-compose.yml`** — el fichero `db_backup/resurgenet_backup22Abril.sql` existía en el repo pero no se montaba en ningún sitio.
2. **El volumen de datos era una carpeta local** (`./db_data`) excluida del repositorio por el `.gitignore` — cualquier persona que clonara el repo no tendría esa carpeta.

#### Corrección aplicada al `docker-compose.yml`

**Antes (servicio `db`):**
```yaml
volumes:
  - ./db_data:/var/lib/mysql
```

**Después (servicio `db`):**
```yaml
volumes:
  - db_data:/var/lib/mysql
  - ./db_backup/resurgenet_backup22Abril.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

**Y se añadió al final del fichero:**
```yaml
volumes:
  db_data:
```

**¿Por qué funciona?**
MySQL ejecuta automáticamente cualquier fichero `.sql` que encuentre en `/docker-entrypoint-initdb.d/` la **primera vez** que arranca con un volumen vacío. Al cambiar el volumen de carpeta local (`./db_data`) a volumen gestionado por Docker (`db_data`), el proyecto funciona en cualquier máquina sin necesidad de tener datos locales previos.

---

## Impacto en el entorno local al hacer `git pull`

Al traer estos cambios a tu máquina local hay **una acción obligatoria** antes de volver a levantar Docker, porque el tipo de volumen de MySQL ha cambiado:

```bash
# 1. Parar contenedores y eliminar volúmenes antiguos
docker compose down -v

# 2. Opcional: eliminar la carpeta local de datos si aún existe
rm -rf ./db_data

# 3. Levantar de nuevo — la BD se inicializa automáticamente con el backup
docker compose up --build
```

> ⚠️ Si haces `docker compose up --build` sin el paso `down -v` primero, Docker puede reutilizar el volumen antiguo y no ejecutar el script de inicialización, dejando la BD vacía igualmente.

**Resultado esperado tras estos pasos:**
La base de datos arrancará automáticamente con todas las tablas y datos del fichero `db_backup/resurgenet_backup22Abril.sql`.

---

## Capacidades de Claude sobre el repositorio (con Git MCP activo)

| Acción | Descripción |
|---|---|
| Leer ficheros | Acceder a cualquier fichero del repo |
| Crear/editar ficheros | Hacer commits directamente desde el chat |
| Push de múltiples ficheros | Subir varios ficheros en un solo commit |
| Gestionar issues | Crear, comentar y cerrar issues |
| Listar commits | Ver el historial de cambios |
| Eliminar ficheros | Borrar ficheros del repositorio |

---

## Referencias bibliográficas

### GitHub Copilot — Cambios de planes y limitaciones

[1] Binder, J. (2026, 20 de abril). *Changes to GitHub Copilot Individual plans*. The GitHub Blog.
https://github.blog/news-insights/company-news/changes-to-github-copilot-individual-plans/

[2] GitHub. (2026, 20 de abril). *Changes to GitHub Copilot plans for individuals*. GitHub Changelog.
https://github.blog/changelog/2026-04-20-changes-to-github-copilot-plans-for-individuals/

[3] GitHub. (2026, 10 de abril). *Pausing new GitHub Copilot Pro trials*. GitHub Changelog.
https://github.blog/changelog/2026-04-10-pausing-new-github-copilot-pro-trials/

[4] GitHub Community. (2026, 24 de abril). *Announcement & FAQ: Changes to GitHub Copilot Individual Plans* [Discusión en foro].
https://github.com/orgs/community/discussions/192963

[5] GitHub. (2026). *Plans for GitHub Copilot*. GitHub Docs.
https://docs.github.com/en/copilot/get-started/plans

[6] GitHub. (2026). *About individual GitHub Copilot plans and benefits*. GitHub Docs.
https://docs.github.com/en/copilot/concepts/billing/individual-plans

### GitHub Copilot — Transición a facturación por uso

[7] GitHub. (2026, 27 de abril). *GitHub Copilot is moving to usage-based billing*. The GitHub Blog.
https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/

### Model Context Protocol (MCP)

[8] Anthropic. (2024, noviembre). *Introducing the Model Context Protocol*. Anthropic Blog.
https://www.anthropic.com/news/model-context-protocol

[9] Model Context Protocol. (2025). *Specification — Model Context Protocol* (versión 2025-11-25).
https://modelcontextprotocol.io/specification/2025-11-25

[10] Model Context Protocol. (s.f.). *Repositorio oficial de especificación y documentación* [Repositorio GitHub].
https://github.com/modelcontextprotocol/modelcontextprotocol

[11] Wikipedia. (2026). *Model Context Protocol*. Wikipedia, la enciclopedia libre.
https://en.wikipedia.org/wiki/Model_Context_Protocol

### OAuth 2.0

[12] Hardt, D. (Ed.). (2012, octubre). *RFC 6749: The OAuth 2.0 Authorization Framework*. Internet Engineering Task Force (IETF).
https://www.rfc-editor.org/rfc/rfc6749

### Claude y Anthropic

[13] Anthropic. (2026). *Claude* [Herramienta de inteligencia artificial, versión Sonnet 4.6].
https://claude.ai

[14] Anthropic. (2026). *Claude documentation*. Anthropic Docs.
https://docs.anthropic.com

### GitHub — Documentación oficial

[15] GitHub. (2026). *Viewing and changing your GitHub Copilot plan*. GitHub Docs.
https://docs.github.com/en/copilot/how-tos/manage-your-account/view-and-change-your-copilot-plan

[16] GitHub. (2026). *About GitHub Apps*. GitHub Docs.
https://docs.github.com/en/apps/overview
