// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

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

    function cargarComerciosEspera(pagina) {
        $.ajax({
            url:    API_BASE + '/gestion_comercios_espera?pagina=' + pagina + '&por_pagina=' + porPagina,
            method: 'GET',
            success: function (data) {
                var comercios = Array.isArray(data) ? data : (data.comercios || []);
                totalPaginas  = data.total_paginas  || 1;
                paginaActual  = data.pagina_actual   || pagina;

                var contenedor = $('.grid-comercios');
                contenedor.empty();

                if (comercios.length === 0) {
                    contenedor.append('<p class="lista-vacia">No hay comercios pendientes de validación.</p>');
                    actualizarBotones();
                    return;
                }

                comercios.forEach(function (c) {
                    contenedor.append(
                        '<div class="comercio-item" id="fila-comercio-' + c.id_solicitud + '">' +
                            '<div class="caja-blanca">' + c.nombreComercio + '</div>' +
                            '<div class="botones-acciones">' +
                                '<button class="btn-alta" data-id="' + c.id_solicitud + '" data-nombre="' + c.nombreComercio + '" type="button">Dar de alta</button>' +
                            '</div>' +
                        '</div>'
                    );
                });

                actualizarBotones();
            },
            error: function () {
                $('.grid-comercios').html('<p class="lista-vacia">Error al conectar con el servidor.</p>');
            }
        });
    }

    $(document).on('click', '.btn-alta', function () {
        var comercioId   = $(this).attr('data-id');
        var nombre       = $(this).attr('data-nombre');
        var elementoHTML = $('#fila-comercio-' + comercioId);

        showModal(
            'Confirmar Alta',
            '¿Deseas validar el comercio "' + nombre + '" y cambiar su estado a Activo?',
            'confirm',
            {
                confirmText:  'Validar y Activar',
                confirmColor: '#28a745',
                onConfirm: function () {
                    $.ajax({
                        url:  API_BASE + '/activar_comercio/' + comercioId,
                        type: 'PUT',
                        success: function (response) {
                            showModal('Éxito', 'Comercio activado correctamente', 'success');
                            elementoHTML.fadeOut(400, function () {
                                $(this).remove();
                                // Recarga la página actual por si quedan elementos
                                cargarComerciosEspera(paginaActual);
                            });
                        },
                        error: function (xhr) {
                            var msg = (xhr.responseJSON && xhr.responseJSON.error)
                                ? xhr.responseJSON.error
                                : 'No se pudo actualizar el estado del comercio.';
                            showModal('Error', msg);
                        }
                    });
                }
            }
        );
    });

    $('#btn-anterior').on('click', function () {
        if (paginaActual > 1) cargarComerciosEspera(paginaActual - 1);
    });

    $('#btn-siguiente').on('click', function () {
        if (paginaActual < totalPaginas) cargarComerciosEspera(paginaActual + 1);
    });

    cargarComerciosEspera(paginaActual);
});
