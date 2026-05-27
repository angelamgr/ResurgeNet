<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
 * NOTA SOBRE SESIONES EN RUTAS API:
 * Las rutas definidas en api.php usan por defecto el middleware 'api',
 * que NO inicializa el sistema de sesiones de Laravel.
 * Las rutas que necesitan leer o escribir la sesión (login, logout,
 * checkUserSession) deben incluir el middleware 'web' explicitamente.
 */

// Ruta de Sanctum (no usada activamente, mantenida por compatibilidad)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Login: necesita middleware 'web' para poder escribir la sesion
Route::post('/loginUser', [AuthController::class, 'loginUser'])->middleware('web');

// Logout: necesita middleware 'web' para poder leer y destruir la sesion
Route::post('/logoutUser', [AuthController::class, 'logoutUser'])->middleware('web');

// Comprobacion de sesion activa: necesita middleware 'web' para leer la sesion
// CORREGIDO: 'id_user' -> 'id_usuario' (typo que hacía que siempre devolviera false)
Route::get('/checkUserSession', function (Request $request) {
    return response()->json(['active' => $request->session()->has('id_usuario')]);
})->middleware('web');

// Registro de nuevos consumidores
Route::post('/registerConsumer', [AuthController::class, 'registerConsumer']);

// Registro de nuevos productos
Route::post('/registerProduct', [AuthController::class, 'registerProduct']);

// Gestion de consumidores
Route::get('gestion_consumidores',        [AuthController::class, 'getConsumers']);
Route::delete('gestion_consumidores/{id}', [AuthController::class, 'deleteConsumer']);

// Gestion de comercios en espera de validacion
Route::get('gestion_comercios_espera',   [AuthController::class, 'getComerciosEspera']);
Route::put('activar_comercio/{id}',      [AuthController::class, 'activarComercio']);

// Gestion de comercios dados de alta
Route::get('gestion_comercios_activos',                       [AuthController::class, 'getComerciosGestion']);
Route::put('estado_activar_comercio/{id}/activar',            [AuthController::class, 'estadoActivoComercio']);
Route::put('estado_desactivar_comercio/{id}/desactivar',      [AuthController::class, 'estadoDesactivarComercio']);
Route::delete('eliminar_comercio/{id}',                       [AuthController::class, 'deleteComercio']);

// Formulario de contacto de comercios
Route::post('/enviar_solicitud', [AuthController::class, 'solicitudComercio']);

// Solicitudes almacenadas (validador)
Route::get('/solicitudes_comercios',        [AuthController::class, 'getSolicitudesComercio']);
Route::put('/denegar_solicitud/{id}',       [AuthController::class, 'denegarSolicitudComercio']);
Route::put('/aceptar_solicitud/{id}',       [AuthController::class, 'aceptarSolicitudComercio']);

// Productos
Route::get('/listado_productos_comercio/{id_comercio}', [AuthController::class, 'getProductosComercio']);
Route::get('/cargar_producto/{id_producto}',             [AuthController::class, 'getInfoProducto']);
Route::put('/actualizar_producto/{id_producto}',         [AuthController::class, 'actualizarProducto']);

// Perfil y pedidos del consumidor
Route::get('/perfil_consumidor/{id}',  [AuthController::class, 'getPerfilConsumidor']);
Route::put('/perfil_consumidor/{id}',  [AuthController::class, 'actualizarPerfilConsumidor']);
Route::get('/pedidos_consumidor/{id}', [AuthController::class, 'getPedidosConsumidor']);
