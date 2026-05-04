$(document).ready(function () {
    $.ajaxSetup({
        headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
    });

    function showModal(title, content, type = 'error', callback = null) {
        const modal = $('#errorModal');
        const errorList = $('#errorList');
        const modalTitle = modal.find('h3');
        
        let btnConfirm = $('#modal-confirm-btn');
        if (btnConfirm.length === 0) {
            $('.modal-content').append('<button id="modal-confirm-btn"></button>');
            btnConfirm = $('#modal-confirm-btn');
        }

        btnConfirm.hide().off('click'); 

        modalTitle.text(title);
        errorList.empty();
        modal.removeClass('modal-success modal-error modal-confirm').addClass(`modal-${type}`);
        
        const colors = { success: '#155724', confirm: '#d9534f', error: '#a94442' };
        modalTitle.css('color', colors[type] || colors.error);

        if (type === 'confirm') {
            btnConfirm.show()
                .text('Eliminar permanentemente')
                .css({
                    'background-color': '#d9534f',
                    'color': 'white',
                    'border': 'none',
                    'padding': '10px 20px',
                    'margin-top': '15px',
                    'cursor': 'pointer',
                    'border-radius': '4px',
                    'width': '100%'
                });
            btnConfirm.on('click', function() {
                if (callback) callback();
                hideModal();
            });
        }

        if (Array.isArray(content)) {
            content.forEach(msg => errorList.append($('<li>').text(msg)));
        } else {
            errorList.append($('<li>').text(content));
        }

        modal.css('display', 'flex');
    }

    function hideModal() {
        $('#errorModal').hide();
        $('#modal-confirm-btn').hide(); 
    }

    $('.close-button').on('click', hideModal);
    $(window).on('click', (e) => { if (e.target === $('#errorModal')[0]) hideModal(); });

    function cargarConsumidores() {
        $.ajax({
            url: `${API_BASE}/gestion_consumidores`,
            method: 'GET',
            success: function (usuarios) {
                let contenedor = $('#lista-consumidores');
                contenedor.empty();
                if (usuarios.length === 0) {
                    contenedor.append('<p style="text-align:center; width:100%;">No hay consumidores registrados.</p>');
                    return;
                }
                usuarios.forEach(u => {
                    contenedor.append(`
                        <div class="comercio-item" id="fila-user-${u.id_usuario}">
                            <div class="caja-blanca">${u.nombre}</div>
                            <div class="botones-acciones">
                                <button class="btn-eliminar" data-id="${u.id_usuario}" data-nombre="${u.nombre}" type="button">Eliminar</button>
                            </div>
                        </div>
                    `);
                });
            },
            error: function (xhr) {
                $('#lista-consumidores').html('<p>Error al cargar los datos.</p>');
            }
        });
    }

    $(document).on('click', '.btn-eliminar', function () {
        const userId = $(this).attr('data-id');
        const nombre = $(this).attr('data-nombre');

        if (!userId || userId === "undefined") {
            showModal("Error", "No se pudo obtener el ID del usuario.", "error");
            return;
        }

        showModal(
            "Confirmar Eliminación", 
            `¿Estás seguro de que deseas eliminar al consumidor "${nombre}"?`, 
            'confirm', 
            function() {
                const elementoAEliminar = $(`#fila-user-${userId}`);
                $.ajax({
                    url: `${API_BASE}/gestion_consumidores/${userId}`,
                    type: 'DELETE',
                    success: function (response) {
                        elementoAEliminar.fadeOut(400, function () { $(this).remove(); });
                        showModal("Eliminado", response.message || "Usuario eliminado.", "success");
                    },
                    error: function (xhr) {
                        const msg = xhr.responseJSON ? xhr.responseJSON.message : "Error de comunicación.";
                        showModal("Error", msg, "error");
                    }
                });
            }
        );
    });

    cargarConsumidores();
});
