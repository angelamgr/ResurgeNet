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

