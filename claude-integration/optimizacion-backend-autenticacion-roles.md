# Optimización backend: autenticación y control de roles en rutas de la API

**Fecha:** 2026-05-27  
**Autor:** Claude (asistente IA)  
**Tarea:** Optimización backend #1 — proteger todas las rutas de la API con autenticación y control de acceso por rol

---

## 1. Problema resuelto

Todas las rutas de la API eran completamente públicas. Cualquier persona que conociera la URL podía, sin identificarse, leer el listado de consumidores, eliminar comercios, activar cuentas o leer pedidos ajenos. El análisis completo del problema está en `auditoria-backend-prioridad-alta.md`, sección 1.

---

## 2. Decisión de diseño: sesión PHP en lugar de tokens

Laravel ofrece dos mecanismos de autenticación para APIs:

**Sanctum con tokens:** el cliente recibe un token en el login, lo almacena (en `localStorage` o una cookie httpOnly) y lo envía en cada petición como cabecera `Authorization: Bearer <token>`. Es el enfoque estándar para APIs consumidas por SPAs o aplicaciones móviles.

**Sesión PHP:** el servidor crea una sesión identificada por una cookie cuando el usuario hace login. El navegador envía esa cookie automáticamente en cada petición al mismo origen. Es el enfoque clásico para aplicaciones web donde frontend y backend comparten dominio.

ResurgeNet ya usa sesiones PHP (`session(['id_usuario' => ...])` en `loginUser`) y el frontend y backend comparten origen gracias al proxy inverso Nginx. **Se mantiene el sistema de sesiones** porque:
- Cambiar a tokens requeriria modificar `loginUser`, el frontend y la gestión del token en todos los JS.
- Las sesiones son más sencillas para este tipo de aplicación web tradicional.
- La cookie de sesión ya existe y funciona correctamente tras las correcciones anteriores.

---

## 3. Implementación

### 3.1 Nuevo middleware: `VerificarSesion`

**Archivo creado:** `api/app/Http/Middleware/VerificarSesion.php`

Middleware personalizado que realiza dos comprobaciones en orden:

**Comprobación 1 — Sesión activa:**
```php
if (!$request->session()->has('id_usuario')) {
    return response()->json(['error' => 'No autenticado.'], 401);
}
```
Si no existe la clave `id_usuario` en la sesión, el usuario no ha hecho login o su sesión ha expirado. Se devuelve 401 (Unauthorized).

**Comprobación 2 — Rol autorizado (opcional):**
```php
if (!empty($roles)) {
    $rolUsuario = intval($request->session()->get('rol'));
    if (!in_array($rolUsuario, array_map('intval', $roles), true)) {
        return response()->json(['error' => 'Acceso denegado.'], 403);
    }
}
```
Si la ruta especifica roles permitidos y el rol del usuario no está entre ellos, se devuelve 403 (Forbidden). Si no se especifican roles, solo se verifica que haya sesión activa.

**Uso en rutas:**
```php
->middleware('sesion')       // solo requiere sesion activa, cualquier rol
->middleware('sesion:1')     // requiere rol 1 (administrador)
->middleware('sesion:1,4')   // requiere rol 1 o rol 4
```

### 3.2 Registro del middleware en `Kernel.php`

**Archivo modificado:** `api/app/Http/Kernel.php`

Se registró el alias `sesion` en `$middlewareAliases`:

```php
'sesion' => \App\Http\Middleware\VerificarSesion::class,
```

Esto permite usar `->middleware('sesion:1')` en las rutas en lugar de la clase completa.

### 3.3 Exclusión de CSRF para todas las rutas API

**Archivo modificado:** `api/app/Http/Middleware/VerifyCsrfToken.php`

Antes, las rutas excluidas de CSRF se listaban una a una. Se simplificó a:

```php
protected $except = [
    '/api/*',
];
```

Esto es correcto y seguro porque las peticiones JSON de la API no pueden ser falsificadas cross-site: el navegador no envía peticiones `Content-Type: application/json` con credenciales a dominios cruzados sin que CORS lo permita explícitamente, y CORS ya está configurado en `config/cors.php` para aceptar solo el origen del frontend.

### 3.4 Reorganización de `api.php`

**Archivo modificado:** `api/routes/api.php`

Las rutas se reorganizan en cinco grupos claramente delimitados:

#### Grupo 1 — Rutas públicas (sin autenticación)
```php
Route::middleware('web')->group(function () {
    Route::post('/api/loginUser',        ...);
    Route::post('/api/logoutUser',       ...);
    Route::get('/api/checkUserSession',  ...);
    Route::post('/api/registerConsumer', ...);
    Route::post('/api/enviar_solicitud', ...);
});
```
Estas rutas son accesibles sin sesión porque son el punto de entrada al sistema (login, registro) o formularios públicos (contacto de comercios).

#### Grupo 2 — Administrador (rol 1)
```php
Route::middleware(['web', 'sesion:1'])->group(function () {
    // gestion_consumidores, gestion_comercios_espera,
    // gestion_comercios_activos y sus operaciones CRUD
});
```

#### Grupo 3 — Validador de comercios (rol 3)
```php
Route::middleware(['web', 'sesion:3'])->group(function () {
    // solicitudes_comercios, denegar_solicitud, aceptar_solicitud
});
```

#### Grupo 4 — Comercio (rol 4)
```php
Route::middleware(['web', 'sesion:4'])->group(function () {
    // registerProduct, listado_productos_comercio,
    // cargar_producto, actualizar_producto
});
```

#### Grupo 5 — Consumidor (rol 2)
```php
Route::middleware(['web', 'sesion:2'])->group(function () {
    // perfil_consumidor, pedidos_consumidor
});
```

---

## 4. Cómo funciona una petición protegida

```
Navegador: GET /api/gestion_consumidores
    |
    v
Nginx frontend: proxy_pass al backend
    |
    v
Nginx backend: pasa a PHP-FPM
    |
    v
Laravel: evalua la ruta
  - Middleware 'web': inicializa la sesion PHP
  - Middleware 'sesion:1':
      > comprueba session('id_usuario') -> existe? NO -> 401
      > comprueba session('rol') == 1?  -> correcto? NO -> 403
      > todo correcto -> continua
  - AuthController::getConsumers() se ejecuta
  - Devuelve JSON con los datos
    |
    v
Navegador recibe la respuesta
```

---

## 5. Respuestas de error del middleware

| Situacion | Codigo HTTP | Respuesta JSON |
|---|---|---|
| Sin sesion activa | 401 | `{"error": "No autenticado.", "message": "Debes iniciar sesion..."}` |
| Sesion activa pero rol incorrecto | 403 | `{"error": "Acceso denegado.", "message": "No tienes permisos..."}` |

El frontend (`utils.js`) ya tiene manejo de errores en los callbacks `error` de `$.ajax` que muestran `showModal` con el mensaje del servidor, por lo que estos errores se mostrarán correctamente al usuario sin cambios en el frontend.

---

## 6. Archivos creados y modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `api/app/Http/Middleware/VerificarSesion.php` | **Nuevo** | Middleware personalizado: verifica sesión activa y rol del usuario |
| `api/app/Http/Kernel.php` | Modificado | Registrado alias `sesion` para `VerificarSesion` |
| `api/app/Http/Middleware/VerifyCsrfToken.php` | Modificado | Simplificada exclusión CSRF a `/api/*` |
| `api/routes/api.php` | Modificado | Reorganizadas rutas en grupos por rol con middleware de autenticación |

---

## 7. Aplicar los cambios

```bash
git pull
docker-compose down
docker-compose up -d
```

No es necesario limpiar caché de rutas porque el proyecto no usa `php artisan route:cache` en el entorno de desarrollo.

---

## 8. Verificación

Para comprobar que la autenticación funciona correctamente sin iniciar sesión:

```bash
curl -X GET http://localhost:3000/api/gestion_consumidores
# Esperado: {"error":"No autenticado.","message":"..."} con status 401

curl -X GET http://localhost:3000/api/solicitudes_comercios  
# Esperado: status 401
```

Y con sesión de rol incorrecto (por ejemplo un consumidor intentando acceder a rutas de admin), el backend devolverá 403.
