// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    var urlParams   = new URLSearchParams(window.location.search);
    var id_producto = urlParams.get('id');

    $('#altaProduForm').on('submit', function (e) {
        e.preventDefault();

        var formData = new FormData();
        formData.append('nombre',      $('#nombre_prod').val());
        formData.append('tipo',        $('#tipo').val());
        formData.append('descripcion', $('#descripcion').val());
        formData.append('precio',      $('#precio').val());
        formData.append('stock',       $('#stock').val());

        var fileInput = $('#imagen')[0].files[0];
        if (fileInput) formData.append('imagen', fileInput);

        formData.append('_method', 'PUT');

        $.ajax({
            url:         API_BASE + '/actualizar_producto/' + id_producto,
            type:        'POST',
            data:        formData,
            processData: false,
            contentType: false,
            success: function (response) {
                showModal('Éxito', 'Producto actualizado correctamente. Redirigiendo...', 'success');
                setTimeout(function () {
                    window.location.href = 'listado_productos_comercio.html';
                }, 2000);
            },
            error: function (err) {
                var msg = (err.responseJSON && err.responseJSON.message)
                    ? err.responseJSON.message
                    : 'Error al actualizar el producto';
                showModal('Error de Actualización', msg);
            }
        });
    });
});
