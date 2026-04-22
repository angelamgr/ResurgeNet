$(document).ready(function () {
    // --- 1. CARGA INICIAL ---
    cargarComercios();

    // --- 2. FUNCIÓN DE MODAL UNIFICADA (Con soporte para Confirmación) ---
    function showModal(title, content, type = 'error', callback = null) {
        const modal = $('#errorModal');
        const errorList = $('#errorList');
        const modalTitle = modal.find('h3');
        
        // Buscamos el botón de confirmación, si no existe lo creamos
        let btnConfirm = $('#modal-confirm-btn');
        if (btnConfirm.length === 0) {
            // Se inserta después de la lista de errores o del botón cerrar
            $('.modal-content').append('<button id="modal-confirm-btn" class="btn-confirm-modal"></button>');
            btnConfirm = $('#modal-confirm-btn');
        }

        // Configuración básica
        modalTitle.text(title);
        errorList.empty();
        modal.removeClass('modal-success modal-error modal-confirm').addClass(`modal-${type}`);
        modalTitle.css('color', type === 'success' ? '#155724' : (type === 'confirm' ? '#856404' : '#a94442'));

        // Reset de botones: ocultar confirmar por defecto
        btnConfirm.hide().off('click');

        // Si es tipo confirmación, configuramos el botón "Sí"
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

        // Renderizar contenido
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

    // Eventos de cierre del modal
    $('.close-button').on('click', hideModal);
    $(window).on('click', function (e) {
        if (e.target === $('#errorModal')[0]) hideModal();
    });

    // --- 3. LÓGICA DE CARGA DE DATOS ---
    function cargarComercios() {
        $.ajax({
            url: 'http://localhost:8080/api/gestion_comercios_activos',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                const contenedor = $('#contenedor-comercios');
                contenedor.empty();

                if (response.length === 0) {
                    contenedor.append('<p style="text-align:center; padding:20px;">No hay comercios registrados.</p>');
                    return;
                }

                response.forEach(comercio => {
                    const esActivo = comercio.estado === 'activo';
                    const esDesactivadoTmp = comercio.estado === 'desactivado tmp';

                    const attrActivar = esActivo ? 'disabled class="btn-icon btn-activar btn-disabled"' : 'class="btn-icon btn-activar"';
                    const attrDesactivar = esDesactivadoTmp ? 'disabled class="btn-icon btn-desactivar btn-disabled"' : 'class="btn-icon btn-desactivar"';

                    const fila = `
                    <div class="comercio-row" data-id="${comercio.id_usuario}">
                        <span class="comercio-nombre">${comercio.nombreComercio}</span>
                        <div class="acciones">
                            <button ${attrActivar} title="Activar"><span></span></button>
                            <button ${attrDesactivar} title="Desactivar"><span></span></button>
                            <button class="btn-icon btn-eliminar" title="Eliminar"><span></span></button>
                        </div>
                    </div>`;
                    contenedor.append(fila);
                });
            }
        });
    }

    // --- 4. EVENTOS DE BOTONES (Delegados) ---

    $(document).on('click', '.btn-activar:not(:disabled)', function () {
        const id = $(this).closest('.comercio-row').data('id');
        cambiarEstadoComercio(id, 'activar');
    });

    $(document).on('click', '.btn-desactivar:not(:disabled)', function () {
        const id = $(this).closest('.comercio-row').data('id');
        cambiarEstadoComercio(id, 'desactivar');
    });

    $(document).on('click', '.btn-eliminar', function () {
        const id = $(this).closest('.comercio-row').data('id');
        const nombre = $(this).closest('.comercio-row').find('.comercio-nombre').text();

        // USANDO EL NUEVO MODAL DE CONFIRMACIÓN
        showModal(
            "¿Confirmar eliminación?", 
            `Estás a punto de eliminar a "${nombre}". Esta acción es irreversible.`, 
            'confirm', 
            function() {
                eliminarComercio(id);
            }
        );
    });

    // --- 5. FUNCIONES AJAX ---

    function cambiarEstadoComercio(id, accion) {
        let urlFinal = accion === 'activar' 
            ? `http://localhost:8080/api/estado_activar_comercio/${id}/activar`
            : `http://localhost:8080/api/estado_desactivar_comercio/${id}/desactivar`;

        $.ajax({
            url: urlFinal,
            type: 'PUT',
            success: function () {
                cargarComercios(); // Refresco silencioso o podrías poner un success corto
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || "Error de conexión al cambiar estado";
                showModal("Error", errorMsg, 'error');
            }
        });
    }

    function eliminarComercio(id) {
        $.ajax({
            url: `http://localhost:8080/api/eliminar_comercio/${id}`,
            type: 'DELETE',
            success: function (response) {
                showModal("Eliminado", response.message || "Comercio eliminado con éxito", "success");
                cargarComercios(); 
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || "No se pudo eliminar el comercio";
                showModal("Error de eliminación", errorMsg, 'error');
            }
        });
    }
});