<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
 * ============================================================
 * RUTAS DE LA API DE RESURGENET
 * ============================================================
 *
 * Todas las rutas usan el middleware 'web' para tener acceso
 * a las sesiones PHP. El middleware 'sesion' es un middleware
 * personalizado (VerificarSesion) que comprueba:
 *   - Que el usuario tiene sesion activa (sin argumentos)
 *   - Que el rol del usuario es uno de los permitidos (con argumentos)
 *
 * Roles:
 *   1 = Administrador
 *   2 = Consumidor
 *   3 = Validador de comercios
 *   4 = Comercio
 *
 * Rutas publicas: accesibles sin sesion iniciada.
 * Rutas protegidas: requieren sesion + rol correcto.
 * ============================================================
 */

// ------------------------------------------------------------
// RUTAS PUBLICAS
// Accesibles sin sesion: login, registro y contacto.
// ------------------------------------------------------------
Route::middleware('web')->group(function () {

    // Autenticacion
    Route::post('/api/loginUser',       [AuthController::class, 'loginUser']);
    Route::post('/api/logoutUser',      [AuthController::class, 'logoutUser']);
    Route::get('/api/checkUserSession', function (Request $request) {
        return response()->json(['active' => $request->session()->has('id_usuario')]);
    });

    // Registro de nuevos consumidores (pagina publica)
    Route::post('/api/registerConsumer', [AuthController::class, 'registerConsumer']);

    // Formulario de contacto de comercios (pagina publica)
    Route::post('/api/enviar_solicitud', [AuthController::class, 'solicitudComercio']);

});

// ------------------------------------------------------------
// RUTAS PROTEGIDAS
// Requieren sesion activa + rol especifico.
// El middleware 'web' inicializa la sesion; 'sesion:N' la verifica.
// ------------------------------------------------------------

// --- ADMINISTRADOR (rol 1) ---
Route::middleware(['web', 'sesion:1'])->group(function () {

    // Gestion de consumidores
    Route::get('/api/gestion_consumidores',         [AuthController::class, 'getConsumers']);
    Route::delete('/api/gestion_consumidores/{id}', [AuthController::class, 'deleteConsumer']);

    // Gestion de comercios en espera de validacion admin
    Route::get('/api/gestion_comercios_espera',  [AuthController::class, 'getComerciosEspera']);
    Route::put('/api/activar_comercio/{id}',     [AuthController::class, 'activarComercio']);

    // Gestion de comercios dados de alta
    Route::get('/api/gestion_comercios_activos',                    [AuthController::class, 'getComerciosGestion']);
    Route::put('/api/estado_activar_comercio/{id}/activar',         [AuthController::class, 'estadoActivoComercio']);
    Route::put('/api/estado_desactivar_comercio/{id}/desactivar',   [AuthController::class, 'estadoDesactivarComercio']);
    Route::delete('/api/eliminar_comercio/{id}',                    [AuthController::class, 'deleteComercio']);

});

// --- VALIDADOR DE COMERCIOS (rol 3) ---
Route::middleware(['web', 'sesion:3'])->group(function () {

    Route::get('/api/solicitudes_comercios',     [AuthController::class, 'getSolicitudesComercio']);
    Route::put('/api/denegar_solicitud/{id}',    [AuthController::class, 'denegarSolicitudComercio']);
    Route::put('/api/aceptar_solicitud/{id}',    [AuthController::class, 'aceptarSolicitudComercio']);

});

// --- COMERCIO (rol 4) ---
Route::middleware(['web', 'sesion:4'])->group(function () {

    Route::post('/api/registerProduct',                              [AuthController::class, 'registerProduct']);
    Route::get('/api/listado_productos_comercio/{id_comercio}',     [AuthController::class, 'getProductosComercio']);
    Route::get('/api/cargar_producto/{id_producto}',                [AuthController::class, 'getInfoProducto']);
    Route::put('/api/actualizar_producto/{id_producto}',            [AuthController::class, 'actualizarProducto']);

});

// --- CONSUMIDOR (rol 2) ---
Route::middleware(['web', 'sesion:2'])->group(function () {

    Route::get('/api/perfil_consumidor/{id}',  [AuthController::class, 'getPerfilConsumidor']);
    Route::put('/api/perfil_consumidor/{id}',  [AuthController::class, 'actualizarPerfilConsumidor']);
    Route::get('/api/pedidos_consumidor/{id}', [AuthController::class, 'getPedidosConsumidor']);

});
