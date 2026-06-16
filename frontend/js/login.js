// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    // --- SEGURIDAD: limpiar el formulario al cargar la pagina ---
    // Evita que el navegador muestre credenciales de una sesion anterior
    // cuando el usuario pulsa "atras" despues de cerrar sesion.
    // Se limpia aunque el navegador haya restaurado la pagina desde bfcache.
    $('input[name="usuario"]').val('');
    $('input[name="password"]').val('');

    // --- SEGURIDAD: redirigir si ya hay sesion activa ---
    // Si el usuario llega a la pagina de login pero ya tiene sesion,
    // se le redirige directamente a su dashboard sin mostrar el formulario.
    $.ajax({
        url:       API_BASE + '/checkUserSession',
        type:      'GET',
        xhrFields: { withCredentials: true },
        success: function (response) {
            if (response.active) {
                // Hay sesion activa: no mostrar el formulario de login
                // El backend redirigira al dashboard correcto segun el rol
                // pero como no tenemos esa info aqui, volvemos al index
                // que tampoco tiene contenido protegido
                window.location.replace('index.html');
            }
        }
        // Si falla la comprobacion, se muestra el formulario normalmente
    });

    $('#loginForm').submit(function (e) {
        e.preventDefault();

        var isValid = true;
        var errors  = [];

        var usuarioInput  = $('input[name="usuario"]');
        var passwordInput = $('input[name="password"]');

        var usuario  = usuarioInput.val().trim();
        var password = passwordInput.val().trim();

        inputOk(usuarioInput);
        inputOk(passwordInput);

        if (usuario === '') {
            errors.push({ campo: 'Nombre de usuario', problema: 'El campo no puede estar vacío.' });
            inputError(usuarioInput);
            isValid = false;
        }

        if (password === '') {
            errors.push({ campo: 'Contraseña', problema: 'El campo no puede estar vacío.' });
            inputError(passwordInput);
            isValid = false;
        }

        if (password !== '' && password.length < 6) {
            errors.push({ campo: 'Contraseña', problema: 'Debe tener al menos 6 caracteres.' });
            inputError(passwordInput);
            isValid = false;
        }

        if (!isValid) {
            showModal('Errores de Validación de Datos', errors);
            return;
        }

        $.ajax({
            url:        API_BASE + '/loginUser',
            type:       'POST',
            xhrFields:  { withCredentials: true },
            data: {
                usuario:  usuario,
                password: password
            },
            success: function (response) {
                if (response.id_usuario) {
                    localStorage.setItem('id_usuario_comercio', response.id_usuario);
                }
                showModal('Éxito', response.message, 'success');
                setTimeout(function () {
                    window.location.href = response.redirect;
                }, 1500);
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.message)
                    ? xhr.responseJSON.message
                    : 'Error de conexión con el servidor.';
                showModal('Error al Iniciar Sesión', msg);
                passwordInput.val('');
            }
        });
    });
});
