// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    $.ajaxSetup({
        headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
    });

    function cargarConsumidores() {
        $.ajax({
            url:    API_BASE + '/gestion_consumidores',
            method: 'GET',
            success: function (usuarios) {
                var contenedor = $('#lista-consumidores');
                contenedor.empty();

                if (usuarios.length === 0) {
                    contenedor.append('<p style="text-align:center; width:100%;">No hay consumidores registrados.</p>');
                    return;
                }

                usuarios.forEach(function (u) {
                    contenedor.append(
                        '<div class="comercio-item" id="fila-user-' + u.id_usuario + '">' +
                            '<div class="caja-blanca">' + u.nombre + '</div>' +
                            '<div class="botones-acciones">' +
                                '<button class="btn-eliminar" data-id="' + u.id_usuario + '" data-nombre="' + u.nombre + '" type="button">Eliminar</button>' +
                            '</div>' +
                        '</div>'
                    );
                });
            },
            error: function (xhr) {
                $('#lista-consumidores').html('<p>Error al cargar los datos.</p>');
            }
        });
    }

    $(document).on('click', '.btn-eliminar', function () {
        var userId = $(this).attr('data-id');
        var nombre = $(this).attr('data-nombre');

        if (!userId || userId === 'undefined') {
            showModal('Error', 'No se pudo obtener el ID del usuario.');
            return;
        }

        showModal(
            'Confirmar Eliminación',
            '¿Estás seguro de que deseas eliminar al consumidor "' + nombre + '"?',
            'confirm',
            {
                confirmText:  'Eliminar permanentemente',
                confirmColor: '#d9534f',
                onConfirm: function () {
                    var elementoAEliminar = $('#fila-user-' + userId);
                    $.ajax({
                        url:  API_BASE + '/gestion_consumidores/' + userId,
                        type: 'DELETE',
                        success: function (response) {
                            elementoAEliminar.fadeOut(400, function () { $(this).remove(); });
                            showModal('Eliminado', response.message || 'Usuario eliminado.', 'success');
                        },
                        error: function (xhr) {
                            var msg = (xhr.responseJSON && xhr.responseJSON.message)
                                ? xhr.responseJSON.message
                                : 'Error de comunicación.';
                            showModal('Error', msg);
                        }
                    });
                }
            }
        );
    });

    cargarConsumidores();
});
