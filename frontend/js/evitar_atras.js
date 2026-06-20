// Proteccion contra navegacion por historial en paginas protegidas.
$(window).on('pageshow', function (event) {
    if (event.originalEvent && event.originalEvent.persisted) {
        $.ajax({
            url:       API_BASE + '/checkUserSession',
            type:      'GET',
            xhrFields: { withCredentials: true },
            success:   function (data) { if (!data.active) window.location.replace('index.html'); },
            error:     function ()     { window.location.replace('index.html'); }
        });
    }
});
