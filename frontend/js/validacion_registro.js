document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    
    // Elementos del modal
    const modal = document.getElementById("errorModal");
    const errorList = document.getElementById("errorList");
    const modalTitle = modal.querySelector('h3'); 
    const closeButton = document.querySelector(".close-button");
    
    function showModal(title, contentErrors, type = 'error') {
        modal.classList.remove('success-modal');
        modalTitle.style.color = ''; 
        errorList.innerHTML = ''; 
        modalTitle.innerHTML = title; 

        if (type === 'success') {
            modal.classList.add('success-modal');
            modalTitle.style.color = 'green';
            errorList.style.display = 'none';
        } else {
            modal.classList.remove('success-modal');
            modalTitle.style.color = 'red';
            errorList.style.display = 'block';
            if (Array.isArray(contentErrors)) {
                contentErrors.forEach(error => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>Campo:</strong> ${error.campo}<br><strong>Problema:</strong> ${error.problema}<br><strong>Ejemplo:</strong> <em>${error.ejemplo}</em>`;
                    errorList.appendChild(li);
                });
            } 
        }
        modal.style.display = "flex"; 
    }

    function hideModal() {
        modal.style.display = "none";
        modalTitle.innerHTML = ' Errores de Validación';
        modalTitle.style.color = ''; 
        errorList.style.display = 'block'; 
        modal.classList.remove('success-modal'); 
    }
    
    closeButton.addEventListener('click', hideModal);
    window.addEventListener('click', function(event) {
        if (event.target === modal) hideModal();
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        let isValid = true;
        let errors = [];

        const nombre      = form.querySelector("input[name='nombre']"); 
        const email       = form.querySelector("input[name='email']");
        const fecha       = form.querySelector("input[name='fecha_nacimiento']");
        const ciudad      = form.querySelector("input[name='ciudad']");
        const codPostal   = form.querySelector("input[name='cod_postal']");
        const direccion   = form.querySelector("input[name='direccion']");
        const telefono    = form.querySelector("input[name='telefono']");
        const userName    = form.querySelector("input[name='username']");
        const password    = form.querySelector("input[name='password']");

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

        campoVacio(nombre, "Nombre", "Ej: Juan Pérez");
        campoVacio(email, "Email", "Ej: tu.nombre@dominio.com");
        campoVacio(fecha, "Fecha de nacimiento", "Ej: 01/01/1990");
        campoVacio(ciudad, "Ciudad", "Ej: Madrid");
        campoVacio(codPostal, "Código postal", "Ej: 28001");
        campoVacio(direccion, "Dirección", "Ej: C/ Sol, 15");
        campoVacio(telefono, "Número de teléfono", "Ej: 600112233");
        campoVacio(userName, "Nombre de usuario", "Ej: juanperez88");
        campoVacio(password, "Contraseña", "Mínimo 6 caracteres y un número");

        const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (fecha.value.trim() !== "") {
            if (!fechaRegex.test(fecha.value)) {
                addError(fecha, "Fecha de nacimiento", "El formato debe ser DD/MM/YYYY.", "Ej: 15/05/1995");
            } else { 
                const parts = fecha.value.split('/');
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);
                const dateObj = new Date(year, month - 1, day);
                if (dateObj.getFullYear() !== year || dateObj.getMonth() + 1 !== month || dateObj.getDate() !== day) {
                    addError(fecha, "Fecha de nacimiento", "La fecha introducida no es válida (e.g., 30/02/2000).", "Ej: 15/05/1995");
                } else if (dateObj > new Date()) {
                    addError(fecha, "Fecha de nacimiento", "La fecha de nacimiento no puede ser futura.", "Ej: 15/05/1995");
                }
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
        if (email.value.trim() !== "" && !emailRegex.test(email.value)) {
            addError(email, "Email", "Formato de correo no válido.", "Ej: tu.nombre@gmail.com");
        }

        if (codPostal.value.trim() !== "" && !/^\d{5}$/.test(codPostal.value)) {
            addError(codPostal, "Código postal", "Debe contener 5 números.", "Ej: 28001");
        } 

        if (telefono.value.trim() !== "" && !/^\d{9}$/.test(telefono.value)) {
            addError(telefono, "Número de teléfono", "Debe contener 9 dígitos.", "Ej: 600112233");
        } 

        const passwordContainsNumber = /\d/;
        if (password.value.trim() !== "" && (password.value.length < 6 || !passwordContainsNumber.test(password.value))) {
            addError(password, "Contraseña", "Debe tener al menos 6 caracteres y contener un número.", "Ej: 'miClave123'");
        } 

        if (!isValid) {
            showModal("Errores de Validación", errors, 'error');
        } else {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            fetch(`${API_BASE}/registerConsumer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            .then(response => {
                if (!response.ok) return response.json().then(err => Promise.reject(err));
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
