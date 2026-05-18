// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    var paginaActual = 1;
    var porPagina    = 5;
    var totalPaginas = 1;

    var idUsuario = localStorage.getItem('id_usuario_comercio');
    if (!idUsuario) {
        window.location.href = 'inicio_sesion.html';
        return;
    }

    function cargarPedidos(pagina) {
        $.ajax({
            url:       API_BASE + '/pedidos_consumidor/' + idUsuario + '?pagina=' + pagina + '&por_pagina=' + porPagina,
            type:      'GET',
            xhrFields: { withCredentials: true },
            success: function (data) {
                totalPaginas = data.total_paginas || 1;
                paginaActual = data.pagina_actual || 1;

                var tbody = $('#lista-pedidos');
                tbody.empty();

                if (!data.pedidos || data.pedidos.length === 0) {
                    tbody.append('<tr><td colspan="3" class="sin-pedidos">No tienes pedidos registrados.</td></tr>');
                } else {
                    $.each(data.pedidos, function (i, pedido) {
                        var fila = $('<tr class="pedido-row">')
                            .append($('<td>').text('#' + pedido.id_pedido))
                            .append($('<td>').text(pedido.nombreComercio))
                            .append($('<td>').text(pedido.estado));
                        tbody.append(fila);
                        tbody.append('<tr class="spacer"><td colspan="3"></td></tr>');
                    });
                }

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
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error)
                    ? xhr.responseJSON.error
                    : 'No se pudieron cargar tus pedidos. Inténtalo de nuevo.';
                showModal('Error al cargar pedidos', msg);
            }
        });
    }

    cargarPedidos(paginaActual);

    $('#btn-anterior').on('click', function () {
        if (paginaActual > 1) cargarPedidos(paginaActual - 1);
    });

    $('#btn-siguiente').on('click', function () {
        if (paginaActual < totalPaginas) cargarPedidos(paginaActual + 1);
    });
});
