<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    // Las rutas de API usan JSON; CORS controla el acceso cross-origin.
    protected $except = [
        '/api/*',
    ];
}
