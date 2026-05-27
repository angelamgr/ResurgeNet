# Auditoría del backend — Problemas de prioridad alta

**Fecha:** 2026-05-27  
**Autor:** Claude (asistente IA)  
**Alcance:** Análisis de los problemas críticos del backend de ResurgeNet que deben resolverse antes de cualquier despliegue en producción

---

## Introducción

Tras revisar en profundidad el código del backend (`AuthController.php`, `api.php` y la configuración de middleware), se identificaron 5 problemas de prioridad alta. Se consideran de prioridad alta aquellos que afectan a la **seguridad**, la **integridad de los datos** o el **funcionamiento correcto** de funcionalidades ya implementadas. Cualquiera de ellos, por sí solo, puede comprometer la aplicación en producción o generar datos corruptos en la base de datos.

---

## Problema 1 — Sin autenticación en ninguna ruta de la API

### Descripción

Todas las rutas definidas en `api/routes/api.php` son completamente públicas. No existe ningún middleware de autenticación que proteja los endpoints sensibles. Ejemplos concretos de lo que cualquier persona puede hacer sin identificarse, simplemente conociendo la URL:

- `GET /api/gestion_consumidores` — obtener el listado completo de usuarios registrados con sus IDs.
- `DELETE /api/gestion_consumidores/{id}` — eliminar cualquier consumidor de la base de datos.
- `DELETE /api/eliminar_comercio/{id}` — eliminar cualquier comercio.
- `PUT /api/estado_activar_comercio/{id}/activar` — activar cualquier comercio sin ser administrador.
- `GET /api/pedidos_consumidor/{id}` — leer los pedidos de cualquier consumidor conociendo su ID.

### Por qué es un problema grave

El único control de acceso existente en la aplicación está en el **frontend**: el menú de administrador solo aparece si el usuario ha iniciado sesión con rol de administrador. Esto es insuficiente porque el frontend es código que se ejecuta en el navegador del usuario y puede ser ignorado completamente. Cualquier persona con conocimientos básicos puede abrir las herramientas de desarrollo del navegador, Postman, curl o cualquier cliente HTTP y llamar directamente a las URLs del backend sin pasar por la interfaz. La protección debe estar en el servidor, no en el cliente.

Esto no es una vulnerabilidad teórica: es un fallo de diseño que convierte la base de datos en efectivamente pública para cualquiera que encuentre la URL del servidor.

### Cómo resolverlo

Laravel incluye el paquete **Sanctum** ya instalado en el proyecto (visible en `api.php`: `Route::middleware('auth:sanctum')`). La solución estándar es:

**Paso 1:** Agrupar las rutas protegidas bajo middleware de autenticación en `api.php`:

```php
// Rutas publicas (no requieren sesion)
Route::post('/loginUser',      [AuthController::class, 'loginUser']);
Route::post('/registerConsumer', [AuthController::class, 'registerConsumer']);
Route::post('/enviar_solicitud', [AuthController::class, 'solicitudComercio']);

// Rutas protegidas: requieren sesion iniciada
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logoutUser', [AuthController::class, 'logoutUser']);

    // Solo administrador (rol 1)
    Route::middleware('role:1')->group(function () {
        Route::get('gestion_consumidores', [AuthController::class, 'getConsumers']);
        Route::delete('gestion_consumidores/{id}', [AuthController::class, 'deleteConsumer']);
        Route::get('gestion_comercios_espera', [AuthController::class, 'getComerciosEspera']);
        // ... resto de rutas de admin
    });

    // Solo comercio (rol 4)
    Route::middleware('role:4')->group(function () {
        Route::get('/listado_productos_comercio/{id}', [AuthController::class, 'getProductosComercio']);
        Route::post('/registerProduct', [AuthController::class, 'registerProduct']);
        // ... resto de rutas de comercio
    });
});
```

**Paso 2:** Crear un middleware `CheckRole` que verifique el rol del usuario autenticado antes de dar acceso a la ruta.

**Paso 3:** Usar tokens de Sanctum (o sesiones con el guard `web`) en lugar de la sesión manual actual, que como se verá en el Problema 2 está rota.

---

## Problema 2 — `checkUserSession` tiene un typo que lo rompe completamente

### Descripción

En `api/routes/api.php`, la ruta que comprueba si hay una sesión activa es:

```php
Route::get('/checkUserSession', function (Request $request) {
    return response()->json(['active' => $request->session()->has('id_user')]);
})->middleware('web');
```

Sin embargo, en `loginUser` dentro de `AuthController.php`, la clave que se guarda en la sesión es:

```php
session(['id_usuario' => $user->id_usuario]);  // clave: 'id_usuario'
session(['rol'        => intval($user->rol)]);
```

La clave guardada es `id_usuario`. La clave comprobada es `id_user`. Son distintas. El resultado es que `checkUserSession` **siempre devuelve `false`**, aunque el usuario haya iniciado sesión correctamente.

### Por qué es un problema grave

El archivo `frontend/js/evitar_atras.js` llama a `checkUserSession` cada vez que el navegador recupera una página desde la caché (botón "atrás"). Como la respuesta siempre es `active: false`, el JS redirige al usuario a `index.html` en cada pulsación del botón atrás, aunque su sesión sea válida. Esto hace que la navegación hacia atrás sea completamente inutilizable para cualquier usuario logueado.

Además, si en el futuro se añaden comprobaciones de sesión en más lugares (como proteger rutas del frontend), todas fallarían por el mismo motivo.

### Cómo resolverlo

Corregir el typo en `api.php`, cambiando `id_user` por `id_usuario`:

```php
// Antes (roto):
Route::get('/checkUserSession', function (Request $request) {
    return response()->json(['active' => $request->session()->has('id_user')]);
})->middleware('web');

// Despues (correcto):
Route::get('/checkUserSession', function (Request $request) {
    return response()->json(['active' => $request->session()->has('id_usuario')]);
})->middleware('web');
```

Esto es un cambio de una palabra que restaura una funcionalidad que nunca ha funcionado en producción.

---

## Problema 3 — Contraseñas hasheadas con SHA-256 en lugar de bcrypt

### Descripción

Los métodos `loginUser` y `registerConsumer` usan `hash('sha256', $password)` para hashear las contraseñas:

```php
// En loginUser:
$hashGenerado = hash('sha256', $request->password);
if ($hashGenerado !== $user->password) { ... }

// En registerConsumer:
'password' => hash('sha256', $request->password)
```

Sin embargo, `aceptarSolicitudComercio` usa `bcrypt()` correctamente:

```php
'password' => bcrypt($solicitud->nombreComercio)
```

Hay dos algoritmos de hash distintos en uso simultáneo, lo que además significa que los usuarios creados desde `aceptarSolicitudComercio` **nunca podrán iniciar sesión**, porque `loginUser` verifica con SHA-256 pero su contraseña está guardada con bcrypt.

### Por qué es un problema grave

SHA-256 tiene dos defectos fundamentales cuando se usa para almacenar contraseñas:

**1. Es un hash rápido sin sal.** SHA-256 está diseñado para ser extremadamente rápido (procesa gigabytes por segundo). Esto es exactamente lo que no se quiere en un hash de contraseña, porque permite a un atacante probar millones de contraseñas por segundo en un ataque de fuerza bruta offline si obtiene los hashes de la base de datos.

**2. Sin sal aleatoria por usuario.** Dos usuarios con la misma contraseña tendrán el mismo hash, lo que permite ataques de tabla arcoíris y revela qué usuarios comparten contraseña.

bcrypt, en cambio, genera automáticamente una sal aleatoria por cada hash, está deliberadamente diseñado para ser lento (configurable mediante el parámetro `cost`) y es el estándar de la industria para almacenamiento de contraseñas. Laravel envuelve bcrypt en `Hash::make()` y `Hash::check()`.

### Cómo resolverlo

**En `registerConsumer`**, cambiar el hash al guardar:
```php
// Antes:
'password' => hash('sha256', $request->password)

// Despues:
'password' => Hash::make($request->password)
```

**En `loginUser`**, cambiar la verificación:
```php
// Antes:
$hashGenerado = hash('sha256', $request->password);
if ($hashGenerado !== $user->password) { ... }

// Despues:
if (!Hash::check($request->password, $user->password)) { ... }
```

`Hash` ya está importado en el controlador (`use Illuminate\Support\Facades\Hash`) pero nunca se usa.

**Consideración de migración:** los usuarios ya registrados tienen sus contraseñas en SHA-256. Al cambiar el algoritmo, esos hashes serán incompatibles con `Hash::check()`. La migración correcta es forzar a todos los usuarios existentes a restablecer su contraseña, o implementar una lógica de transición que detecte el formato del hash almacenado y aplique el método correspondiente durante un período.

---

## Problema 4 — Contraseña de comercio expuesta en texto plano en el email

### Descripción

Cuando el administrador activa un comercio desde el panel, el método `activarComercio` envía un email al comercio con sus credenciales:

```php
Mail::raw(
    "Hola $nombreComercio,\n"
    . "Su solicitud ha sido aceptada.\n"
    . "Usuario: $solicitud->nombreComercio\n"
    . "Contraseña: $solicitud->nombreComercio\n\n"  // <-- contrasena en texto plano
    . "Saludos,\nResurgeNet",
    ...
);
```

La contraseña inicial asignada al comercio es el propio nombre del comercio, y se envía sin cifrar en el cuerpo del email.

### Por qué es un problema grave

Enviar contraseñas por email en texto plano viola las prácticas mínimas de seguridad por varias razones:

**1. Los emails no son un canal seguro.** Un email puede ser interceptado en tránsito, almacenado en servidores intermedios, indexado en búsquedas del buzn de entrada, o accedido por terceros con acceso a la cuenta de email del destinatario.

**2. La contraseña es predecible.** Usar el nombre del comercio como contraseña inicial es trivialmente adivinable. Cualquiera que sepa el nombre de un comercio en ResurgeNet puede intentar iniciar sesión con esa contraseña.

**3. Ningún sistema debe conocer la contraseña en texto plano.** Si el sistema puede enviarla por email, significa que la tiene almacenada o la genera él mismo. En este caso la genera (es el nombre del comercio), pero el principio es el mismo: la contraseña nunca debería existir en texto plano más allá del momento de su creación.

### Cómo resolverlo

El patrón correcto es el de **enlace de activación con token de un solo uso**:

**Paso 1:** Al activar el comercio, generar un token único y almacenarlo en la base de datos con una fecha de expiración:
```php
$token = bin2hex(random_bytes(32)); // token criptográficamente seguro
DB::table('password_resets')->insert([
    'email'      => $solicitud->email,
    'token'      => Hash::make($token),
    'created_at' => now(),
]);
```

**Paso 2:** Enviar al comercio un email con un enlace que incluya el token, no la contraseña:
```
Hola [Nombre],
Su solicitud ha sido aceptada. Para establecer su contraseña, haga clic en el siguiente enlace
(válido durante 48 horas):
https://resurgenet.com/establecer_password.html?token=abc123...
```

**Paso 3:** Crear una página donde el comercio introduzca su nueva contraseña. El backend valida el token, verifica que no ha expirado, y guarda la nueva contraseña hasheada con `Hash::make()`.

Este es exactamente el flujo que usa Laravel con `php artisan make:password-reset` y que cualquier usuario reconoce de sistemas como Google, GitHub o cualquier plataforma moderna.

---

## Problema 5 — `registerConsumer` sin transacción de base de datos

### Descripción

El registro de un consumidor requiere insertar datos en **dos tablas**: primero en `usuario` (datos de autenticación) y después en `consumidor` (datos del perfil). El código actual hace las dos inserciones de forma independiente, sin envolverlas en una transacción:

```php
public function registerConsumer(Request $request) {
    try {
        // INSERT en tabla usuario
        $id_usuario = DB::table('usuario')->insertGetId([
            'nombre'   => $request->nombre,
            'usuario'  => $request->username,
            'password' => hash('sha256', $request->password),
            'rol'      => 2,
        ]);

        // Procesamiento de fecha (puede fallar)
        $date_object = \DateTime::createFromFormat('d/m/Y', $request->input('fecha_nacimiento'));
        if ($date_object === false) {
            return response()->json(['message' => 'Formato de fecha incorrecto.'], 400);
            // Si llega aqui, el INSERT en usuario ya se ha ejecutado
            // y no hay rollback: queda un usuario huerfano en la BD
        }

        // INSERT en tabla consumidor
        DB::table('consumidor')->insert([
            'id'         => $id_usuario,
            'direccion'  => $request->direccion,
            // ...
        ]);
    } catch (\Exception $e) {
        // Si consumidor->insert() lanza excepcion,
        // el registro en usuario ya existe sin su consumidor correspondiente
        return response()->json(['message' => 'Error interno del servidor.'], 500);
    }
}
```

### Por qué es un problema grave

Si el primer `INSERT` (en `usuario`) tiene éxito pero el segundo (en `consumidor`) falla por cualquier motivo —formato de fecha incorrecto, error de conexión, violación de restricción en la BD—, la base de datos queda en un **estado inconsistente**: existe un registro en `usuario` sin su correspondiente registro en `consumidor`.

Esto tiene consecuencias en cadena:
- El usuario queda "registrado" pero sin perfil: cualquier consulta que haga JOIN entre `usuario` y `consumidor` no encontrará resultados para ese usuario.
- El username o email quedan "ocupados" en la tabla `usuario`, impidiendo que esa persona intente registrarse de nuevo con los mismos datos.
- Detectar y limpiar estos registros huérfanos manualmente es costoso y propenso a errores.

Por comparación, `deleteConsumer` sí usa transacción correctamente, lo que muestra que la herramienta está disponible pero no se aplicó en el registro.

### Cómo resolverlo

Envolver ambas inserciones en una transacción `DB::transaction()`. Si cualquier operación dentro del bloque falla, Laravel hace automáticamente rollback de todas las operaciones anteriores del mismo bloque:

```php
public function registerConsumer(Request $request) {
    // Validar la fecha ANTES de iniciar la transaccion
    $date_object = \DateTime::createFromFormat('d/m/Y', $request->input('fecha_nacimiento'));
    if ($date_object === false) {
        return response()->json(['message' => 'Formato de fecha incorrecto.'], 400);
    }

    try {
        DB::transaction(function () use ($request, $date_object) {
            $id_usuario = DB::table('usuario')->insertGetId([
                'nombre'   => $request->nombre,
                'usuario'  => $request->username,
                'password' => Hash::make($request->password),
                'rol'      => 2,
            ]);

            DB::table('consumidor')->insert([
                'id'        => $id_usuario,
                'direccion' => $request->direccion,
                'ciudad'    => $request->ciudad,
                'cod_postal'=> $request->cod_postal,
                'n_telefono'=> $request->telefono,
                'email'     => $request->email,
                'fecha_nac' => $date_object->format('Y-m-d'),
            ]);
        });

        return response()->json([
            'message'  => 'Registro completado con éxito.',
            'redirect' => 'inicio_sesion.html'
        ]);
    } catch (\Exception $e) {
        \Log::error('Error de registro: ' . $e->getMessage());
        return response()->json(['message' => 'Error interno del servidor.'], 500);
    }
}
```

Con este cambio, si el INSERT en `consumidor` falla por cualquier motivo, el INSERT en `usuario` se deshace automáticamente y la base de datos queda en el mismo estado que antes de intentar el registro.

---

## Resumen de problemas de prioridad alta

| # | Problema | Archivo afectado | Impacto directo |
|---|---|---|---|
| 1 | Sin autenticación en rutas de la API | `api/routes/api.php` | Cualquier persona puede leer, modificar o eliminar datos sin identificarse |
| 2 | Typo en `checkUserSession` (`id_user` vs `id_usuario`) | `api/routes/api.php` | El botón "atrás" del navegador cierra la sesión del usuario siempre |
| 3 | SHA-256 para contraseñas + inconsistencia con bcrypt | `AuthController.php` | Contraseñas vulnerables; usuarios creados por el validador no pueden hacer login |
| 4 | Contraseña enviada en texto plano por email | `AuthController.php` | Exposición de credenciales en canal no seguro |
| 5 | Registro de consumidor sin transacción | `AuthController.php` | Base de datos puede quedar en estado inconsistente con usuarios huérfanos |
