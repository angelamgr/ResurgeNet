// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    $('#logout-btn').on('click', function (e) {
        e.preventDefault();
        $.ajax({
            url:       API_BASE + '/logoutUser',
            type:      'POST',
            xhrFields: { withCredentials: true },
            success: function (response) {
                showModal('Sesión Cerrada', 'Será redirigido al inicio en 3 segundos...', 'success');
                setTimeout(function () {
                    window.location.replace('index.html');
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
