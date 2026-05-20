// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    var params      = new URLSearchParams(window.location.search);
    var id_producto = params.get('id');

    if (!id_producto) {
        showModal(
            'Error de navegaci\u00f3n',
            'No se ha podido identificar el producto. Vuelve al listado y sel\u00e9ccionalo de nuevo.'
        );
        return;
    }

    $.ajax({
        url:      API_BASE + '/cargar_producto/' + id_producto,
        type:     'GET',
        dataType: 'json',
        success: function (producto) {
            if (!producto) return;
            $('#nombre_prod').val(producto.nombre);
            $('#tipo').val(producto.tipo);
            $('#descripcion').val(producto.descripcion);
            $('#precio').val(producto.precio);
            $('#stock').val(producto.stock);
        },
        error: function (xhr) {
            var msg = (xhr.responseJSON && xhr.responseJSON.message)
                ? xhr.responseJSON.message
                : 'No se pudieron cargar los datos del producto. Int\u00e9ntalo de nuevo.';
            showModal('Error al cargar producto', msg);
        }
    });
});
