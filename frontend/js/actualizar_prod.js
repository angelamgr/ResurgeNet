$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id_producto = urlParams.get('id');

    function showModal(title, content, type = 'error') {
        const modal = $('#errorModal');
        const errorList = $('#errorList');
        const modalTitle = modal.find('h3');

        modalTitle.text(title);
        errorList.empty();
        modal.removeClass('modal-success modal-error').addClass(`modal-${type}`);
        modalTitle.css('color', type === 'success' ? '#155724' : '#a94442');

        if (Array.isArray(content)) {
            content.forEach(error => {
                const li = $('<li>').html(`<strong>${error.campo}:</strong> ${error.problema}`);
                errorList.append(li);
            });
        } else {
            const li = $('<li>').text(content);
            errorList.append(li);
        }
        modal.css('display', 'flex');
    }

    $('.close-button').on('click', () => $('#errorModal').hide());

    $('#altaProduForm').on('submit', function(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nombre', $('#nombre_prod').val());
        formData.append('tipo', $('#tipo').val());
        formData.append('descripcion', $('#descripcion').val());
        formData.append('precio', $('#precio').val());
        formData.append('stock', $('#stock').val());

        const fileInput = $('#imagen')[0].files[0];
        if (fileInput) formData.append('imagen', fileInput);

        formData.append('_method', 'PUT');

        $.ajax({
            url: `${API_BASE}/actualizar_producto/${id_producto}`,
            type: 'POST', 
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                showModal("Éxito", "Producto actualizado correctamente. Redirigiendo...", 'success');
                setTimeout(() => { window.location.href = 'listado_productos_comercio.html'; }, 2000);
            },
            error: function(err) {
                let msg = (err.responseJSON && err.responseJSON.message) 
                    ? err.responseJSON.message 
                    : 'Error al actualizar el producto';
                showModal("Error de Actualización", msg, 'error');
            }
        });
    });
});
