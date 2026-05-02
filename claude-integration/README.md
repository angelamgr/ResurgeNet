# Integración de Claude (Anthropic) en el TFG — ResurgeNet

Este directorio documenta el proceso completo de integración de Claude como asistente de desarrollo activo sobre el repositorio ResurgeNet, como parte del Trabajo de Fin de Grado.

---

## ¿Qué es Claude?

Claude es un asistente de inteligencia artificial desarrollado por Anthropic. En este proyecto se ha utilizado la versión **Claude Sonnet 4.6**, accesible desde [claude.ai](https://claude.ai), sin necesidad de instalar nada en local — todo funciona en la nube.

---

## Motivación: por qué se decidió usar Claude

### Punto de partida — GitHub Copilot en Visual Studio Code

Durante el desarrollo del proyecto se utilizó inicialmente **GitHub Copilot** integrado en Visual Studio Code como asistente de inteligencia artificial. Copilot es una herramienta ampliamente extendida en el mundo del desarrollo software que ofrece sugerencias de código en tiempo real directamente en el editor.

Sin embargo, esta solución presentó dos problemas importantes que limitaron su utilidad en el contexto de este TFG:

**1. Límite de tokens fijo**

GitHub Copilot en su versión gratuita o de estudiante impone un límite de uso mensual basado en tokens (unidad que mide el volumen de texto procesado por el modelo de IA). Al tratarse de un proyecto de TFG con sesiones de trabajo intensas, este límite se agotaba con relativa rapidez, dejando al asistente inutilizable hasta el siguiente ciclo de renovación. Esto interrumpía el flujo de trabajo en momentos críticos del desarrollo y obligaba a buscar alternativas manuales.

**2. Carga de trabajo excesiva para el hardware disponible**

Algunas funcionalidades avanzadas de Copilot, como el modo agente o la generación de contexto amplio sobre el proyecto, requerían que el propio ordenador procesara parte de la carga computacional. El equipo disponible para el desarrollo de este TFG no contaba con los recursos de hardware suficientes (memoria RAM, capacidad de CPU) para soportar esta carga de trabajo de forma fluida, lo que provocaba ralentizaciones y en ocasiones hacía inviable el uso de estas funcionalidades.

### Búsqueda de una alternativa

Ante estas limitaciones se buscó una alternativa que cumpliera los siguientes requisitos:

- **Sin límite de tokens restrictivo** que interrumpiera el flujo de trabajo
- **Totalmente en la nube**, sin depender de los recursos del ordenador local
- **Capaz de integrarse con el repositorio de GitHub** para poder actuar directamente sobre el código, no solo sugerir cambios
- **Accesible desde el navegador**, sin necesidad de instalar herramientas adicionales en local

### Por qué Claude resultó ser la opción más viable

Claude, desarrollado por Anthropic, cumplía todos los requisitos anteriores y además ofrecía ventajas adicionales que lo hicieron especialmente adecuado para este caso de uso:

**Ejecución completamente en la nube**
Claude funciona íntegramente desde [claude.ai](https://claude.ai) a través del navegador. Todo el procesamiento ocurre en los servidores de Anthropic, sin consumir recursos del ordenador local. Esto elimina por completo el problema de rendimiento que presentaba Copilot.

**Contexto de conversación amplio**
Claude mantiene un contexto de conversación muy amplio, lo que le permite analizar ficheros completos, entender la estructura global del proyecto y razonar sobre múltiples ficheros a la vez sin perder el hilo. Esto es especialmente útil en un proyecto con varias capas (frontend, backend, base de datos, infraestructura Docker) donde los cambios en una parte afectan a otras.

**Integración directa con GitHub mediante Git MCP**
A través del conector **Claude Github MCP Connector** (desarrollado por Anthropic), Claude puede no solo leer el código del repositorio sino también escribir directamente sobre él: hacer commits, crear ficheros, modificar configuraciones y gestionar issues, todo desde el chat sin salir del navegador. Esto convierte a Claude en un colaborador activo del proyecto, no solo en un asistente de sugerencias.

**Sin dependencia de herramientas locales**
No requiere instalar extensiones en el editor, no consume RAM ni CPU del ordenador de desarrollo, y no necesita que el proyecto esté abierto en ningún IDE. Basta con tener acceso a [claude.ai](https://claude.ai) desde cualquier navegador.

**Capacidad de razonamiento sobre el proyecto completo**
A diferencia de Copilot, que trabaja principalmente a nivel de fichero o función, Claude puede recibir como contexto la descripción completa del proyecto, analizar problemas de configuración, detectar errores de arquitectura y proponer soluciones razonadas explicando el porqué de cada decisión. Esto resultó especialmente valioso para detectar y corregir el problema del despliegue de la base de datos documentado en este directorio.

### Conclusión

La combinación de funcionamiento en la nube, contexto amplio, integración real con GitHub y capacidad de razonamiento sobre el proyecto completo hizo de Claude la alternativa más viable para sustituir a GitHub Copilot en el desarrollo de este TFG, resolviendo todos los problemas que motivaron el cambio y aportando además capacidades que Copilot no ofrecía.

---

## Proceso de integración de Claude con GitHub

### Objetivo
Conseguir que Claude pueda leer y escribir directamente sobre los repositorios de GitHub: leer ficheros, hacer commits, crear issues y pull requests, todo desde el chat de claude.ai sin instalar herramientas locales.

### Pasos realizados

#### 1. Primer intento — Integración nativa de GitHub en Claude
1. Acceder a [claude.ai](https://claude.ai) → avatar → **Settings** → **Integrations**
2. Conectar la **"Integración con GitHub"** (conector nativo de Anthropic)
3. Resultado: Claude puede leer ficheros y listar repositorios, pero **no tiene permisos de escritura** (no puede hacer commits). Este conector está diseñado para adjuntar ficheros como contexto en el chat y sincronizar repos en Proyectos de Claude, no para operar sobre el repositorio.

#### 2. Segundo intento — GitHub Copilot MCP
Se probó también el conector de **GitHub Copilot** disponible en el listado de integraciones.
- Resultado: igualmente de **solo lectura**. Está orientado a asistencia de código en el IDE, no a operaciones de escritura sobre repos.

#### 3. Solución final — Claude Github MCP Connector
1. En claude.ai → **Settings** → **Conectores** → desconectar cualquier conector de GitHub previo
2. Revocar todos los accesos previos desde [github.com/settings/apps/authorizations](https://github.com/settings/apps/authorizations)
3. Volver a claude.ai → **Settings** → **Conectores** → conectar **Git MCP**
4. GitHub muestra la pantalla de autorización del **Claude Github MCP Connector by Anthropic**
5. Hacer clic en **Authorize**
6. Verificar que aparece en **Installed GitHub Apps** en [github.com/settings/installations](https://github.com/settings/installations)
7. Hacer clic en **Configure** y dar acceso al repositorio **ResurgeNet**
8. Volver al chat de claude.ai y activar **Git MCP** desde el botón `+` → **Conectores**

### Resumen de conectores probados

| Conector | Lectura | Escritura | Cómo activarlo |
|---|---|---|---|
| Integración con GitHub (nativa) | ✅ | ❌ | Settings → Integrations |
| GitHub Copilot MCP | ✅ | ❌ | Settings → Integrations |
| **Claude Github MCP Connector** | ✅ | ✅ | Settings → Conectores → Git MCP |

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
