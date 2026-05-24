// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    var paginaActual = 1;
    var porPagina    = 3; // <-- ELEMENTOS POR PAGINA
    var totalPaginas = 1;

    var id_comercio = localStorage.getItem('id_usuario_comercio');
    if (!id_comercio) {
        showModal('Error de sesión', 'No se detectó el ID del comercio. Por favor, inicia sesión de nuevo.');
        return;
    }

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

    function cargarProductosComercio(pagina) {
        $.ajax({
            url:      API_BASE + '/listado_productos_comercio/' + id_comercio + '?pagina=' + pagina + '&por_pagina=' + porPagina,
            type:     'GET',
            dataType: 'json',
            success: function (data) {
                var productos = Array.isArray(data) ? data : (data.productos || []);
                totalPaginas  = data.total_paginas  || 1;
                paginaActual  = data.pagina_actual   || pagina;

                var contenedor = $('#contenedor-comercios');
                contenedor.empty();

                if (productos.length === 0) {
                    contenedor.append('<p class="lista-vacia">No hay productos.</p>');
                    actualizarBotones();
                    return;
                }

                $.each(productos, function (i, producto) {
                    contenedor.append(
                        '<div class="comercio-row" data-id="' + producto.id_producto + '">' +
                            '<span class="comercio-nombre">' + producto.nombre + '</span>' +
                            '<div class="acciones">' +
                                '<button class="btn-icon btn-editar" title="Editar"><span></span></button>' +
                            '</div>' +
                        '</div>'
                    );
                });

                actualizarBotones();
            },
            error: function (xhr) {
                showModal('Error', (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : 'Error al cargar los productos.');
            }
        });
    }

    $(document).on('click', '.btn-editar:not(:disabled)', function () {
        window.location.href = 'actualizar_producto.html?id=' + $(this).closest('.comercio-row').data('id');
    });

    $('#btn-anterior').on('click', function () {
        if (paginaActual > 1) cargarProductosComercio(paginaActual - 1);
    });
    $('#btn-siguiente').on('click', function () {
        if (paginaActual < totalPaginas) cargarProductosComercio(paginaActual + 1);
    });

    cargarProductosComercio(paginaActual);
});
