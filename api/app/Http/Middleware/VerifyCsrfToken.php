<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * URIs excluidas de la verificacion CSRF.
     * Las rutas de API que usan JSON no necesitan CSRF porque
     * el navegador no puede enviar peticiones JSON cross-site
     * con credenciales sin la cabecera Origin, que CORS ya controla.
     */
    protected $except = [
        '/api/*',
    ];
}
