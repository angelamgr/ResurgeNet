$(document).ready(function () {
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

    function hideModal() { $('#errorModal').css('display', 'none'); }

    $('.close-button').on('click', hideModal);
    $(window).on('click', function (event) {
        if (event.target === $('#errorModal')[0]) hideModal();
    });

    $('#logout-btn').click(function(e) {
        e.preventDefault();
        $.ajax({
            url: `${API_BASE}/logoutUser`,
            type: 'POST',
            xhrFields: { withCredentials: true },
            success: function(response) {
                showModal("Sesión Cerrada", "Será redirigido al inicio en 3 segundos...", 'success'); 
                setTimeout(() => { window.location.replace('index.html'); }, 3000);
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
