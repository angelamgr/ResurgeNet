# Corrección: error interno al iniciar sesión

**Fecha:** 2026-05-27  
**Autor:** Claude (asistente IA)  
**Síntoma:** El frontend carga correctamente pero al intentar iniciar sesión con cualquier usuario el backend devuelve error interno del servidor (500)

---

## 1. Diagnóstico

El error tenía tres causas independientes que se combinaban para hacer el login completamente inoperable. Todas están relacionadas con la configuración de sesiones de Laravel.

---

### Causa 1 — `secure: true` en `session.php` con HTTP en local

**Archivo afectado:** `api/config/session.php`

**El problema:**
```php
'secure' => true, // cookies solo se envian por HTTPS
```

Cuando `secure` es `true`, el navegador solo almacena y envía la cookie de sesión si la conexión es HTTPS. En el entorno local el proyecto usa HTTP (`http://localhost:3000`). El flujo de error era el siguiente:

1. El usuario envía el formulario de login.
2. Laravel procesa `loginUser`, escribe la sesión en disco y devuelve la cookie con el flag `Secure`.
3. El navegador recibe la cookie pero la **descarta silenciosamente** porque la conexión no es HTTPS.
4. En la siguiente petición (redirect al dashboard), el servidor no encuentra ninguna sesión activa y lanza un error interno.

Este es un error de configuración que afecta únicamente al entorno de desarrollo. En producción con HTTPS sí sería correcto tener `secure: true`.

**Solución aplicada:**
```php
// Lee la variable de entorno SESSION_SECURE_COOKIE del .env
// En local el .env no la define, por lo que toma el valor false (HTTP)
// En produccion se añade SESSION_SECURE_COOKIE=true al .env del servidor
'secure' => env('SESSION_SECURE_COOKIE', false),
```

---

### Causa 2 — `same_site: 'none'` requiere `secure: true` obligatoriamente

**Archivo afectado:** `api/config/session.php`

**El problema:**
```php
'same_site' => 'none',
'secure'    => true,
```

La especificación de cookies del navegador (RFC 6265bis) establece que las cookies con `SameSite=None` **deben** tener también el flag `Secure`. Si no lo tienen, los navegadores modernos (Chrome ≥ 80, Firefox ≥ 79) las rechazan completamente.

Esto significa que `same_site: 'none'` y `secure: false` son mutuamente excluyentes. Al corregir `secure` a `false` para el entorno local, `same_site: 'none'` habría dejado de funcionar por la regla anterior, generando otro vector de fallo.

`SameSite=None` solo es necesario cuando el frontend y el backend están en dominios distintos (cross-site). Con el proxy inverso Nginx implementado en la fase anterior, ambos comparten el mismo origen (`localhost:3000`) desde el punto de vista del navegador, por lo que `SameSite=None` ya no es necesario.

**Solución aplicada:**
```php
'same_site' => 'lax',
```

`lax` es el valor por defecto de los navegadores modernos y el recomendado para aplicaciones donde frontend y backend comparten dominio. Permite que la cookie se envíe en navegación normal y en peticiones de primer nivel, y la bloquea en peticiones cross-site de terceros.

---

### Causa 3 — `loginUser` sin middleware `web` en `api.php`

**Archivo afectado:** `api/routes/api.php`

**El problema:**
```php
// Antes: ruta sin middleware web
Route::post('/loginUser', [AuthController::class, 'loginUser']);
```

Laravel tiene dos pilas de middleware distintas:

- **`web`**: inicializa sesiones, cookies, protección CSRF y otros servicios de estado. Se aplica automáticamente a las rutas en `routes/web.php`.
- **`api`**: sin sesiones, sin cookies, pensado para APIs sin estado (stateless). Se aplica automáticamente a las rutas en `routes/api.php`.

`loginUser` llama a `session(['id_usuario' => ...])` para guardar la sesión del usuario. Pero al estar en `api.php` sin el middleware `web`, el sistema de sesiones no está inicializado cuando el método se ejecuta. Laravel intenta escribir en una sesión nula, lanzando una excepción interna que se traduce en el error 500 visible en el frontend.

El mismo problema afectaba a `logoutUser` (que llama a `$request->session()->forget(...)`) y ya estaba parcialmente corregido, pero no a `loginUser`.

**Solución aplicada:**
```php
// Después: middleware web en las rutas que usan sesion
Route::post('/loginUser',   [AuthController::class, 'loginUser'])->middleware('web');
Route::post('/logoutUser',  [AuthController::class, 'logoutUser'])->middleware('web');
Route::get('/checkUserSession', function (Request $request) {
    return response()->json(['active' => $request->session()->has('id_usuario')]);
})->middleware('web');
```

---

### Causa 4 — Typo en `checkUserSession` (solución aprovechada en este mismo commit)

**Archivo afectado:** `api/routes/api.php`

Aprovechando la corrección de `api.php`, se corrigió también el typo documentado en `auditoria-backend-prioridad-alta.md`:

```php
// Antes (siempre devuelve false):
$request->session()->has('id_user')

// Después (correcto):
$request->session()->has('id_usuario')
```

---

## 2. Por qué funcionaba antes del proxy inverso

Antes de implementar el proxy inverso Nginx, el frontend estaba en `localhost:3000` y el backend en `localhost:8080`. Al ser orígenes distintos, era necesario `SameSite=None` para que el navegador enviara la cookie de sesión en las peticiones cross-origin. Eso a su vez exigía `secure: true`.

El problema es que en HTTP local con `secure: true` la cookie nunca llegaba al navegador (la descartaba). Es decir: **el login estaba roto antes del proxy también**, pero posiblemente no se había probado en ese momento o se probaba con una configuración diferente.

Con el proxy inverso, frontend y backend comparten origen (`localhost:3000`), lo que permite usar `SameSite=Lax` y `secure: false` en local — la combinación correcta para desarrollo HTTP.

---

## 3. Configuración correcta por entorno

| Parámetro | Desarrollo (HTTP local) | Producción (HTTPS) |
|---|---|---|
| `secure` | `false` (default del `.env`) | `true` (via `SESSION_SECURE_COOKIE=true` en `.env`) |
| `same_site` | `lax` | `lax` |
| `domain` | `null` | `null` o el dominio real |
| Middleware en login | `web` | `web` |

Para activar `secure: true` en producción basta con añadir al `.env` del servidor:
```
SESSION_SECURE_COOKIE=true
```

No es necesario modificar ningún archivo de código al desplegar.

---

## 4. Archivos modificados

| Archivo | Cambio |
|---|---|
| `api/config/session.php` | `secure`: `true` → `env('SESSION_SECURE_COOKIE', false)`; `same_site`: `'none'` → `'lax'` |
| `api/routes/api.php` | Añadido `->middleware('web')` a `loginUser` y `logoutUser`; corregido typo `id_user` → `id_usuario` en `checkUserSession` |
