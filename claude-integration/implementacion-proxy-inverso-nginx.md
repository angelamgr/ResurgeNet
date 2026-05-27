# Implementación: proxy inverso Nginx y URL relativa del backend

**Fecha:** 2026-05-24  
**Autor:** Claude (asistente IA)  
**Tarea:** Eliminar la URL hardcodeada `http://localhost:8080/api` de `config.js`

---

## 1. Contexto

Este documento recoge la implementación de la solución elegida tras el análisis previo documentado en `analisis-url-backend-config.md`. La solución adoptada es la **Opción C: proxy inverso Nginx + URL relativa**, por ser la más limpia, la que menos cambios requiere y la arquitectura estándar para este tipo de proyecto.

---

## 2. Cambios realizados

Solo se han modificado **dos archivos**. Ningún archivo JavaScript de lógica de la aplicación ha necesitado cambios.

---

### Cambio 1 — `nginx/front.conf`

**Antes:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Después:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        proxy_pass         http://backend:80;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

**Qué hace cada línea del bloque nuevo:**

- `location /api` — captura todas las peticiones cuya ruta empiece por `/api`. Cuando el JS hace `$.ajax({ url: '/api/loginUser' })`, Nginx intercepta esa petición antes de que salga de la red interna de Docker.

- `proxy_pass http://backend:80` — reenvía la petición al contenedor `backend` en el puerto 80. `backend` es el nombre del servicio en `docker-compose.yml`, resuelto automáticamente por la red interna de Docker (`my_network`). El navegador nunca ve esta redirección: desde su punto de vista, todo ocurre en `localhost:3000`.

- `proxy_set_header Host $host` — preserva el header `Host` original para que el backend sepa a qué dominio se estaba accediendo.

- `proxy_set_header X-Real-IP $remote_addr` — pasa la IP real del cliente al backend, necesario para logs y posibles restricciones por IP.

- `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for` — cabecera estándar que indica que la petición ha pasado por un proxy. Laravel la lee automáticamente para construir URLs correctas.

- `proxy_set_header X-Forwarded-Proto $scheme` — indica al backend si la petición original era HTTP o HTTPS. Importante en producción para que Laravel no genere URLs con el protocolo equivocado.

---

### Cambio 2 — `frontend/js/config.js`

**Antes:**
```javascript
const API_BASE = 'http://localhost:8080/api';
```

**Después:**
```javascript
const API_BASE = '/api';
```

Una URL que empieza por `/` es **relativa al origen actual**. El navegador la resuelve automáticamente contra el host y puerto desde donde cargó la página:

- En local: `http://localhost:3000` + `/api` = `http://localhost:3000/api` → Nginx lo captura y lo redirige a `backend:80`.
- En producción: `https://resurgenet.com` + `/api` = `https://resurgenet.com/api` → Nginx del servidor lo captura y lo redirige al backend real.

En ambos casos, `config.js` no necesita ningún cambio.

---

## 3. Cómo queda el flujo de una petición

```
Navegor: $.ajax({ url: '/api/loginUser', ... })
    ↓
Navegador resuelve la URL relativa:
    http://localhost:3000/api/loginUser
    ↓
Nginx frontend (localhost:3000) recibe la peticion.
El bloque location /api coincide.
Nginx hace proxy_pass a:
    http://backend:80/api/loginUser
    ↓
Nginx backend (contenedor backend:80) recibe la peticion.
La pasa a PHP-FPM (contenedor api:9000).
    ↓
Laravel procesa la ruta /api/loginUser
y devuelve la respuesta JSON.
    ↓
La respuesta viaja de vuelta por el mismo camino
hasta el navegador. El JS procesa el JSON.
```

---

## 4. Cómo aplicar en producción

Cuando el proyecto se despliegue en un servidor real, el único cambio necesario en toda la aplicación es **una línea en `nginx/front.conf`**:

```nginx
# En local (actual):
proxy_pass http://backend:80;

# En produccion (ejemplo con dominio propio):
proxy_pass https://api.resurgenet.com;
```

`config.js` permanece exactamente igual. Todos los archivos JS permanecen exactamente igual. No hay nada más que cambiar.

---

## 5. Verificación tras el cambio

Despues de reiniciar los contenedores Docker (`docker-compose down && docker-compose up -d`), se puede verificar que el proxy funciona correctamente abriendo las DevTools del navegador y comprobando que:

1. Las peticiones de red van a `http://localhost:3000/api/...` (no a `localhost:8080`).
2. Las peticiones reciben respuesta 200 o el código correcto del backend.
3. No hay errores de CORS en la consola.

---

## 6. Archivos modificados

| Archivo | Tipo de cambio | Descripción |
|---|---|---|
| `nginx/front.conf` | Modificado | Añadido bloque `location /api` con proxy inverso al contenedor `backend` |
| `frontend/js/config.js` | Modificado | `http://localhost:8080/api` → `/api` (URL relativa) |

Ningún archivo JavaScript de lógica de la aplicación fue modificado. Los 17 archivos JS que usan `API_BASE` funcionan exactamente igual porque la variable sigue llamandose `API_BASE` y sigue conteniendo la base de la URL del backend; solo cambia el valor.
