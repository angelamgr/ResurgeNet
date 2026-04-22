<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/api/checkUserSession', function (Request $request) {
    return response()->json([
        'active' => $request->session()->has('id_user')
    ]);
})->middleware('web');

Route::get('/admin_dashboard.html', function () {
    // 1. Verificación de Sesión: Si no hay sesión, redirige inmediatamente.
    if (!session()->has('id_usuario')) {
        return redirect('/login.html'); 
    }
    
    // 2. Control de Caché: Devuelve la vista con las cabeceras de NO-CACHE.
    return response()->view('admin_dashboard')
                   ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                   ->header('Pragma', 'no-cache')
                   ->header('Expires', '0');
});

