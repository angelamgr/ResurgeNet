// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    cargarSolicitudes();
});

function cargarSolicitudes() {
    $.ajax({
        url:      API_BASE + '/solicitudes_comercios',
        type:     'GET',
        dataType: 'json',
        success: function (data) {
            var container = $('.comercios-container');
            container.empty();

            if (data.length === 0) {
                container.append('<p class="lista-vacia">No hay solicitudes pendientes.</p>');
                return;
            }

            $.each(data, function (i, solicitud) {
                var row = $('<div class="comercio-row">')
                    .append($('<span class="comercio-nombre">').text(solicitud.nombreComercio))
                    .append($('<span class="motivo-solicitud-texto">').text(solicitud.motivoSolicitud))
                    .append(
                        $('<div class="acciones">')
                            .append(
                                $('<button class="btn-icon btn-aceptar"><span></span></button>')
                                    .data('id',     solicitud.id_solicitud)
                                    .data('nombre', solicitud.nombreComercio)
                            )
                            .append(
                                $('<button class="btn-icon btn-denegar"><span></span></button>')
                                    .data('id',     solicitud.id_solicitud)
                                    .data('nombre', solicitud.nombreComercio)
                            )
                    );
                container.append(row);
            });
        },
        error: function () {
            showModal('Error', 'No se pudieron cargar las solicitudes');
        }
    });
}

$(document).on('click', '.btn-denegar', function () {
    var id     = $(this).data('id');
    var nombre = $(this).data('nombre');
    var fila   = $(this).closest('.comercio-row');

    showModal(
        'Confirmar Denegación',
        '¿Seguro que quieres denegar la solicitud de "' + nombre + '"?',
        'confirm',
        {
            confirmText:  'Denegar solicitud',
            confirmColor: '#d9534f',
            onConfirm: function () {
                $.ajax({
                    url:         API_BASE + '/denegar_solicitud/' + id,
                    type:        'PUT',
                    contentType: 'application/json',
                    success: function (data) {
                        showModal('Éxito', data.message || 'Solicitud denegada', 'success');
                        fila.remove();
                    },
                    error: function (xhr) {
                        var msg = (xhr.responseJSON && xhr.responseJSON.error)
                            ? xhr.responseJSON.error
                            : 'No se pudo denegar';
                        showModal('Error', msg);
                    }
                });
            }
        }
    );
});

$(document).on('click', '.btn-aceptar', function () {
    var id     = $(this).data('id');
    var nombre = $(this).data('nombre');
    var fila   = $(this).closest('.comercio-row');

    showModal(
        'Confirmar Aceptación',
        '¿Seguro que quieres aceptar la solicitud de "' + nombre + '"?',
        'confirm',
        {
            confirmText:  'Aceptar solicitud',
            confirmColor: '#28a745',
            onConfirm: function () {
                $.ajax({
                    url:         API_BASE + '/aceptar_solicitud/' + id,
                    type:        'PUT',
                    contentType: 'application/json',
                    success: function (data) {
                        showModal('Éxito', data.message || 'Solicitud aceptada', 'success');
                        fila.remove();
                    },
                    error: function (xhr) {
                        var msg = (xhr.responseJSON && xhr.responseJSON.error)
                            ? xhr.responseJSON.error
                            : 'No se pudo aceptar';
                        showModal('Error', msg);
                    }
                });
            }
        }
    );
});
