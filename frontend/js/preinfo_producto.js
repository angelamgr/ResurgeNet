$(document).ready(function () {
    const params = new URLSearchParams(window.location.search);
    const id_producto = params.get('id');

    if (!id_producto) {
        console.error("No se encontró el id del producto en la URL");
        return;
    }

    $.ajax({
        url: `http://localhost:8080/api/cargar_producto/${id_producto}`,
        type: 'GET',
        dataType: 'json',
        success: function(producto) {
            if (!producto) return;
            console.log("Producto cargado:", producto);
            $('#nombre_prod').val(producto.nombre);
            $('#tipo').val(producto.tipo);
            $('#descripcion').val(producto.descripcion);
            $('#precio').val(producto.precio);
            $('#stock').val(producto.stock);
        },
        error: function(err) {
            console.error("Error al cargar el producto:", err);
        }
    });
});