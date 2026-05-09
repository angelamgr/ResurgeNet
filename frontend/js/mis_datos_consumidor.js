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
        // Si no hay sesión redirigimos al login
        window.location.href = 'inicio_sesion.html';
        return;
    }

    $.ajax({
        url: API_BASE + '/perfil_consumidor/' + idUsuario,
        type: 'GET',
        xhrFields: { withCredentials: true },
        success: function (data) {
            // Rellenamos cada input con su campo correspondiente de la BD
            $('#nombre_campo').val(data.nombre      || '');
            $('#ciudad').val(data.ciudad            || '');
            $('#email').val(data.email              || '');
            $('#telefono').val(data.n_telefono      || '');
            $('#direccion').val(data.direccion      || '');
            $('#fecha_nacimiento').val(data.fecha_nac || '');
            $('#cod_postal').val(data.cod_postal    || '');
            // La contraseña nunca se precarga por seguridad
        },
        error: function (xhr) {
            var msg = (xhr.responseJSON && xhr.responseJSON.error)
                ? xhr.responseJSON.error
                : 'No se pudieron cargar tus datos. Inténtalo de nuevo.';
            showModal('Error al cargar datos', msg, 'error');
        }
    });

});
