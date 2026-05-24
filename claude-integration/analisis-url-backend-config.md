# Análisis y solución: URL del backend hardcodeada en `config.js`

**Fecha:** 2026-05-24  
**Autor:** Claude (asistente IA)  
**Tarea:** Análisis técnico — problema de la URL fija `localhost:8080` en el frontend

---

## 1. El problema concreto

El archivo `frontend/js/config.js` contiene:

```javascript
const API_BASE = 'http://localhost:8080/api';
```

Esta URL está **escrita a mano** y es válida únamente cuando el proyecto corre en el ordenador de desarrollo con Docker en el puerto 8080. En cualquier otro contexto —despliegue en un servidor real, entorno de pruebas, máquina de otro desarrollador con puerto distinto— todas las llamadas al backend fallarán silenciosamente o con error de red, y la aplicación quedará completamente inutilizada.

---

## 2. Por qué es un problema

### 2.1 Fallo total en producción

En un servidor de producción, el frontend y el backend estarían en el mismo dominio (por ejemplo `https://resurgenet.com`) o en subdominios separados (`https://api.resurgenet.com`). Ninguno de los dos escenarios incluye `localhost:8080`. Todas las peticiones `$.ajax` fallarían con error de red o CORS, haciendo la aplicación inutilizable.

### 2.2 Ausencia de distinción entre entornos

Un proyecto web profesional distingue al menos dos entornos:

- **Desarrollo (local):** el desarrollador trabaja en su máquina. La URL del backend es `http://localhost:8080/api`.
- **Producción:** la aplicación está desplegada en un servidor real. La URL del backend es diferente.

Con la configuración actual no existe esa distinción. El mismo `config.js` que funciona en local es el que llegaría a producción, roto.

### 2.3 El backend Laravel ya resuelve esto correctamente

El backend usa `api/.env` para separar entornos: en local el `.env` apunta a `localhost`, en producción apuntaría al servidor real. El frontend carece de un mecanismo equivalente.

### 2.4 Problema de CORS

Al acceder desde un dominio diferente a `localhost`, el navegador bloqueará las peticiones por política de CORS (Cross-Origin Resource Sharing) antes incluso de llegar al backend, a menos que el backend esté configurado para aceptar el origen del frontend de producción. Sin cambiar `API_BASE`, no es posible configurar CORS correctamente.

---

## 3. Análisis de la arquitectura actual

Esta es la situación actual del proyecto con Docker:

```
Navegador
  │
  ├── localhost:3000  →  Docker: frontend (Nginx)  →  sirve HTML/CSS/JS
  │
  └── localhost:8080  →  Docker: backend (Nginx)   →  PHP/Laravel  →  MySQL
```

El frontend y el backend están en **puertos distintos del mismo host**. Esto es típico del desarrollo local, pero en producción la arquitectura cambia:

```
Navegador
  │
  ├── https://resurgenet.com        →  servidor frontend
  │
  └── https://resurgenet.com/api    →  servidor backend (mismo dominio, ruta distinta)
      ó
      https://api.resurgenet.com    →  servidor backend (subdominio)
```

---

## 4. Las opciones disponibles

### Opción A — URL relativa al origen: `window.location.origin + '/api'`

```javascript
// config.js
const API_BASE = window.location.origin + '/api';
```

**Cómo funciona:** `window.location.origin` devuelve el protocolo + dominio + puerto del frontend tal como el navegador lo ve en ese momento. En local devuelve `http://localhost:3000`; en producción devolvería `https://resurgenet.com`. La URL del backend resulta del mismo origen con `/api` al final.

**Ventaja:** no requiere ningún cambio en el despliegue. Funciona automáticamente en cualquier entorno.

**Desventaja crítica para este proyecto:** el frontend está en el puerto `3000` y el backend en el `8080`. Son **orígenes distintos**. Con esta solución, en local la URL del backend sería `http://localhost:3000/api`, que no existe. Esta opción solo funciona si frontend y backend comparten dominio y puerto (mismo origen), lo que requiere configurar Nginx como proxy inverso.

**Valoración para ResurgeNet:** no funciona directamente con la configuración Docker actual. Sí funcionaría si se añade un proxy inverso (ver Opción C).

---

### Opción B — Variable de entorno en el HTML via Nginx

Nginx puede inyectar variables de entorno en archivos estáticos en el momento del arranque del contenedor. El flujo es:

1. `config.js` deja de ser un archivo estático y pasa a ser una plantilla `config.js.template`:

```javascript
// config.js.template
const API_BASE = '${API_BASE_URL}';
```

2. El `docker-compose.yml` pasa la variable al contenedor frontend:

```yaml
# docker-compose.yml
services:
  frontend:
    environment:
      - API_BASE_URL=http://localhost:8080/api   # en local
      # - API_BASE_URL=https://api.resurgenet.com/api  # en produccion
```

3. El `Dockerfile` del frontend (o el `entrypoint.sh`) sustituye la plantilla al arrancar:

```bash
envsubst '${API_BASE_URL}' < /etc/nginx/templates/config.js.template > /usr/share/nginx/html/js/config.js
```

**Ventaja:** solución estándar en entornos Docker. La URL solo se define en `docker-compose.yml` o en las variables de entorno del servidor, no en el código.

**Desventaja:** requiere crear un `Dockerfile` para el servicio frontend (actualmente usa la imagen `nginx:latest` sin Dockerfile propio) y un script de arranque. Es más infraestructura que la Opción C.

**Valoración para ResurgeNet:** correcta a nivel de ingeniería, pero añade complejidad para un TFG.

---

### Opción C — Proxy inverso en Nginx: unificar frontend y backend bajo el mismo origen ❗ RECOMENDADA

Configurar el Nginx del **frontend** para que reenvíe las peticiones a `/api` hacia el contenedor del backend. De esta forma, el navegador ve un único origen y `API_BASE` puede ser simplemente `/api`.

```
Navegador → localhost:3000/api/...  →  Nginx frontend  →  backend:80/api/...
```

**`nginx/front.conf` modificado:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Peticiones al frontend: sirve los archivos estáticos
    location / {
        try_files $uri $uri/ =404;
    }

    # Peticiones al backend: proxy inverso al contenedor backend
    location /api {
        proxy_pass http://backend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**`frontend/js/config.js` simplificado:**
```javascript
const API_BASE = '/api';
```

**Ventajas:**
- `config.js` queda con una URL relativa que funciona en cualquier entorno sin ningún cambio.
- No hay problema de CORS: frontend y backend comparten el mismo origen desde el punto de vista del navegador.
- No requiere tocar el código JavaScript en absoluto al desplegar en producción.
- El puerto `8080` del backend puede dejar de estar expuesto al exterior (solo Nginx frontend necesita acceder a él internamente).
- Es la arquitectura estándar para aplicaciones web con frontend estático y backend API.

**Desventajas:**
- Requiere modificar `nginx/front.conf` y `config.js`.
- En producción, la configuración de Nginx cambia el `proxy_pass` a la URL real del backend (`https://api.resurgenet.com`), pero `config.js` no necesita cambiar.

**Valoración para ResurgeNet:** es la solución más limpia, más estándar y la que menos complejidad añade. Es la recomendada.

---

## 5. Decisión recomendada: Opción C

La Opción C resuelve el problema de raíz con el mínimo de cambios:

| Cambio | Archivo |
|---|---|
| Añadir bloque `location /api` con `proxy_pass` | `nginx/front.conf` |
| Cambiar `http://localhost:8080/api` por `/api` | `frontend/js/config.js` |

Nada más. El resto del proyecto (JS, PHP, Docker) no necesita tocar nada.

---

## 6. Cambios a implementar

> **Nota:** Este documento describe el análisis y la decisión. Los cambios se implementarán en un commit separado una vez confirmada la decisión.

### `nginx/front.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Archivos estáticos del frontend
    location / {
        try_files $uri $uri/ =404;
    }

    # Proxy inverso: reenvía /api al contenedor backend
    # En producción cambiar backend:80 por la URL del servidor real
    location /api {
        proxy_pass http://backend:80;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### `frontend/js/config.js`

```javascript
// ============================================================
// CONFIGURACIÓN GLOBAL DEL FRONTEND
// ============================================================
// URL relativa: funciona en local y en producción sin cambios.
// El Nginx del frontend redirige /api al backend via proxy inverso.
// Ver nginx/front.conf para la configuración del proxy.
// ============================================================

const API_BASE = '/api';
```

---

## 7. Qué hay que hacer en producción

Con la Opción C implementada, el único cambio necesario al desplegar en producción es modificar el `proxy_pass` en `nginx/front.conf`:

```nginx
# En local:
proxy_pass http://backend:80;

# En producción (ejemplo):
proxy_pass https://api.resurgenet.com;
```

`config.js` no necesita ningún cambio. La URL `/api` funciona igual en ambos entornos.

---

## 8. Resumen ejecutivo para el TFG

El problema de la URL hardcodeada es un error de diseño clásico que viola el principio de **separación de configuración y código** (factor III del manifiesto de aplicaciones de doce factores). La configuración que varía entre entornos —como la URL del backend— no debe estar en el código fuente.

La solución adoptada (proxy inverso Nginx + URL relativa) es la arquitectura estándar para aplicaciones con frontend estático y backend API separados. Elimina el problema de CORS, hace el despliegue reproducible sin cambios en el código y es la configuración que usaría cualquier proveedor de hosting moderno (Vercel, Netlify, AWS CloudFront, etc.) para este tipo de aplicación.
