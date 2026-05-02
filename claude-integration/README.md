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

### Herramienta considerada previamente — GitHub Copilot Chat

Antes de decantarse por Claude, se consideró usar el **chat de GitHub Copilot** integrado en Visual Studio Code para esta fase final. Sin embargo, presentó dos limitaciones que lo hicieron inviable:

**1. Límite de tokens fijo**

El plan gratuito o de estudiante de GitHub Copilot impone un límite mensual de uso del chat basado en tokens. Para una fase de experimentación intensiva como la que se planteaba — analizar el proyecto completo, detectar problemas, generar documentación extensa — este límite resultaba demasiado restrictivo y habría interrumpido el flujo de trabajo antes de completar los objetivos.

**2. Carga computacional en el ordenador local**

Las funcionalidades avanzadas del modo agente de Copilot, que permiten operar sobre el proyecto de forma más autónoma, requieren que parte del procesamiento se ejecute en la máquina local. El hardware disponible para este TFG no contaba con los recursos suficientes para soportar esta carga de forma fluida, lo que hacía inviable su uso en modo agente.

### Por qué Claude fue la alternativa más viable

Claude, accesible desde [claude.ai](https://claude.ai), resolvía ambas limitaciones y además se ajustaba perfectamente al enfoque de trabajador supervisado que se quería explorar:

**Funcionamiento completamente en la nube**
Todo el procesamiento ocurre en los servidores de Anthropic. El ordenador local no interviene más allá de mostrar el navegador, lo que elimina por completo el problema de rendimiento.

**Sin límite de tokens que interrumpa el trabajo**
El plan utilizado permite sesiones de trabajo largas e intensivas sin cortes, adecuado para analizar el proyecto completo y generar documentación detallada en una sola sesión.

**Integración real con GitHub mediante Git MCP**
A través del conector **Claude Github MCP Connector**, Claude puede leer y escribir directamente sobre el repositorio — hacer commits, crear ficheros, modificar configuraciones — todo desde el chat. Esto permite el modelo de trabajador supervisado de forma natural: Claude propone y ejecuta, la alumna revisa y aprueba.

**Capacidad de razonamiento sobre el proyecto completo**
Claude puede analizar la arquitectura global del proyecto, detectar problemas de configuración que afectan a varias capas (como el problema del despliegue de la BD documentado en este directorio) y explicar razonadamente cada decisión, lo que facilita la supervisión y el aprendizaje.

**Accesible desde el navegador sin instalaciones**
No requiere ninguna configuración adicional en el entorno de desarrollo. Basta con abrir [claude.ai](https://claude.ai) en el navegador.

### El enfoque de trabajador supervisado

El modelo de uso adoptado en esta fase es deliberadamente el de **trabajador supervisado**: Claude actúa como un colaborador que ejecuta tareas técnicas concretas sobre el repositorio, pero siempre bajo la dirección y supervisión de la alumna. En ningún momento Claude toma decisiones de forma autónoma — cada cambio es revisado y validado antes de considerarse parte del proyecto.

Este enfoque permite explorar de forma controlada cómo la IA puede integrarse en un flujo de trabajo de desarrollo real, qué tipo de tareas delega mejor y cuáles requieren más supervisión, y cómo documentar ese proceso de forma transparente como parte del TFG.

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
