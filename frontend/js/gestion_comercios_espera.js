$(document).ready(function () {

    // --- 1. FUNCIÓN DE MODAL UNIFICADA ---
    function showModal(title, content, type = 'error', callback = null) {
        const modal = $('#errorModal');
        const errorList = $('#errorList');
        const modalTitle = modal.find('h3');
        
        let btnConfirm = $('#modal-confirm-btn');
        if (btnConfirm.length === 0) {
            $('.modal-content').append('<button id="modal-confirm-btn"></button>');
            btnConfirm = $('#modal-confirm-btn');
        }

        modalTitle.text(title);
        errorList.empty();
        modal.removeClass('modal-success modal-error modal-confirm').addClass(`modal-${type}`);
        
        // Colores dinámicos para el título
        const colors = { success: '#155724', confirm: '#856404', error: '#a94442' };
        modalTitle.css('color', colors[type] || colors.error);

        btnConfirm.hide().off('click');

        if (type === 'confirm') {
            btnConfirm.show()
                .text('Validar y Activar')
                .css({
                    'background-color': '#28a745', // Verde para dar de alta
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
    }

    $('.close-button').on('click', hideModal);
    $(window).on('click', (e) => { if (e.target === $('#errorModal')[0]) hideModal(); });


    // --- 2. LÓGICA DE CARGA ---
    function cargarComerciosEspera() {
        $.ajax({
            url: 'http://localhost:8080/api/gestion_comercios_espera',
            method: 'GET',
            success: function (comercios) {
                let contenedor = $('.grid-comercios');
                contenedor.empty(); 

                if (comercios.length === 0) {
                    contenedor.append('<p style="text-align:center; width:100%;">No hay comercios pendientes de validación.</p>');
                    return;
                }

                comercios.forEach(c => {
                    contenedor.append(`
                        <div class="comercio-item" id="fila-comercio-${c.id_solicitud}">
                            <div class="caja-blanca">${c.nombreComercio}</div>
                            <div class="botones-acciones">
                                <button class="btn-alta" data-id="${c.id_solicitud}" data-nombre="${c.nombreComercio}" type="button">Dar de alta</button>
                            </div>
                        </div>
                    `);
                });
            },
            error: function (xhr) {
                console.error("Error al cargar comercios:", xhr.responseText);
                $('.grid-comercios').html('<p>Error al conectar con el servidor.</p>');
            }
        });
    }

    // --- 3. EVENTO PARA DAR DE ALTA (CONFIRMACIÓN + AJAX) ---
    $(document).on('click', '.btn-alta', function () {
        const comercioId = $(this).attr('data-id');
        const nombre = $(this).attr('data-nombre');
        const elementoHTML = $(`#fila-comercio-${comercioId}`);

        // Reemplazo del confirm nativo
        showModal(
            "Confirmar Alta", 
            `¿Deseas validar el comercio "${nombre}" y cambiar su estado a Activo?`, 
            'confirm', 
            function() {
                // Si el usuario confirma, ejecutamos el AJAX
                $.ajax({
                    url: `http://localhost:8080/api/activar_comercio/${comercioId}`,
                    type: 'PUT',
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    success: function (response) {
                        showModal("Éxito", "Comercio activado correctamente", "success");
                        
                        elementoHTML.fadeOut(400, function () {
                            $(this).remove();
                            if ($('.grid-comercios').children().length === 0) {
                                $('.grid-comercios').html('<p style="text-align:center; width:100%;">No hay comercios pendientes de validación.</p>');
                            }
                        });
                    },
                    error: function (xhr) {
                        const msg = xhr.responseJSON?.error || "No se pudo actualizar el estado del comercio.";
                        showModal("Error", msg, "error");
                    }
                });
            }
        );
    });

    cargarComerciosEspera();
});