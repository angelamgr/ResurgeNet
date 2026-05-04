document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("workForm");
    const modal = document.getElementById("errorModal");
    const errorList = document.getElementById("errorList");
    const modalTitle = modal.querySelector('h3'); 
    const closeButton = document.querySelector(".close-button");

    function showModal(title, contentErrors, type = 'error') {
        modal.classList.remove('success-modal');
        modalTitle.style.color = type === 'success' ? 'green' : 'red';
        errorList.innerHTML = '';
        modalTitle.innerHTML = title;

        if (type === 'success') {
            errorList.style.display = 'none';
        } else {
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

    const hideModal = () => modal.style.display = "none";
    closeButton.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        let isValid = true;
        let errors = [];

        const nombrePers = form.querySelector("[name='nombre_personal']");
        const nombreCom  = form.querySelector("[name='nombre_comercio']");
        const telefono   = form.querySelector("[name='telefono']");
        const email      = form.querySelector("[name='email']");
        const motivo     = form.querySelector("[name='motivo']");
        const ciudad     = form.querySelector("[name='ciudad']");
        const web        = form.querySelector("[name='web_operativa']");

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

        campoVacio(nombrePers, "Nombre personal", "Ej: Juan Pérez");
        campoVacio(nombreCom, "Nombre comercio", "Ej: Panadería El Sol");
        campoVacio(telefono, "Número de teléfono", "Ej: 600112233");
        campoVacio(email, "Email", "Ej: comercio@ejemplo.com");
        campoVacio(motivo, "Motivo", "Explica brevemente por qué quieres unirte.");
        campoVacio(ciudad, "Ciudad", "Ej: Granada");
        campoVacio(web, "¿Web operativa?", "Selecciona Sí o No");

        if (email.value.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            addError(email, "Email", "Formato de correo no válido.", "Ej: nombre@dominio.com");
        }

        if (telefono.value.trim() !== "" && !/^\d{9}$/.test(telefono.value)) {
            addError(telefono, "Teléfono", "Debe contener exactamente 9 números.", "Ej: 611223344");
        }

        if (!isValid) {
            showModal("⚠️ Errores de Validación", errors, 'error');
        } else {
            const submitBtn = form.querySelector('.btn-submit');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Enviando...';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            fetch(`${API_BASE}/enviar_solicitud`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': data._token
                },
                body: JSON.stringify(data),
            })
            .then(response => {
                if (!response.ok) return response.json().then(err => Promise.reject(err));
                return response.json();
            })
            .then(res => {
                showModal(`✅ Solicitud Enviada`, null, 'success'); 
                form.reset();
                setTimeout(() => { window.location.href = 'index.html'; }, 4500);
            })
            .catch(error => {
                console.error('Error:', error);
                showModal(`❌ Error en el Envío`, [{ 
                    campo: "Servidor", 
                    problema: 'No se pudo procesar la solicitud.', 
                    ejemplo: error.message || 'Error de conexión' 
                }], 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Enviar formulario';
            });
        }
    });
});
