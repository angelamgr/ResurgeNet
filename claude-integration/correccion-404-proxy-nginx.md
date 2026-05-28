# Corrección: 404 en peticiones al backend tras implementar proxy inverso

**Fecha:** 2026-05-27  
**Autor:** Claude (asistente IA)  
**Síntoma:** El frontend carga correctamente pero todas las peticiones al backend devuelven 404

---

## 1. Contexto

Tras implementar el proxy inverso Nginx (documentado en `implementacion-proxy-inverso-nginx.md`) y corregir la configuración de sesiones (documentado en `correccion-error-login-sesion.md`), las peticiones al backend seguían fallando con error 404. Este documento analiza la causa y la solución.

---

## 2. Arquitectura de contenedores

Antes de analizar el problema es necesario entender cómo están conectados los servicios en `docker-compose.yml`:

```
Navegador
    |
    | localhost:3000
    v
Contenedor: frontend  (Nginx, puerto 3000:80)
    |
    | http://backend:80  (red interna Docker: my_network)
    v
Contenedor: backend   (Nginx, puerto 8080:80)
    |
    | fastcgi_pass api:9000  (red interna Docker)
    v
Contenedor: api       (PHP-FPM, puerto 9000)
    |
    v
Contenedor: db        (MySQL)
```

El nombre `backend` en la configuración de Nginx es el nombre del servicio en `docker-compose.yml`, que Docker resuelve automáticamente a la IP del contenedor dentro de `my_network`.

---

## 3. Causa del 404

### Problema A — `location /api` sin barra final en `proxy_pass`

**El comportamiento de Nginx con `proxy_pass` depende críticamente de si la URL lleva o no barra final.**

**Configuración anterior (incorrecta):**
```nginx
location /api {
    proxy_pass http://backend:80;
}
```

Con esta configuración, Nginx reenvía la URI **completa** al backend: una petición a `/api/loginUser` llega al backend como `/api/loginUser`. Esto en principio es correcto porque Laravel espera `/api/loginUser`.

Sin embargo, el problema estaba en cómo Nginx del backend interpretaba esa URL. El `location /` de `back.conf` hace `try_files $uri $uri/ /index.php?$query_string`. Con `$uri = /api/loginUser`, Nginx buscaba primero el fichero físico `/var/www/html/public/api/loginUser` (no existe), luego el directorio `/var/www/html/public/api/loginUser/` (no existe), y finalmente redirigía a `index.php`. Hasta aquí correcto.

El problema real era el **`Host` header**.

### Problema B — `Host` header incorrecto bloqueaba las cookies

**Configuración anterior:**
```nginx
proxy_set_header Host $host;
```

`$host` en Nginx contiene el nombre del servidor tal como lo ve Nginx internamente. Dentro del contenedor frontend, `$host` era `localhost` (sin puerto). Laravel recibía `Host: localhost` y emita la cookie de sesión con `Domain=localhost`.

Sin embargo, el navegador accede a la aplicación en `localhost:3000`. Para el navegador, `localhost` y `localhost:3000` son dominios distintos en lo que respecta a las cookies. La cookie emitida para `localhost` no se envíaba en las peticiones a `localhost:3000`, y sin cookie de sesión, Laravel trataba cada petición como nueva y la sesión del login no se persistía.

**Solución:** usar `$http_host` en lugar de `$host`:
- `$host`: hostname sin puerto (`localhost`)
- `$http_host`: hostname tal como lo envía el navegador, incluyendo el puerto (`localhost:3000`)

```nginx
proxy_set_header Host $http_host;  -- correcto
```

### Problema C — Las cookies de sesión se emitían para el dominio `backend`

Cuando Laravel genera la cookie de sesión, la asocia al dominio del `Host` header que recibió. Si por cualquier razón el `Host` llegaba como `backend` (el nombre interno del contenedor), la cookie se emitía para el dominio `backend`, que el navegador del usuario nunca reconocería como su dominio actual (`localhost:3000`).

**Solución:** añadir `proxy_cookie_domain` para que Nginx reescriba automáticamente el dominio de las cookies antes de enviarlas al navegador:

```nginx
proxy_cookie_domain backend localhost;
```

Esto garantiza que aunque Laravel emita la cookie con `Domain=backend`, el navegador la recibe con `Domain=localhost` y la asocia correctamente al origen `localhost:3000`.

---

## 4. Solución aplicada

### `nginx/front.conf` — antes y después

**Antes:**
```nginx
location /api {
    proxy_pass       http://backend:80;
    proxy_set_header Host              $host;        # sin puerto
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Después:**
```nginx
location /api/ {
    proxy_pass       http://backend:80/api/;   # barra final: preserva la URI
    proxy_set_header Host              $http_host;   # con puerto (localhost:3000)
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cookie_domain backend localhost;           # reescribe dominio de cookies
    proxy_cookie_path   /api    /api;
}
```

**Cambios clave:**
- `location /api` → `location /api/` (con barra): captura correctamente todas las sub-rutas.
- `proxy_pass http://backend:80` → `proxy_pass http://backend:80/api/` (con barra y ruta): Nginx sustituye el prefijo `/api/` de la URI antes de reenviar.
- `$host` → `$http_host`: incluye el puerto en el header `Host`.
- Añadido `proxy_cookie_domain backend localhost`: reescribe el dominio de las cookies.

### `nginx/back.conf` — añadido `HTTP_HOST` a FastCGI

Se añadió `fastcgi_param HTTP_HOST $http_host` para que PHP-FPM (y por tanto Laravel) reciba el host correcto desde el que hace FastCGI Nginx del backend:

```nginx
location ~ \.php$ {
    include       fastcgi_params;
    fastcgi_pass  api:9000;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param HTTP_HOST       $http_host;   # <-- nuevo
}
```

---

## 5. Cómo aplicar los cambios

Despues de hacer `git pull` en el servidor:

```bash
docker-compose down
docker-compose up -d
```

Verificar en las DevTools del navegador (pestaña Network) que:
1. Las peticiones van a `localhost:3000/api/...`.
2. Las respuestas tienen código 200 (o el código correcto de la operación).
3. En la pestaña Application > Cookies existe una cookie de sesión para `localhost`.
4. No hay errores de CORS en la consola.

---

## 6. Archivos modificados

| Archivo | Cambio |
|---|---|
| `nginx/front.conf` | `location /api/` con barra; `proxy_pass` con ruta explícita; `$http_host`; `proxy_cookie_domain` |
| `nginx/back.conf` | Añadido `fastcgi_param HTTP_HOST $http_host` |
