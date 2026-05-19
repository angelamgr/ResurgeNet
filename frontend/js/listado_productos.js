// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    cargarProductosComercio();

    function cargarProductosComercio() {
        var id_comercio = localStorage.getItem('id_usuario');

        if (!id_comercio) {
            showModal('Error de sesión', 'No se detectó el ID del comercio. Por favor, inicia sesión de nuevo.');
            return;
        }

        $.ajax({
            url:      API_BASE + '/listado_productos_comercio/' + id_comercio,
            type:     'GET',
            dataType: 'json',
            success: function (response) {
                var contenedor = $('#contenedor-comercios');
                contenedor.empty();

                if (response.length === 0) {
                    contenedor.append('<p class="lista-vacia">No hay productos.</p>');
                    return;
                }

                $.each(response, function (i, producto) {
                    var fila =
                        '<div class="comercio-row" data-id="' + producto.id_producto + '">' +
                            '<span class="comercio-nombre">' + producto.nombre + '</span>' +
                            '<div class="acciones">' +
                                '<button class="btn-icon btn-editar" title="Editar"><span></span></button>' +
                            '</div>' +
                        '</div>';
                    contenedor.append(fila);
                });
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error)
                    ? xhr.responseJSON.error
                    : 'Error al cargar los productos.';
                showModal('Error', msg);
            }
        });
    }

    $(document).on('click', '.btn-editar:not(:disabled)', function () {
        var id = $(this).closest('.comercio-row').data('id');
        window.location.href = 'actualizar_producto.html?id=' + id;
    });
});
