<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Las rutas se definen con el prefijo /api/ incluido
// porque el RouteServiceProvider no anade prefijo automaticamente.
// El frontend envia /api/loginUser, el proxy lo reenvía tal cual,
// y Laravel busca exactamente /api/loginUser.

// Sanctum (mantenido por compatibilidad)
Route::middleware('auth:sanctum')->get('/api/user', function (Request $request) {
    return $request->user();
});

// Autenticacion - necesitan middleware 'web' para sesiones
Route::post('/api/loginUser',        [AuthController::class, 'loginUser'])->middleware('web');
Route::post('/api/logoutUser',       [AuthController::class, 'logoutUser'])->middleware('web');
Route::get('/api/checkUserSession',  function (Request $request) {
    return response()->json(['active' => $request->session()->has('id_usuario')]);
})->middleware('web');

// Registro
Route::post('/api/registerConsumer', [AuthController::class, 'registerConsumer']);
Route::post('/api/registerProduct',  [AuthController::class, 'registerProduct']);

// Gestion de consumidores
Route::get('/api/gestion_consumidores',         [AuthController::class, 'getConsumers']);
Route::delete('/api/gestion_consumidores/{id}', [AuthController::class, 'deleteConsumer']);

// Gestion de comercios en espera
Route::get('/api/gestion_comercios_espera', [AuthController::class, 'getComerciosEspera']);
Route::put('/api/activar_comercio/{id}',    [AuthController::class, 'activarComercio']);

// Gestion de comercios dados de alta
Route::get('/api/gestion_comercios_activos',                         [AuthController::class, 'getComerciosGestion']);
Route::put('/api/estado_activar_comercio/{id}/activar',              [AuthController::class, 'estadoActivoComercio']);
Route::put('/api/estado_desactivar_comercio/{id}/desactivar',        [AuthController::class, 'estadoDesactivarComercio']);
Route::delete('/api/eliminar_comercio/{id}',                         [AuthController::class, 'deleteComercio']);

// Formulario de contacto
Route::post('/api/enviar_solicitud', [AuthController::class, 'solicitudComercio']);

// Solicitudes del validador
Route::get('/api/solicitudes_comercios',    [AuthController::class, 'getSolicitudesComercio']);
Route::put('/api/denegar_solicitud/{id}',   [AuthController::class, 'denegarSolicitudComercio']);
Route::put('/api/aceptar_solicitud/{id}',   [AuthController::class, 'aceptarSolicitudComercio']);

// Productos
Route::get('/api/listado_productos_comercio/{id_comercio}', [AuthController::class, 'getProductosComercio']);
Route::get('/api/cargar_producto/{id_producto}',            [AuthController::class, 'getInfoProducto']);
Route::put('/api/actualizar_producto/{id_producto}',        [AuthController::class, 'actualizarProducto']);

// Perfil y pedidos del consumidor
Route::get('/api/perfil_consumidor/{id}',  [AuthController::class, 'getPerfilConsumidor']);
Route::put('/api/perfil_consumidor/{id}',  [AuthController::class, 'actualizarPerfilConsumidor']);
Route::get('/api/pedidos_consumidor/{id}', [AuthController::class, 'getPedidosConsumidor']);
