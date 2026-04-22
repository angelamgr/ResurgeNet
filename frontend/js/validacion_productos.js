document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("altaProduForm");

    // Elementos del modal
    const modal = document.getElementById("errorModal");
    const errorList = document.getElementById("errorList");
    const modalTitle = modal.querySelector('h3');
    const closeButton = document.querySelector(".close-button");

    // Función para mostrar el modal (Error o Éxito)
    function showModal(title, contentErrors, type = 'error') {
        modal.classList.remove('success-modal');
        modalTitle.style.color = '';
        errorList.innerHTML = '';
        modalTitle.innerHTML = title;

        if (type === 'success') {
            modal.classList.add('success-modal');
            modalTitle.style.color = 'green';
            errorList.style.display = 'block';

            // Si es éxito, creamos el texto y le aplicamos color VERDE
            if (typeof contentErrors === 'string') {
                const li = document.createElement('li');
                li.style.listStyle = "none";
                li.style.textAlign = "center";
                li.style.fontSize = "1.2rem";
                li.style.color = "green"; 
                li.innerHTML = `<strong>${contentErrors}</strong>`;
                errorList.appendChild(li);
            }
        } else {
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
    }

    closeButton.addEventListener('click', hideModal);

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        let isValid = true;
        let errors = [];

        // Selección de campos
        const nombre = form.querySelector("input[name='nombre']");
        const tipo = form.querySelector("input[name='tipo']");
        const descripcion = form.querySelector("input[name='descripcion']");
        const precio = form.querySelector("input[name='precio']");
        const stock = form.querySelector("input[name='stock']");
        const imagen = form.querySelector("input[name='imagen']");

        function addError(input, campo, problema, ejemplo) {
            errors.push({ campo, problema, ejemplo });
            input.style.border = "2px solid red";
            isValid = false;
        }

        function limpiarEstilo(input) {
            input.style.border = "1px solid #ddd";
        }

        // --- 1. Limpiar estilos previos ---
        [nombre, tipo, descripcion, precio, stock].forEach(input => limpiarEstilo(input));

        // --- 2. Validaciones ---
        if (!nombre.value.trim()) addError(nombre, "Nombre", "No puede estar vacío.", "Ej: Alas de Onix");
        if (!tipo.value.trim()) addError(tipo, "Tipo", "No puede estar vacío.", "Ej: Libro");
        if (!descripcion.value.trim()) addError(descripcion, "Descripción", "No puede estar vacío.", "Breve detalle");

        const precioRegex = /^\d+(\.\d{1,2})?$/;
        if (!precio.value.trim()) {
            addError(precio, "Precio", "No puede estar vacío.", "Ej: 19.99");
        } else if (!precioRegex.test(precio.value)) {
            addError(precio, "Precio", "Debe ser un número válido.", "Ej: 25.50");
        }

        if (!stock.value.trim()) {
            addError(stock, "Stock", "No puede estar vacío.", "Ej: 10");
        } else if (!/^\d+$/.test(stock.value)) {
            addError(stock, "Stock", "Debe ser un número entero.", "Ej: 5");
        }

        if (imagen.files.length === 0) {
            addError(imagen, "Imagen", "Debes seleccionar una imagen.", "Formatos: jpg, png");
        } else {
            const file = imagen.files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                addError(imagen, "Imagen", "Debe ser JPG o PNG.", "Selecciona otra foto.");
            } else {
                limpiarEstilo(imagen);
            }
        }

        // --- 3. Envío ---
        if (!isValid) {
            showModal("Errores en el Producto", errors, 'error');
        } else {
            try {
                const formData = new FormData(form);

                // Recuperar el ID que guardamos en el Login
                const idComercio = localStorage.getItem('id_usuario_comercio');

                console.log("ID recuperado del localStorage:", idComercio); // Para depurar

                if (idComercio) {
                    formData.append('id_comercio', idComercio);
                } else {
                    console.error("No se encontró el ID del comercio en localStorage");
                    showModal("Error de Sesión", "No se detectó el ID del comercio. Por favor, cierra sesión y vuelve a entrar.", 'error');
                    return; // Detenemos el envío si no hay ID
                }

                const productUrl = 'http://localhost:8080/api/registerProduct';
                const nombreGuardado = nombre.value;

                fetch(productUrl, {
                    method: 'POST',
                    body: formData,
                })
                    .then(response => {
                        console.log("Estado de la respuesta:", response.status);
                        if (!response.ok) {
                            // Si el error no es JSON, esto fallará, así que usamos text() como respaldo
                            return response.text().then(text => {
                                try {
                                    return Promise.reject(JSON.parse(text));
                                } catch (e) {
                                    return Promise.reject({ message: text });
                                }
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        showModal(`Guardado con éxito`, `Producto registrado: ${nombreGuardado}`, 'success');
                        form.reset();
                        [nombre, tipo, descripcion, precio, stock, imagen].forEach(input => limpiarEstilo(input));
                    })
                    .catch(error => {
                        console.error('Error capturado en el catch:', error);
                        showModal(`Error al Guardar`, [{
                            campo: "Servidor",
                            problema: error.message || 'Error desconocido',
                            ejemplo: "Revisa la consola (F12) para más detalles."
                        }], 'error');
                    });
            } catch (err) {
                console.error("Error crítico en el JS:", err);
            }
        }

    });
});