<?php

use Illuminate\Support\Facades\Route;

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


// Ruta para el dashboard del administrador con control de caché para que al volver atras no muestre datos almacenados
Route::get('/admin_dashboard.html', function () {
    if (!session()->has('id_usuario')) {
        return redirect('/login.html');
    }
    return response()->view('admin_dashboard')
                   ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                   ->header('Pragma', 'no-cache')
                   ->header('Expires', '0');
});

