// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    var form = $('#workForm');

    form.on('submit', function (e) {
        e.preventDefault();

        var isValid = true;
        var errors  = [];

        var nombrePers = form.find('[name="nombre_personal"]');
        var nombreCom  = form.find('[name="nombre_comercio"]');
        var telefono   = form.find('[name="telefono"]');
        var email      = form.find('[name="email"]');
        var motivo     = form.find('[name="motivo"]');
        var ciudad     = form.find('[name="ciudad"]');
        var web        = form.find('[name="web_operativa"]');

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

        campoVacio(nombrePers, 'Nombre personal',    'Ej: Juan Pérez');
        campoVacio(nombreCom,  'Nombre comercio',    'Ej: Panadería El Sol');
        campoVacio(telefono,   'Número de teléfono', 'Ej: 600112233');
        campoVacio(email,      'Email',              'Ej: comercio@ejemplo.com');
        campoVacio(motivo,     'Motivo',             'Explica brevemente por qué quieres unirte.');
        campoVacio(ciudad,     'Ciudad',             'Ej: Granada');
        campoVacio(web,        '¿Web operativa?',    'Selecciona Sí o No');

        if (email.val().trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.val())) {
            addError(email, 'Email', 'Formato de correo no válido.', 'Ej: nombre@dominio.com');
        }

        if (telefono.val().trim() !== '' && !/^\d{9}$/.test(telefono.val())) {
            addError(telefono, 'Teléfono', 'Debe contener exactamente 9 números.', 'Ej: 611223344');
        }

        if (!isValid) {
            showModal('Errores de Validación', errors);
            return;
        }

        var submitBtn = form.find('.btn-submit');
        submitBtn.prop('disabled', true).text('Enviando...');

        var data = {};
        form.serializeArray().forEach(function (field) { data[field.name] = field.value; });

        $.ajax({
            url:         API_BASE + '/enviar_solicitud',
            type:        'POST',
            contentType: 'application/json',
            headers:     { 'X-Requested-With': 'XMLHttpRequest' },
            data:        JSON.stringify(data),
            success: function (res) {
                showModal('Solicitud Enviada', null, 'success');
                form[0].reset();
                setTimeout(function () { window.location.href = 'index.html'; }, 4500);
            },
            error: function (xhr) {
                var err = (xhr.responseJSON) ? xhr.responseJSON : {};
                showModal('Error en el Envío', [{
                    campo:    'Servidor',
                    problema: 'No se pudo procesar la solicitud.',
                    ejemplo:  err.message || 'Error de conexión'
                }]);
            },
            complete: function () {
                submitBtn.prop('disabled', false).text('Enviar formulario');
            }
        });
    });
});
