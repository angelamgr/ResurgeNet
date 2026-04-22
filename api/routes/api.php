<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

//Ruta publica para el inicio de sesion
Route::post('/loginUser', [AuthController::class, 'loginUser']);

//Ruta cierre de sesion
Route::middleware('web')->post('/logoutUser', [AuthController::class, 'logoutUser']);

Route::get('/checkUserSession', function (Request $request) {
    return response()->json([
        'active' => $request->session()->has('id_user')
    ]);
})->middleware('web');

//Ruta para el registro de nuevos consumidores
Route::post('/registerConsumer', [AuthController::class, 'registerConsumer']);

//Ruta para el registro de nuevos productos
Route::post('/registerProduct', [AuthController::class, 'registerProduct']);

//rutas para la gestion de consumidores
Route::get('gestion_consumidores', [AuthController::class, 'getConsumers']);
Route::delete('gestion_consumidores/{id}', [AuthController::class, 'deleteConsumer']);


//rutas para la gestion de comercios en espera de validacion
Route::get('gestion_comercios_espera', [AuthController::class, 'getComerciosEspera']);
Route::put('activar_comercio/{id}', [AuthController::class, 'activarComercio']);

//rutas para la gestion de comercios dados de alta
Route::get('gestion_comercios_activos', [AuthController::class, 'getComerciosGestion']);
Route::put('estado_activar_comercio/{id}/activar', [AuthController::class, 'estadoActivoComercio']);
Route::put('estado_desactivar_comercio/{id}/desactivar', [AuthController::class, 'estadoDesactivarComercio']);
Route::delete('eliminar_comercio/{id}', [AuthController::class, 'deleteComercio']);

//ruta para la gestión del formulario de contacto del comercio
Route::post('/enviar_solicitud', [AuthController::class, 'solicitudComercio']);

//ruta para ver el listado de las solicitudes que tenemos almacenadas en la base de datos
Route::get('/solicitudes_comercios', [AuthController::class, 'getSolicitudesComercio']);

//ruta para denegar las solicitudes de los comercios (solo para el validador)
Route::put('/denegar_solicitud/{id}', [AuthController::class, 'denegarSolicitudComercio']);

//ruta para aceptar las solicitudes de los comercios (solo para el validador)
Route::put('/aceptar_solicitud/{id}', [AuthController::class, 'aceptarSolicitudComercio']);

//ruta para obtener el listado de productos de un comercio (solo para comercio)
Route::get('/listado_productos_comercio/{id_comercio}', [AuthController::class, 'getProductosComercio']);

//ruta para cargar la información de un producto específico (solo para comercio)
Route::get('/cargar_producto/{id_producto}', [AuthController::class, 'getInfoProducto']);

//ruta para actualizar la información de un producto específico (solo para comercio)
Route::put('/actualizar_producto/{id_producto}', [AuthController::class, 'actualizarProducto']);