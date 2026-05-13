$(document).ready(function () {

    // -------------------------------------------------------
    // MODAL
    // -------------------------------------------------------
    const modal      = $('#errorModal');
    const errorList  = $('#errorList');
    const modalTitle = modal.find('h3');
    const closeBtn   = modal.find('.close-button');

    function showModal(title, content, type) {
        type = type || 'error';
        modalTitle.text(title);
        errorList.empty();
        modal.removeClass('modal-success modal-error').addClass('modal-' + type);
        modalTitle.css('color', type === 'success' ? '#155724' : '#a94442');
        errorList.append($('<li>').text(content));
        modal.css('display', 'flex');
    }

    function hideModal() {
        modal.css('display', 'none');
    }

    closeBtn.on('click', hideModal);
    $(window).on('click', function (e) {
        if (e.target === modal[0]) hideModal();
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
                totalPaginas = data.total_paginas || 1;
                paginaActual = data.pagina_actual || 1;

                var contenedor = $('#lista-pedidos');
                contenedor.empty();

                if (!data.pedidos || data.pedidos.length === 0) {
                    contenedor.append('<p class="sin-pedidos">No tienes pedidos registrados.</p>');
                } else {
                    $.each(data.pedidos, function (i, pedido) {
                        var fila = $('<div class="pedido-row">')
                            .append($('<span class="col-id">').text('#' + pedido.id_pedido))
                            .append($('<span class="col-comercio">').text(pedido.nombreComercio))
                            .append($('<span class="col-estado">').text(pedido.estado));
                        contenedor.append(fila);
                    });
                }

                // Actualizar estado de botones de paginación
                if (paginaActual <= 1) {
                    $('#btn-anterior').addClass('nav-disabled');
                } else {
                    $('#btn-anterior').removeClass('nav-disabled');
                }

                if (paginaActual >= totalPaginas) {
                    $('#btn-siguiente').addClass('nav-disabled');
                } else {
                    $('#btn-siguiente').removeClass('nav-disabled');
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

    // Carga inicial
    cargarPedidos(paginaActual);

    // -------------------------------------------------------
    // BOTONES DE PAGINACION
    // -------------------------------------------------------
    $('#btn-anterior').on('click', function () {
        if (paginaActual > 1) {
            cargarPedidos(paginaActual - 1);
        }
    });

    $('#btn-siguiente').on('click', function () {
        if (paginaActual < totalPaginas) {
            cargarPedidos(paginaActual + 1);
        }
    });

});
