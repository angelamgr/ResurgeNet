$(document).ready(function () {

    // -------------------------------------------------------
    // MODAL
    // -------------------------------------------------------
    var modal      = $('#errorModal');
    var errorList  = $('#errorList');
    var modalTitle = modal.find('#modalTitle');
    var closeBtn   = modal.find('.close-button');

    function showModal(title, content, type) {
        type = type || 'error';
        modalTitle.text(title);
        errorList.empty();
        modal.removeClass('modal-success modal-error').addClass('modal-' + type);
        modalTitle.css('color', type === 'success' ? '#155724' : '#a94442');
        errorList.append($('<li>').text(content));
        modal.css('display', 'flex');
        // Mueve el foco al botón de cerrar para que el lector de pantalla lo anuncie
        closeBtn.focus();
    }

    function hideModal() {
        modal.css('display', 'none');
        modal.removeClass('modal-success modal-error');
    }

    closeBtn.on('click', hideModal);
    $(window).on('click', function (e) {
        if (e.target === modal[0]) hideModal();
    });
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && modal.css('display') !== 'none') hideModal();
    });

    // -------------------------------------------------------
    // PAGINACION
    // -------------------------------------------------------
    var paginaActual = 1;
    var porPagina    = 5;
    var totalPaginas = 1;

    // -------------------------------------------------------
    // COMPROBACION DE SESION
    // -------------------------------------------------------
    var idUsuario = localStorage.getItem('id_usuario_comercio');
    if (!idUsuario) {
        window.location.href = 'inicio_sesion.html';
        return;
    }

    // -------------------------------------------------------
    // CARGA DE PEDIDOS
    // -------------------------------------------------------
    function cargarPedidos(pagina) {
        $.ajax({
            url: API_BASE + '/pedidos_consumidor/' + idUsuario + '?pagina=' + pagina + '&por_pagina=' + porPagina,
            type: 'GET',
            xhrFields: { withCredentials: true },
            success: function (data) {
                totalPaginas  = data.total_paginas || 1;
                paginaActual  = data.pagina_actual || 1;

                var tbody = $('#lista-pedidos');
                tbody.empty();

                if (!data.pedidos || data.pedidos.length === 0) {
                    tbody.append('<tr><td colspan="3" class="sin-pedidos">No tienes pedidos registrados.</td></tr>');
                } else {
                    $.each(data.pedidos, function (i, pedido) {
                        // Fila con datos
                        var fila = $('<tr class="pedido-row">')
                            .append($('<td>').text('#' + pedido.id_pedido))
                            .append($('<td>').text(pedido.nombreComercio))
                            .append($('<td>').text(pedido.estado));
                        tbody.append(fila);
                        // Fila separadora visual
                        tbody.append('<tr class="spacer"><td colspan="3"></td></tr>');
                    });
                }

                // Estado de botones de paginación
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
                showModal('Error al cargar pedidos', msg, 'error');
            }
        });
    }

    cargarPedidos(paginaActual);

    // -------------------------------------------------------
    // BOTONES DE PAGINACION
    // -------------------------------------------------------
    $('#btn-anterior').on('click', function () {
        if (paginaActual > 1) cargarPedidos(paginaActual - 1);
    });

    $('#btn-siguiente').on('click', function () {
        if (paginaActual < totalPaginas) cargarPedidos(paginaActual + 1);
    });

});
