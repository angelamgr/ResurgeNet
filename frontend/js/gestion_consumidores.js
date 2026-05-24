// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    $.ajaxSetup({
        headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
    });

    var paginaActual = 1;
    var porPagina    = 5;
    var totalPaginas = 1;

    function actualizarBotones() {
        if (paginaActual <= 1) {
            $('#btn-anterior').addClass('nav-disabled').attr('disabled', true);
        } else {
            $('#btn-anterior').removeClass('nav-disabled').removeAttr('disabled');
        }
        if (paginaActual >= totalPaginas) {
            $('#btn-siguiente').addClass('nav-disabled').attr('disabled', true);
        } else {
            $('#btn-siguiente').removeClass('nav-disabled').removeAttr('disabled');
        }
    }

    function cargarConsumidores(pagina) {
        $.ajax({
            url:    API_BASE + '/gestion_consumidores?pagina=' + pagina + '&por_pagina=' + porPagina,
            method: 'GET',
            success: function (data) {
                var usuarios     = Array.isArray(data) ? data : (data.usuarios || []);
                totalPaginas     = data.total_paginas  || 1;
                paginaActual     = data.pagina_actual   || pagina;

                var contenedor = $('#lista-consumidores');
                contenedor.empty();

                if (usuarios.length === 0) {
                    contenedor.append('<p class="lista-vacia">No hay consumidores registrados.</p>');
                    actualizarBotones();
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

                actualizarBotones();
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error)
                    ? xhr.responseJSON.error
                    : 'Error al cargar los datos.';
                showModal('Error', msg);
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
                            // Recarga la página actual para actualizar conteo
                            cargarConsumidores(paginaActual);
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

    $('#btn-anterior').on('click', function () {
        if (paginaActual > 1) cargarConsumidores(paginaActual - 1);
    });

    $('#btn-siguiente').on('click', function () {
        if (paginaActual < totalPaginas) cargarConsumidores(paginaActual + 1);
    });

    cargarConsumidores(paginaActual);
});
