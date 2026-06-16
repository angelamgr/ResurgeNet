// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    $('#logout-btn').on('click', function (e) {
        e.preventDefault();
        $.ajax({
            url:       API_BASE + '/logoutUser',
            type:      'POST',
            xhrFields: { withCredentials: true },
            success: function (response) {
                // Limpiar localStorage para eliminar datos del usuario anterior.
                // Evita que una sesion siguiente encuentre IDs de una sesion previa.
                localStorage.removeItem('id_usuario_comercio');

                showModal('Sesión Cerrada', 'Será redirigido al inicio en 3 segundos...', 'success');
                setTimeout(function () {
                    // location.replace en lugar de href para que la pagina
                    // de destino no quede en el historial y no se pueda
                    // volver atras a ella con el boton del navegador.
                    window.location.replace('inicio_sesion.html');
                }, 3000);
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.message)
                    ? xhr.responseJSON.message
                    : 'Error al intentar cerrar la sesión';
                showModal('Error', msg);
            }
        });
    });
});
