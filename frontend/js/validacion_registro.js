// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    var form = $('#loginForm');

    form.on('submit', function (e) {
        e.preventDefault();

        var isValid = true;
        var errors  = [];

        var nombre    = form.find('input[name="nombre"]');
        var email     = form.find('input[name="email"]');
        var fecha     = form.find('input[name="fecha_nacimiento"]');
        var ciudad    = form.find('input[name="ciudad"]');
        var codPostal = form.find('input[name="cod_postal"]');
        var direccion = form.find('input[name="direccion"]');
        var telefono  = form.find('input[name="telefono"]');
        var userName  = form.find('input[name="username"]');
        var password  = form.find('input[name="password"]');

        function addError(input, campo, problema, ejemplo) {
            errors.push({ campo: campo, problema: problema, ejemplo: ejemplo });
            inputError(input);
            isValid = false;
        }

        function campoVacio(input, campo, ejemplo) {
            if (!input.length || input.val().trim() === '') {
                addError(input, campo, 'No puede estar vacío.', ejemplo);
            } else {
                inputOk(input);
            }
        }

        campoVacio(nombre,    'Nombre',             'Ej: Juan Pérez');
        campoVacio(email,     'Email',              'Ej: tu.nombre@dominio.com');
        campoVacio(fecha,     'Fecha de nacimiento','Ej: 01/01/1990');
        campoVacio(ciudad,    'Ciudad',             'Ej: Madrid');
        campoVacio(codPostal, 'Código postal',      'Ej: 28001');
        campoVacio(direccion, 'Dirección',          'Ej: C/ Sol, 15');
        campoVacio(telefono,  'Número de teléfono', 'Ej: 600112233');
        campoVacio(userName,  'Nombre de usuario',  'Ej: juanperez88');
        campoVacio(password,  'Contraseña',         'Mínimo 6 caracteres y un número');

        var fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (fecha.val().trim() !== '') {
            if (!fechaRegex.test(fecha.val())) {
                addError(fecha, 'Fecha de nacimiento', 'El formato debe ser DD/MM/YYYY.', 'Ej: 15/05/1995');
            } else {
                var parts   = fecha.val().split('/');
                var dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
                if (
                    dateObj.getFullYear() !== parseInt(parts[2], 10) ||
                    dateObj.getMonth() + 1 !== parseInt(parts[1], 10) ||
                    dateObj.getDate()      !== parseInt(parts[0], 10)
                ) {
                    addError(fecha, 'Fecha de nacimiento', 'La fecha introducida no es válida.', 'Ej: 15/05/1995');
                } else if (dateObj > new Date()) {
                    addError(fecha, 'Fecha de nacimiento', 'La fecha de nacimiento no puede ser futura.', 'Ej: 15/05/1995');
                }
            }
        }

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
        if (email.val().trim() !== '' && !emailRegex.test(email.val())) {
            addError(email, 'Email', 'Formato de correo no válido.', 'Ej: tu.nombre@gmail.com');
        }

        if (codPostal.val().trim() !== '' && !/^\d{5}$/.test(codPostal.val())) {
            addError(codPostal, 'Código postal', 'Debe contener 5 números.', 'Ej: 28001');
        }

        if (telefono.val().trim() !== '' && !/^\d{9}$/.test(telefono.val())) {
            addError(telefono, 'Número de teléfono', 'Debe contener 9 dígitos.', 'Ej: 600112233');
        }

        if (password.val().trim() !== '' && (password.val().length < 6 || !/\d/.test(password.val()))) {
            addError(password, 'Contraseña', 'Debe tener al menos 6 caracteres y contener un número.', "Ej: 'miClave123'");
        }

        if (!isValid) {
            showModal('Errores de Validación', errors);
            return;
        }

        var data = {};
        form.serializeArray().forEach(function (field) { data[field.name] = field.value; });

        $.ajax({
            url:         API_BASE + '/registerConsumer',
            type:        'POST',
            contentType: 'application/json',
            data:        JSON.stringify(data),
            success: function (response) {
                showModal('Registro Exitoso', null, 'success');
                setTimeout(function () {
                    window.location.href = response.redirect || 'inicio_sesion.html';
                }, 2000);
            },
            error: function (xhr) {
                var err    = (xhr.responseJSON) ? xhr.responseJSON : {};
                var detail = err.db_error_detail || err.message || 'Error desconocido al intentar registrar.';
                showModal('Error en el Registro', [{ campo: 'Servidor', problema: 'Fallo en la operación.', ejemplo: detail }]);
            }
        });
    });
});
