$(document).ready(function () {

    // -------------------------------------------------------
    // MODAL: funciones de mostrar y ocultar
    // -------------------------------------------------------
    const modal      = $('#errorModal');
    const errorList  = $('#errorList');
    const modalTitle = modal.find('h3');
    const closeBtn   = modal.find('.close-button');

    function showModal(title, content, type = 'error') {
        modalTitle.text(title);
        errorList.empty();
        modal.removeClass('modal-success modal-error').addClass('modal-' + type);
        modalTitle.css('color', type === 'success' ? '#155724' : '#a94442');

        if (Array.isArray(content)) {
            content.forEach(function (err) {
                var li = $('<li>').html('<strong>Campo:</strong> ' + err.campo + '<br><strong>Problema:</strong> ' + err.problema);
                errorList.append(li);
            });
        } else {
            errorList.append($('<li>').text(content));
        }
        modal.css('display', 'flex');
    }

    function hideModal() {
        modal.css('display', 'none');
        modal.removeClass('modal-success modal-error');
        modalTitle.css('color', '#333');
    }

    closeBtn.on('click', hideModal);
    $(window).on('click', function (e) {
        if (e.target === modal[0]) hideModal();
    });

    // -------------------------------------------------------
    // CARGA DE DATOS: precargamos el formulario con los datos
    // del consumidor logueado leyendo su id del localStorage
    // -------------------------------------------------------
    const idUsuario = localStorage.getItem('id_usuario_comercio');

    if (!idUsuario) {
        window.location.href = 'inicio_sesion.html';
        return;
    }

    $.ajax({
        url: API_BASE + '/perfil_consumidor/' + idUsuario,
        type: 'GET',
        xhrFields: { withCredentials: true },
        success: function (data) {
            $('#nombre_campo').val(data.nombre       || '');
            $('#ciudad').val(data.ciudad             || '');
            $('#email').val(data.email               || '');
            $('#telefono').val(data.n_telefono       || '');
            $('#direccion').val(data.direccion       || '');
            $('#fecha_nacimiento').val(data.fecha_nac || '');
            $('#cod_postal').val(data.cod_postal     || '');
            // La contraseña nunca se precarga por seguridad
        },
        error: function (xhr) {
            var msg = (xhr.responseJSON && xhr.responseJSON.error)
                ? xhr.responseJSON.error
                : 'No se pudieron cargar tus datos. Inténtalo de nuevo.';
            showModal('Error al cargar datos', msg, 'error');
        }
    });

    // -------------------------------------------------------
    // GUARDAR CAMBIOS: envía los datos modificados al backend
    // -------------------------------------------------------
    $('#misDatosForm').on('submit', function (e) {
        e.preventDefault();

        // --- Validación de fecha en el cliente ---
        const fechaStr = $('#fecha_nacimiento').val().trim();
        if (fechaStr) {
            // Esperamos formato DD/MM/AAAA
            const partes = fechaStr.split('/');
            if (partes.length !== 3) {
                showModal('Error de validación', 'El formato de la fecha debe ser DD/MM/AAAA.', 'error');
                return;
            }
            const fechaIntroducida = new Date(partes[2], partes[1] - 1, partes[0]);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (isNaN(fechaIntroducida.getTime())) {
                showModal('Error de validación', 'La fecha de nacimiento no es válida.', 'error');
                return;
            }
            if (fechaIntroducida >= hoy) {
                showModal('Error de validación', 'La fecha de nacimiento no puede ser hoy ni una fecha futura.', 'error');
                return;
            }
        }

        // --- Construimos el objeto con los datos del formulario ---
        const datos = {
            nombre:           $('#nombre_campo').val().trim(),
            ciudad:           $('#ciudad').val().trim(),
            email:            $('#email').val().trim(),
            n_telefono:       $('#telefono').val().trim(),
            direccion:        $('#direccion').val().trim(),
            fecha_nacimiento: fechaStr,
            cod_postal:       $('#cod_postal').val().trim(),
        };

        // Solo incluimos la contraseña si el campo no está vacío
        const nuevaPassword = $('#contrasena').val();
        if (nuevaPassword) {
            datos.password = nuevaPassword;
        }

        // --- Llamada al backend ---
        $.ajax({
            url: API_BASE + '/perfil_consumidor/' + idUsuario,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(datos),
            xhrFields: { withCredentials: true },
            success: function (response) {
                showModal('Cambios guardados', response.message || 'Tus datos se han actualizado correctamente.', 'success');
                // Limpiamos el campo contraseña tras guardar
                $('#contrasena').val('');
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error)
                    ? xhr.responseJSON.error
                    : 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
                showModal('Error al guardar', msg, 'error');
            }
        });
    });

});
