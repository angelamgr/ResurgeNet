document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    
    // Elementos del modal
    const modal = document.getElementById("errorModal");
    const errorList = document.getElementById("errorList");
    const modalTitle = modal.querySelector('h3'); 
    const closeButton = document.querySelector(".close-button");
    
    // Función para mostrar el modal (Error o Éxito)
    function showModal(title, contentErrors, type = 'error') {
        // 1. Limpiar estilos y contenido
        modal.classList.remove('success-modal');
        modalTitle.style.color = ''; 
        errorList.innerHTML = ''; 

        // 2. Establecer el título y los estilos según el tipo
        modalTitle.innerHTML = title; 

        if (type === 'success') {
            modal.classList.add('success-modal');
            modalTitle.style.color = 'green';
            errorList.style.display = 'none'; // Ocultar la lista de detalles para el éxito

        } else { // Tipo 'error'
            modal.classList.remove('success-modal');
            modalTitle.style.color = 'red';
            errorList.style.display = 'block';

            // Mostrar los errores de validación (frontend o servidor)
            if (Array.isArray(contentErrors)) {
                contentErrors.forEach(error => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>Campo:</strong> ${error.campo}<br><strong>Problema:</strong> ${error.problema}<br><strong>Ejemplo:</strong> <em>${error.ejemplo}</em>`;
                    errorList.appendChild(li);
                });
            } 
        }
        
        // Muestra el modal
        modal.style.display = "flex"; 
    }

    // Función para ocultar el modal
    function hideModal() {
        modal.style.display = "none";
        // Restablecer estilos
        modalTitle.innerHTML = ' Errores de Validación';
        modalTitle.style.color = ''; 
        errorList.style.display = 'block'; 
        modal.classList.remove('success-modal'); 
    }
    
    // Event listeners del modal
    closeButton.addEventListener('click', hideModal);
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideModal();
        }
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        let isValid = true;
        let errors = [];

        // Seleccion de campos
        // NOTA: Asegúrate que estos 'name' coincidan con tu HTML
        const nombre      = form.querySelector("input[name='nombre']"); 
        const email        = form.querySelector("input[name='email']");
        const fecha        = form.querySelector("input[name='fecha_nacimiento']");
        const ciudad       = form.querySelector("input[name='ciudad']");
        const codPostal    = form.querySelector("input[name='cod_postal']");
        const direccion    = form.querySelector("input[name='direccion']");
        const telefono     = form.querySelector("input[name='telefono']");
        const userName     = form.querySelector("input[name='username']");
        const password     = form.querySelector("input[name='password']");

        // Funciones de ayuda
        function addError(input, campo, problema, ejemplo) {
            errors.push({ campo, problema, ejemplo });
            input.style.border = "2px solid red";
            isValid = false;
        }

        function campoVacio(input, campo, ejemplo) {
            if (!input || input.value.trim() === "") {
                addError(input, campo, "No puede estar vacío.", ejemplo);
            } else {
                input.style.border = "1px solid #ddd";
            }
        }

        // --- 1. Validaciones de campo vacío ---
        campoVacio(nombre, "Nombre", "Ej: Juan Pérez");
        campoVacio(email, "Email", "Ej: tu.nombre@dominio.com");
        campoVacio(fecha, "Fecha de nacimiento", "Ej: 01/01/1990");
        campoVacio(ciudad, "Ciudad", "Ej: Madrid");
        campoVacio(codPostal, "Código postal", "Ej: 28001");
        campoVacio(direccion, "Dirección", "Ej: C/ Sol, 15");
        campoVacio(telefono, "Número de teléfono", "Ej: 600112233");
        campoVacio(userName, "Nombre de usuario", "Ej: juanperez88");
        campoVacio(password, "Contraseña", "Mínimo 6 caracteres y un número");

        // --- 2. Validaciones de formato (Reducidas por espacio, asumir que el resto están bien) ---
        // --- Validación fecha de nacimiento (DD/MM/YYYY y validez) ---
        const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (fecha.value.trim() !== "") {
            if (!fechaRegex.test(fecha.value)) {
                addError(fecha, "Fecha de nacimiento", "El formato debe ser DD/MM/YYYY.", "Ej: 15/05/1995");
            } else { 
                const parts = fecha.value.split('/');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);

                const dateObj = new Date(year, month - 1, day); // Mes es 0-indexado

                // Comprobar que los componentes coincidan y que no sea una fecha futura
                if (dateObj.getFullYear() !== year || dateObj.getMonth() + 1 !== month || dateObj.getDate() !== day) {
                     addError(fecha, "Fecha de nacimiento", "La fecha introducida no es una fecha válida (e.g., 30/02/2000).", "Ej: 15/05/1995");
                } else if (dateObj > new Date()) {
                     addError(fecha, "Fecha de nacimiento", "La fecha de nacimiento no puede ser futura.", "Ej: 15/05/1995");
                }
            }
        }

        // --- Validación email (Dominio gmail o hotmail) ---
        const emailRegex = /^[^\s@]+@(gmail\.com|hotmail\.com)$/i;
        if (email.value.trim() !== "") {
            if (!emailRegex.test(email.value)) {
                addError(email, "Email", "Solo se permiten dominios gmail.com o hotmail.com.", "Ej: tu.nombre@gmail.com");
            }
        }

        // --- Validación código postal (5 dígitos) ---
        if (codPostal.value.trim() !== "" && !/^\d{5}$/.test(codPostal.value)) {
            addError(codPostal, "Código postal", "Debe contener 5 números.", "Ej: 28001");
        } 

        // --- Validación teléfono (9 dígitos españoles) ---
        if (telefono.value.trim() !== "" && !/^\d{9}$/.test(telefono.value)) {
            addError(telefono, "Número de teléfono", "Debe contener 9 dígitos.", "Ej: 600112233");
        } 

        // --- Validación contraseña: 6 caracteres MÍNIMO Y al menos un número ---
        const passwordContainsNumber = /\d/;

        if (password.value.trim() !== "" && (password.value.length < 6 || !passwordContainsNumber.test(password.value))) {
            addError(password, "Contraseña", "Debe tener al menos 6 caracteres y contener un número.", "Ej: 'miClave123'");
        } 

        // --- Mostrar errores o Enviar ---
        if (!isValid) {
            showModal("Errores de Validación", errors, 'error');
        } else {
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            const registerUrl = 'http://localhost:8080/api/registerConsumer'; 
            
            fetch(registerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => {
                // Si la respuesta no es 2xx, la tratamos como error (incluyendo 400 y 500)
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            })
            .then(data => {
                showModal(`Registro Exitoso`, null, 'success'); 
                
                setTimeout(() => {
                    window.location.href = data.redirect || 'inicio_sesion.html';
                }, 2000);

            })
            .catch(error => {
                console.error('Error del servidor:', error);
                
                // Muestra el detalle del error de DB/Servidor (db_error_detail)
                let detail = error.db_error_detail || error.message || 'Error desconocido al intentar registrar.';

                showModal(`Error en el Registro`, [{ 
                    campo: "Servidor", 
                    problema: 'Fallo en la operación.', 
                    ejemplo: detail 
                }], 'error');
            });
        }
    });
});