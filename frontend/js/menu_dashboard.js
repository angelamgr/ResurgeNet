$(document).ready(function() {

    // Botón de desplegar/cerrar el sidebar
    $('.toggle-btn').click(function(e) {
        e.stopPropagation(); // evita que el click se propague al body
        $('.sidebar').toggleClass('open');

        // Oculta el botón si sidebar está abierto
        if ($('.sidebar').hasClass('open')) {
            $(this).hide();
        } else {
            $(this).show();
        }
    });

    // Detecta clicks fuera del sidebar
    $(document).click(function(e) {
        var sidebar = $('.sidebar');
        var toggleBtn = $('.toggle-btn');

        // Si el sidebar está abierto y el click no es dentro del sidebar
        if (sidebar.hasClass('open') && !$(e.target).closest('.sidebar').length) {
            sidebar.removeClass('open');
            toggleBtn.show(); // volver a mostrar el botón
        }
    });

    // Evita que clicks dentro del sidebar cierren el menú
    $('.sidebar').click(function(e){
        e.stopPropagation();
    });

});

