// Requiere: jquery, config.js
// Comprueba la sesión cuando el navegador recupera la página desde caché
// (botón 'atrás' o navegación por historial).
$(window).on('pageshow', function (event) {
    // event.originalEvent.persisted indica que la página viene de la caché bfcache
    if (event.originalEvent && event.originalEvent.persisted) {
        $.ajax({
            url:       API_BASE + '/checkUserSession',
            type:      'GET',
            xhrFields: { withCredentials: true },
            success: function (data) {
                if (!data.active) {
                    window.location.replace('index.html');
                }
            },
            error: function () {
                // Si hay error de conexión, cerramos la sesión por seguridad
                window.location.replace('index.html');
            }
        });
    }
});
