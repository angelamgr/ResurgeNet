// Requiere: jquery, config.js, utils.js
$(document).ready(function () {
    cargarSolicitudes();
});

async function cargarSolicitudes() {
    try {
        var response = await fetch(API_BASE + '/solicitudes_comercios');
        var data     = await response.json();
        var container = document.querySelector('.comercios-container');
        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">No hay solicitudes pendientes.</p>';
            return;
        }

        data.forEach(function (solicitud) {
            var row = document.createElement('div');
            row.classList.add('comercio-row');
            row.innerHTML =
                '<span class="comercio-nombre">'         + solicitud.nombreComercio   + '</span>' +
                '<span class="motivo-solicitud-texto">'  + solicitud.motivoSolicitud  + '</span>' +
                '<div class="acciones">' +
                    '<button class="btn-icon btn-aceptar" onclick="aceptar(' + solicitud.id_solicitud + ', \'' + solicitud.nombreComercio + '\')"><span></span></button>' +
                    '<button class="btn-icon btn-denegar" onclick="denegar(' + solicitud.id_solicitud + ', \'' + solicitud.nombreComercio + '\')"><span></span></button>' +
                '</div>';
            container.appendChild(row);
        });
    } catch (error) {
        showModal('Error', 'No se pudieron cargar las solicitudes');
    }
}

async function denegar(id, nombre) {
    showModal(
        'Confirmar Denegación',
        '¿Seguro que quieres denegar la solicitud de "' + nombre + '"?',
        'confirm',
        {
            confirmText:  'Denegar solicitud',
            confirmColor: '#d9534f',
            onConfirm: async function () {
                try {
                    var response = await fetch(API_BASE + '/denegar_solicitud/' + id, {
                        method:  'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    var data = await response.json();
                    if (response.ok) {
                        showModal('Éxito', data.message || 'Solicitud denegada', 'success');
                        var btn = document.querySelector('.btn-denegar[onclick*="denegar(' + id + '"]');
                        if (btn) btn.closest('.comercio-row').remove();
                    } else {
                        showModal('Error', data.error || 'No se pudo denegar');
                    }
                } catch (error) {
                    showModal('Error', 'Error de conexión con el servidor');
                }
            }
        }
    );
}

async function aceptar(id, nombre) {
    showModal(
        'Confirmar Aceptación',
        '¿Seguro que quieres aceptar la solicitud de "' + nombre + '"?',
        'confirm',
        {
            confirmText:  'Aceptar solicitud',
            confirmColor: '#28a745',
            onConfirm: async function () {
                try {
                    var response = await fetch(API_BASE + '/aceptar_solicitud/' + id, {
                        method:  'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    var data = await response.json();
                    if (response.ok) {
                        showModal('Éxito', data.message || 'Solicitud aceptada', 'success');
                        var btn = document.querySelector('.btn-aceptar[onclick*="aceptar(' + id + '"]');
                        if (btn) btn.closest('.comercio-row').remove();
                    } else {
                        showModal('Error', data.error || 'No se pudo aceptar');
                    }
                } catch (error) {
                    showModal('Error', 'Error de conexión con el servidor');
                }
            }
        }
    );
}
