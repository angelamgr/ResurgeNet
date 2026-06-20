<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verifica sesion activa y, opcionalmente, que el rol del usuario
 * coincide con uno de los roles permitidos para la ruta.
 *
 * Uso: ->middleware('sesion:1,4')
 * Roles: 1=Administrador, 2=Consumidor, 3=Validador, 4=Comercio
 */
class VerificarSesion
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->session()->has('id_usuario')) {
            return response()->json([
                'error'   => 'No autenticado.',
                'message' => 'Debes iniciar sesion para acceder a este recurso.',
            ], 401);
        }

        if (!empty($roles)) {
            $rolUsuario      = intval($request->session()->get('rol'));
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
