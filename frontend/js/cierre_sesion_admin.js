// --- Lógica del Cierre de Sesión ---
$(document).ready(function () {
    // --- 1. Definición de la función showModal (Implementación local) ---
    function showModal(title, content, type = 'error') {
        const modal = $('#errorModal');
        const errorList = $('#errorList');
        const modalTitle = modal.find('h3');

        modalTitle.text(title);
        errorList.empty(); // Limpiar contenido previo

        // Aplicar clases según el tipo (success/error)
        modal.removeClass('modal-success modal-error').addClass(`modal-${type}`);
        
        // Ajustar color del título dinámicamente
        modalTitle.css('color', type === 'success' ? '#155724' : '#a94442');

        // Insertar el contenido (string o array)
        if (Array.isArray(content)) {
            content.forEach(error => {
                const li = $('<li>').html(`<strong>${error.campo}:</strong> ${error.problema}`);
                errorList.append(li);
            });
        } else {
            const li = $('<li>').text(content);
            errorList.append(li);
        }

        modal.css('display', 'flex'); // Mostrar el modal
    }

    // --- 2. Lógica para cerrar el modal ---
    function hideModal() {
        $('#errorModal').css('display', 'none');
    }

    // Eventos de cierre (clic en X o fuera del modal)
    $('.close-button').on('click', hideModal);
    $(window).on('click', function (event) {
        if (event.target === $('#errorModal')[0]) {
            hideModal();
        }
    });

    // --- 3. Lógica de Cierre de Sesión ---
    $('#logout-btn').click(function(e) {
        e.preventDefault();

        $.ajax({
            url: 'http://localhost:8080/api/logoutUser',
            type: 'POST',
            xhrFields: {
                withCredentials: true // Importante para que el servidor reconozca la sesión
            },
            success: function(response) {
                // Usamos la implementación local de showModal
                showModal("Sesión Cerrada", "Será redirigido al inicio en 3 segundos...", 'success'); 

                // Redirige después de 3 segundos
                setTimeout(() => {
                    window.location.replace('index.html');
                }, 3000);
            },
            error: function(xhr) {
                let msg = (xhr.responseJSON && xhr.responseJSON.message) 
                            ? xhr.responseJSON.message 
                            : 'Error al intentar cerrar la sesión';

                showModal("Error", msg, 'error');
            }
        });
    });
});