// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    var idUsuario = localStorage.getItem('id_usuario_comercio');
    if (!idUsuario) {
        window.location.href = 'inicio_sesion.html';
        return;
    }

    $.ajax({
        url:       API_BASE + '/perfil_consumidor/' + idUsuario,
        type:      'GET',
        xhrFields: { withCredentials: true },
        success: function (data) {
            $('#nombre_campo').val(data.nombre        || '');
            $('#ciudad').val(data.ciudad              || '');
            $('#email').val(data.email                || '');
            $('#telefono').val(data.n_telefono        || '');
            $('#direccion').val(data.direccion        || '');
            $('#fecha_nacimiento').val(data.fecha_nac || '');
            $('#cod_postal').val(data.cod_postal      || '');
        },
        error: function (xhr) {
            var msg = (xhr.responseJSON && xhr.responseJSON.error)
                ? xhr.responseJSON.error
                : 'No se pudieron cargar tus datos. Inténtalo de nuevo.';
            showModal('Error al cargar datos', msg);
        }
    });

    $('#misDatosForm').on('submit', function (e) {
        e.preventDefault();

        var fechaStr = $('#fecha_nacimiento').val().trim();
        if (fechaStr) {
            var partes = fechaStr.split('/');
            if (partes.length !== 3) {
                showModal('Error de validación', 'El formato de la fecha debe ser DD/MM/AAAA.');
                return;
            }
            var fechaIntroducida = new Date(partes[2], partes[1] - 1, partes[0]);
            var hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (isNaN(fechaIntroducida.getTime())) {
                showModal('Error de validación', 'La fecha de nacimiento no es válida.');
                return;
            }
            if (fechaIntroducida >= hoy) {
                showModal('Error de validación', 'La fecha de nacimiento no puede ser hoy ni una fecha futura.');
                return;
            }
        }

        var datos = {
            nombre:           $('#nombre_campo').val().trim(),
            ciudad:           $('#ciudad').val().trim(),
            email:            $('#email').val().trim(),
            n_telefono:       $('#telefono').val().trim(),
            direccion:        $('#direccion').val().trim(),
            fecha_nacimiento: fechaStr,
            cod_postal:       $('#cod_postal').val().trim()
        };

        var nuevaPassword = $('#contrasena').val();
        if (nuevaPassword) datos.password = nuevaPassword;

        $.ajax({
            url:         API_BASE + '/perfil_consumidor/' + idUsuario,
            type:        'PUT',
            contentType: 'application/json',
            data:        JSON.stringify(datos),
            xhrFields:   { withCredentials: true },
            success: function (response) {
                showModal('Cambios guardados', response.message || 'Tus datos se han actualizado correctamente.', 'success');
                $('#contrasena').val('');
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error)
                    ? xhr.responseJSON.error
                    : 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
                showModal('Error al guardar', msg);
            }
        });
    });
});
