<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/home';

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        $this->routes(function () {
            // Sin prefijo 'api': las rutas de api.php se sirven
            // exactamente como estan definidas (ej: /loginUser, /gestion_consumidores).
            // El prefijo /api lo gestiona el frontend (API_BASE = '/api')
            // y el proxy inverso Nginx lo reenvía completo al backend.
            // Laravel recibe /api/loginUser y lo busca como /api/loginUser,
            // que coincide con Route::post('/loginUser') bajo el grupo sin prefijo.
            //
            // ANTES tenia ->prefix('api') lo que causaba que Laravel
            // buscara /api/api/loginUser (prefijo duplicado).
            Route::middleware('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
