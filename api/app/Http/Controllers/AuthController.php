<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    //funcion para el inicio se sesion del usuario
    public function loginUser(Request $request){
        // Validación
        $request->validate([
            'usuario' => 'required',
            'password' => 'required'
        ]);

        // Buscar el usuario en la base de datos
        $user = DB::table('usuario')->where('usuario', $request->usuario)->first(); 

        if (!$user) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // Comprobamos la contraseña (SHA-256 si usas trigger en BD)
        if (hash('sha256', $request->password) !== $user->password) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // Guardar sesión
        session(['id_usuario' => $user->id_usuario]);
        session(['rol' => intval($user->rol)]);

        // Redirigir según rol
        $redirect = '';
        switch(intval($user->rol)){
            case 1: // Administrador
                $redirect = 'admin_dashboard.html';
                break;
            case 3: // Validador de comercio
                $redirect = 'index.html';
                break;
            default: // Otros roles
                $redirect = 'index.html';
        }

        return response()->json([
            'message' => 'Sesión iniciada',
            'redirect' => $redirect
        ]);
    }

    //funcion para el cierre de sesion del usuario
    public function logoutUser(Request $request){
        $request->session()->forget('id_usuario'); // eliminar sesión
        //eliminar los datos relacionados con la sesion??? 
        return response()->json([
            'message' => 'Sesión cerrada'
        ]);
    }
}
