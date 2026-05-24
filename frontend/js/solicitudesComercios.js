// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    cargarSolicitudes(1);
});

var paginaActual = 1;
var porPagina    = 3; // <-- ELEMENTOS POR PAGINA
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

function cargarSolicitudes(pagina) {
    $.ajax({
        url:      API_BASE + '/solicitudes_comercios?pagina=' + pagina + '&por_pagina=' + porPagina,
        type:     'GET',
        dataType: 'json',
        success: function (data) {
            var solicitudes = Array.isArray(data) ? data : (data.solicitudes || []);
            totalPaginas    = data.total_paginas  || 1;
            paginaActual    = data.pagina_actual   || pagina;

            var container = $('.comercios-container');
            container.empty();

            if (solicitudes.length === 0) {
                container.append('<p class="lista-vacia">No hay solicitudes pendientes.</p>');
                actualizarBotones();
                return;
            }

            $.each(solicitudes, function (i, solicitud) {
                var row = $('<div class="comercio-row">')
                    .append($('<span class="comercio-nombre">').text(solicitud.nombreComercio))
                    .append($('<span class="motivo-solicitud-texto">').text(solicitud.motivoSolicitud))
                    .append(
                        $('<div class="acciones">')
                            .append($('<button class="btn-icon btn-aceptar"><span></span></button>').data('id', solicitud.id_solicitud).data('nombre', solicitud.nombreComercio))
                            .append($('<button class="btn-icon btn-denegar"><span></span></button>').data('id', solicitud.id_solicitud).data('nombre', solicitud.nombreComercio))
                    );
                container.append(row);
            });

            actualizarBotones();
        },
        error: function () { showModal('Error', 'No se pudieron cargar las solicitudes'); }
    });
}

$(document).on('click', '.btn-denegar', function () {
    var id = $(this).data('id'), nombre = $(this).data('nombre'), fila = $(this).closest('.comercio-row');
    showModal('Confirmar Denegación', '¿Seguro que quieres denegar la solicitud de "' + nombre + '"?', 'confirm', {
        confirmText: 'Denegar solicitud', confirmColor: '#d9534f',
        onConfirm: function () {
            $.ajax({
                url: API_BASE + '/denegar_solicitud/' + id, type: 'PUT', contentType: 'application/json',
                success: function (data) { showModal('Éxito', data.message || 'Solicitud denegada', 'success'); fila.remove(); cargarSolicitudes(paginaActual); },
                error: function (xhr) { showModal('Error', (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : 'No se pudo denegar'); }
            });
        }
    });
});

$(document).on('click', '.btn-aceptar', function () {
    var id = $(this).data('id'), nombre = $(this).data('nombre'), fila = $(this).closest('.comercio-row');
    showModal('Confirmar Aceptación', '¿Seguro que quieres aceptar la solicitud de "' + nombre + '"?', 'confirm', {
        confirmText: 'Aceptar solicitud', confirmColor: '#28a745',
        onConfirm: function () {
            $.ajax({
                url: API_BASE + '/aceptar_solicitud/' + id, type: 'PUT', contentType: 'application/json',
                success: function (data) { showModal('Éxito', data.message || 'Solicitud aceptada', 'success'); fila.remove(); cargarSolicitudes(paginaActual); },
                error: function (xhr) { showModal('Error', (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : 'No se pudo aceptar'); }
            });
        }
    });
});

$(document).on('click', '#btn-anterior', function () { if (paginaActual > 1) cargarSolicitudes(paginaActual - 1); });
$(document).on('click', '#btn-siguiente', function () { if (paginaActual < totalPaginas) cargarSolicitudes(paginaActual + 1); });
