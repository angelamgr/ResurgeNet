$(document).ready(function() {

    var toggleBtn = $('.toggle-btn');
    var sidebar   = $('.sidebar');

    // Abre/cierra el sidebar y actualiza aria-expanded
    toggleBtn.on('click', function(e) {
        e.stopPropagation();
        var isOpen = sidebar.hasClass('open');
        sidebar.toggleClass('open');
        toggleBtn.attr('aria-expanded', !isOpen);

        if (!isOpen) {
            // Sidebar abre: mueve el foco al primer enlace del menú
            sidebar.find('a, button').first().focus();
            toggleBtn.hide();
        } else {
            toggleBtn.show();
        }
    });

    // Cierra el sidebar al hacer click fuera
    $(document).on('click', function(e) {
        if (sidebar.hasClass('open') && !$(e.target).closest('.sidebar').length) {
            sidebar.removeClass('open');
            toggleBtn.attr('aria-expanded', 'false').show();
        }
    });

    // Cierra el sidebar al pulsar Escape
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.hasClass('open')) {
            sidebar.removeClass('open');
            toggleBtn.attr('aria-expanded', 'false').show().focus();
        }
    });

    // Evita que clicks dentro del sidebar lo cierren
    sidebar.on('click', function(e) {
        e.stopPropagation();
    });

});
