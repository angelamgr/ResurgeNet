<?php

use Illuminate\Support\Str;

return [

    'driver' => env('SESSION_DRIVER', 'file'),

    'lifetime' => env('SESSION_LIFETIME', 120),

    'expire_on_close' => false,

    'encrypt' => false,

    'files' => storage_path('framework/sessions'),

    'connection' => env('SESSION_CONNECTION'),

    'table' => 'sessions',

    'store' => env('SESSION_STORE'),

    'lottery' => [2, 100],

    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_session'
    ),

    'path' => '/',

    'domain' => null,

    /*
     * secure: false permite que la cookie de sesión se envíe por HTTP en local.
     * En producción (HTTPS) cambiar a true mediante la variable de entorno
     * SESSION_SECURE_COOKIE=true en el .env del servidor.
     */
    'secure' => env('SESSION_SECURE_COOKIE', false),

    'http_only' => true,

    /*
     * same_site: 'lax' es el valor correcto para un proyecto donde frontend
     * y backend comparten el mismo dominio via proxy inverso Nginx.
     * 'none' solo es necesario cuando los dominios son distintos (cross-site),
     * y exige secure:true obligatoriamente, rompiendo el entorno HTTP local.
     */
    'same_site' => 'lax',

    'partitioned' => false,

];
