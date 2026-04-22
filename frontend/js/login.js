$(document).ready(function () {
    // --- Elementos del Modal ---
    const modal = $('#errorModal');
    const errorList = $('#errorList');
    const modalTitle = modal.find('h3');
    const closeButton = modal.find('.close-button');

    // Función para mostrar el modal, ahora con parámetro 'type' ('success' o 'error')
    function showModal(title, errorContent, type = 'error') {
        modalTitle.text(title);
        errorList.empty(); // Limpiar contenido previo

        // Limpiar y establecer estilos del modal según el tipo (para CSS de éxito/error)
        modal.removeClass('modal-success modal-error').addClass(`modal-${type}`);
        modalTitle.css('color', type === 'success' ? '#155724' : '#a94442');

        // Si el contenido es un array de errores de validación de cliente
        if (Array.isArray(errorContent)) {
            errorContent.forEach(error => {
                const li = $('<li>').html(`
                    <strong>Campo:</strong> ${error.campo}<br>
                    <strong>Problema:</strong> ${error.problema}
                `);
                errorList.append(li);
            });
            // Si el contenido es un mensaje de servidor (una cadena simple)
        } else if (typeof errorContent === 'string') {
            const li = $('<li>').text(errorContent); // Muestra solo el texto, sin prefijos (e.g., "Sesión iniciada")
            errorList.append(li);
        }

        modal.css('display', 'flex'); // Mostrar el modal
    }

    // Función para ocultar el modal
    function hideModal() {
        modal.css('display', 'none');
        modalTitle.text('Errores de Validación'); // Restablecer título por defecto
        // Restablecer estilos
        modal.removeClass('modal-success modal-error');
        modalTitle.css('color', '#333');
    }

    // --- Control de Eventos del Modal ---
    closeButton.on('click', hideModal);

    // Cerrar modal al hacer clic fuera del contenido
    $(window).on('click', function (event) {
        if (event.target === modal[0]) {
            hideModal();
        }
    });

    // --- Lógica de Envío del Formulario (Login) ---
    $('#loginForm').submit(function (e) {
        e.preventDefault();

        let isValid = true;
        let errors = [];

        // --- 1. Obtener y Validar Campos del Cliente ---
        const usuarioInput = $('input[name="usuario"]');
        const passwordInput = $('input[name="password"]');

        const usuario = usuarioInput.val().trim();
        const password = passwordInput.val().trim();

        // Limpiar estilos previos
        usuarioInput.css('border', '1px solid #ddd');
        passwordInput.css('border', '1px solid #ddd');


        // Validación de campo vacío (Usuario)
        if (usuario === "") {
            errors.push({
                campo: "Nombre de usuario",
                problema: "El campo no puede estar vacío."
            });
            usuarioInput.css('border', '2px solid red');
            isValid = false;
        }

        // Validación de campo vacío (Contraseña)
        if (password === "") {
            errors.push({
                campo: "Contraseña",
                problema: "El campo no puede estar vacío."
            });
            passwordInput.css('border', '2px solid red');
            isValid = false;
        }

        // Validación de longitud mínima (Ejemplo: 6 caracteres para la contraseña)
        if (password !== "" && password.length < 6) {
            errors.push({
                campo: "Contraseña",
                problema: "Debe tener al menos 6 caracteres."
            });
            passwordInput.css('border', '2px solid red');
            isValid = false;
        }


        // --- Manejo de Errores de Validación de Cliente ---
        if (!isValid) {
            // Muestra errores de cliente (type='error' por defecto)
            showModal("Errores de Validación de Datos", errors);
            return; // Detiene el envío de AJAX
        }

        // --- 3. Envío AJAX si la validación del cliente es exitosa ---
        $.ajax({
            url: 'http://localhost:8080/api/loginUser',
            type: 'POST',
            xhrFields: { withCredentials: true },
            data: {
                usuario: usuario,
                password: password
            },

            success: function (response) {
                console.log("Datos recibidos en login:", response); // Para verificar que llega el id_usuario

                if (response.id_usuario) {
                    localStorage.setItem('id_usuario_comercio', response.id_usuario);
                    console.log("ID guardado correctamente:", response.id_usuario);
                }

                showModal("Éxito", response.message, 'success');

                setTimeout(() => {
                    window.location.href = response.redirect;
                }, 1500);
            },
            error: function (xhr) {
                // Muestra error de servidor (ej. Credenciales incorrectas) en modal
                let msg = (xhr.responseJSON && xhr.responseJSON.message)
                    ? xhr.responseJSON.message
                    : 'Error de conexión con el servidor.';

                showModal("Error al Iniciar Sesión", msg, 'error');

                // Limpiar campos de contraseña por seguridad
                passwordInput.val('');
            }
        });
        
    });

});