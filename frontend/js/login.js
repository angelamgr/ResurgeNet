// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    $('#loginForm').submit(function (e) {
        e.preventDefault();

        var isValid = true;
        var errors  = [];

        var usuarioInput  = $('input[name="usuario"]');
        var passwordInput = $('input[name="password"]');

        var usuario  = usuarioInput.val().trim();
        var password = passwordInput.val().trim();

        usuarioInput.css('border',  '1px solid #ddd');
        passwordInput.css('border', '1px solid #ddd');

        if (usuario === '') {
            errors.push({ campo: 'Nombre de usuario', problema: 'El campo no puede estar vacío.' });
            usuarioInput.css('border', '2px solid red');
            isValid = false;
        }

        if (password === '') {
            errors.push({ campo: 'Contraseña', problema: 'El campo no puede estar vacío.' });
            passwordInput.css('border', '2px solid red');
            isValid = false;
        }

        if (password !== '' && password.length < 6) {
            errors.push({ campo: 'Contraseña', problema: 'Debe tener al menos 6 caracteres.' });
            passwordInput.css('border', '2px solid red');
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
