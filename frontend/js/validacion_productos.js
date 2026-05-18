// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    var form = $('#altaProduForm');

    form.on('submit', function (e) {
        e.preventDefault();

        var isValid = true;
        var errors  = [];

        var nombre      = form.find('input[name="nombre"]');
        var tipo        = form.find('input[name="tipo"]');
        var descripcion = form.find('input[name="descripcion"]');
        var precio      = form.find('input[name="precio"]');
        var stock       = form.find('input[name="stock"]');
        var imagen      = form.find('input[name="imagen"]');

        function addError(input, campo, problema, ejemplo) {
            errors.push({ campo: campo, problema: problema, ejemplo: ejemplo });
            input.css('border', '2px solid red');
            isValid = false;
        }

        function limpiarEstilo(input) { input.css('border', '1px solid #ddd'); }

        $.each([nombre, tipo, descripcion, precio, stock], function (i, inp) { limpiarEstilo(inp); });

        if (!nombre.val().trim())      addError(nombre,      'Nombre',      'No puede estar vacío.',      'Ej: Alas de Onix');
        if (!tipo.val().trim())        addError(tipo,        'Tipo',        'No puede estar vacío.',      'Ej: Libro');
        if (!descripcion.val().trim()) addError(descripcion, 'Descripción', 'No puede estar vacío.',      'Breve detalle');

        var precioRegex = /^\d+(\.\d{1,2})?$/;
        if (!precio.val().trim()) {
            addError(precio, 'Precio', 'No puede estar vacío.', 'Ej: 19.99');
        } else if (!precioRegex.test(precio.val())) {
            addError(precio, 'Precio', 'Debe ser un número válido.', 'Ej: 25.50');
        }

        if (!stock.val().trim()) {
            addError(stock, 'Stock', 'No puede estar vacío.', 'Ej: 10');
        } else if (!/^\d+$/.test(stock.val())) {
            addError(stock, 'Stock', 'Debe ser un número entero.', 'Ej: 5');
        }

        var imagenFiles = imagen[0].files;
        if (imagenFiles.length === 0) {
            addError(imagen, 'Imagen', 'Debes seleccionar una imagen.', 'Formatos: jpg, png');
        } else {
            var allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(imagenFiles[0].type)) {
                addError(imagen, 'Imagen', 'Debe ser JPG o PNG.', 'Selecciona otra foto.');
            } else {
                limpiarEstilo(imagen);
            }
        }

        if (!isValid) {
            showModal('Errores en el Producto', errors);
            return;
        }

        var idComercio = localStorage.getItem('id_usuario_comercio');
        if (!idComercio) {
            showModal('Error de Sesión', 'No se detectó el ID del comercio. Por favor, cierra sesión y vuelve a entrar.');
            return;
        }

        var formData = new FormData(form[0]);
        formData.append('id_comercio', idComercio);
        var nombreGuardado = nombre.val();

        $.ajax({
            url:         API_BASE + '/registerProduct',
            type:        'POST',
            data:        formData,
            processData: false,
            contentType: false,
            success: function (data) {
                showModal('Guardado con éxito', 'Producto registrado: ' + nombreGuardado, 'success');
                form[0].reset();
                $.each([nombre, tipo, descripcion, precio, stock, imagen], function (i, inp) { limpiarEstilo(inp); });
            },
            error: function (xhr) {
                var err = (xhr.responseJSON) ? xhr.responseJSON : {};
                showModal('Error al Guardar', [{
                    campo:    'Servidor',
                    problema: err.message || 'Error desconocido',
                    ejemplo:  'Revisa la consola (F12) para más detalles.'
                }]);
            }
        });
    });
});
