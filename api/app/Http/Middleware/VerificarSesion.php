<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * VerificarSesion
 *
 * Middleware de autenticacion basado en sesion PHP.
 * Comprueba que el usuario tiene una sesion activa y,
 * opcionalmente, que su rol coincide con uno de los roles
 * permitidos para la ruta.
 *
 * Uso en rutas:
 *   ->middleware('sesion')           // solo requiere sesion activa
 *   ->middleware('sesion:1')         // requiere rol 1 (admin)
 *   ->middleware('sesion:1,4')       // requiere rol 1 o rol 4
 *
 * Roles del sistema:
 *   1 = Administrador
 *   2 = Consumidor
 *   3 = Validador de comercios
 *   4 = Comercio
 */
class VerificarSesion
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // 1. Comprobar que existe sesion activa
        if (!$request->session()->has('id_usuario')) {
            return response()->json([
                'error'   => 'No autenticado.',
                'message' => 'Debes iniciar sesion para acceder a este recurso.',
            ], 401);
        }

        // 2. Si se especificaron roles, comprobar que el rol del usuario es uno de ellos
        if (!empty($roles)) {
            $rolUsuario = intval($request->session()->get('rol'));
            $rolesPermitidos = array_map('intval', $roles);

            if (!in_array($rolUsuario, $rolesPermitidos, true)) {
                return response()->json([
                    'error'   => 'Acceso denegado.',
                    'message' => 'No tienes permisos para realizar esta accion.',
                ], 403);
            }
        }

        return $next($request);
    }
}
