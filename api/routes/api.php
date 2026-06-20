<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
 * Rutas de la API. Middleware 'web' para sesiones; 'sesion:N' para control de acceso por rol.
 * Roles: 1=Administrador, 2=Consumidor, 3=Validador, 4=Comercio
 */

// Rutas publicas
Route::middleware('web')->group(function () {
    Route::post('/api/loginUser',       [AuthController::class, 'loginUser']);
    Route::post('/api/logoutUser',      [AuthController::class, 'logoutUser']);
    Route::get('/api/checkUserSession', function (Request $request) {
        return response()->json(['active' => $request->session()->has('id_usuario')]);
    });
    Route::post('/api/registerConsumer', [AuthController::class, 'registerConsumer']);
    Route::post('/api/enviar_solicitud', [AuthController::class, 'solicitudComercio']);
});

// Administrador (rol 1)
Route::middleware(['web', 'sesion:1'])->group(function () {
    Route::get('/api/gestion_consumidores',                       [AuthController::class, 'getConsumers']);
    Route::delete('/api/gestion_consumidores/{id}',               [AuthController::class, 'deleteConsumer']);
    Route::get('/api/gestion_comercios_espera',                   [AuthController::class, 'getComerciosEspera']);
    Route::put('/api/activar_comercio/{id}',                      [AuthController::class, 'activarComercio']);
    Route::get('/api/gestion_comercios_activos',                  [AuthController::class, 'getComerciosGestion']);
    Route::put('/api/estado_activar_comercio/{id}/activar',       [AuthController::class, 'estadoActivoComercio']);
    Route::put('/api/estado_desactivar_comercio/{id}/desactivar', [AuthController::class, 'estadoDesactivarComercio']);
    Route::delete('/api/eliminar_comercio/{id}',                  [AuthController::class, 'deleteComercio']);
});

// Validador (rol 3)
Route::middleware(['web', 'sesion:3'])->group(function () {
    Route::get('/api/solicitudes_comercios',  [AuthController::class, 'getSolicitudesComercio']);
    Route::put('/api/denegar_solicitud/{id}', [AuthController::class, 'denegarSolicitudComercio']);
    Route::put('/api/aceptar_solicitud/{id}', [AuthController::class, 'aceptarSolicitudComercio']);
});

// Comercio (rol 4)
Route::middleware(['web', 'sesion:4'])->group(function () {
    Route::post('/api/registerProduct',                             [AuthController::class, 'registerProduct']);
    Route::get('/api/listado_productos_comercio/{id_comercio}',     [AuthController::class, 'getProductosComercio']);
    Route::get('/api/cargar_producto/{id_producto}',                [AuthController::class, 'getInfoProducto']);
    Route::put('/api/actualizar_producto/{id_producto}',            [AuthController::class, 'actualizarProducto']);
});

// Consumidor (rol 2)
Route::middleware(['web', 'sesion:2'])->group(function () {
    Route::get('/api/perfil_consumidor/{id}',  [AuthController::class, 'getPerfilConsumidor']);
    Route::put('/api/perfil_consumidor/{id}',  [AuthController::class, 'actualizarPerfilConsumidor']);
    Route::get('/api/pedidos_consumidor/{id}', [AuthController::class, 'getPedidosConsumidor']);
});
