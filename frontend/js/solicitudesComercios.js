// --- FUNCIÓN DE MODAL UNIFICADA ---
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
    
    const colors = { success: '#155724', confirm: '#856404', error: '#a94442' };
    modalTitle.css('color', colors[type] || colors.error);

    btnConfirm.hide().off('click');

    if (type === 'confirm') {
        btnConfirm.show()
            .text('Confirmar Acción')
            .css({
                'background-color': '#007bff',
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
            modal.hide();
        });
    }

    if (Array.isArray(content)) {
        content.forEach(msg => errorList.append($('<li>').text(msg)));
    } else {
        errorList.append($('<li>').text(content));
    }

    modal.css('display', 'flex');
}

// Lógica de cierre para el modal
$(document).ready(function() {
    $('.close-button').on('click', () => $('#errorModal').hide());
    $(window).on('click', (e) => { if (e.target === $('#errorModal')[0]) $('#errorModal').hide(); });
});

// --- LÓGICA DE SOLICITUDES ---

async function cargarSolicitudes() {
    try {
        const response = await fetch('http://localhost:8080/api/solicitudes_comercios');
        const data = await response.json();

        const container = document.querySelector('.comercios-container');
        container.innerHTML = ''; 

        if (data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">No hay solicitudes pendientes.</p>';
            return;
        }

        data.forEach(solicitud => {
            const row = document.createElement('div');
            row.classList.add('comercio-row');

            row.innerHTML = `
                <span class="comercio-nombre">${solicitud.nombreComercio}</span>
                <span class="motivo-solicitud-texto">${solicitud.motivoSolicitud}</span>
                <div class="acciones">
                    <button class="btn-icon btn-aceptar" onclick="aceptar(${solicitud.id_solicitud}, '${solicitud.nombreComercio}')">
                        <span></span>
                    </button>
                    <button class="btn-icon btn-denegar" onclick="denegar(${solicitud.id_solicitud}, '${solicitud.nombreComercio}')">
                        <span></span>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });

    } catch (error) {
        console.error('Error cargando solicitudes:', error);
        showModal("Error", "No se pudieron cargar las solicitudes", "error");
    }
}

async function denegar(id, nombre) {
    showModal(
        "Confirmar Denegación", 
        `¿Seguro que quieres denegar la solicitud de "${nombre}"?`, 
        'confirm', 
        async function() {
            try {
                const response = await fetch(`http://localhost:8080/api/denegar_solicitud/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok) {
                    showModal("Éxito", data.message || "Solicitud denegada", "success");
                    const btn = document.querySelector(`.btn-denegar[onclick*="denegar(${id}"]`);
                    if (btn) btn.closest('.comercio-row').remove();
                } else {
                    showModal("Error", data.error || "No se pudo denegar", "error");
                }
            } catch (error) {
                showModal("Error", "Error de conexión con el servidor", "error");
            }
        }
    );
}

async function aceptar(id, nombre) {
    showModal(
        "Confirmar Aceptación", 
        `¿Seguro que quieres aceptar la solicitud de "${nombre}"?`, 
        'confirm', 
        async function() {
            try {
                const response = await fetch(`http://localhost:8080/api/aceptar_solicitud/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok) {
                    showModal("Éxito", data.message || "Solicitud aceptada", "success");
                    const btn = document.querySelector(`.btn-aceptar[onclick*="aceptar(${id}"]`);
                    if (btn) btn.closest('.comercio-row').remove();
                } else {
                    showModal("Error", data.error || "No se pudo aceptar", "error");
                }
            } catch (error) {
                showModal("Error", "Error de conexión con el servidor", "error");
            }
        }
    );
}

document.addEventListener('DOMContentLoaded', cargarSolicitudes);