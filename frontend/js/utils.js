// ============================================================
// UTILS.JS — Utilidades compartidas del frontend ResurgeNet
// ============================================================
// Este archivo debe cargarse DESPUÉS de jQuery y config.js,
// y ANTES que cualquier otro script de página.
// Orden correcto en el HTML:
//   1. jquery-3.6.0.min.js
//   2. js/config.js
//   3. js/utils.js
//   4. script específico de la página
// ============================================================

/**
 * Muestra el modal de mensajes reutilizable.
 *
 * @param {string} title   - Título que aparece en el <h3> del modal.
 * @param {string|Array} content
 *   - string  → se muestra como un único <li>.
 *   - Array de objetos { campo, problema [, ejemplo] }
 *                     → se renderiza una fila por error con etiquetas.
 *   - null    → no se añade contenido a la lista (usado en modales de éxito sin detalle).
 * @param {string} [type='error']  - 'error' | 'success' | 'confirm'
 * @param {Object} [options={}]
 *   @param {string}   [options.confirmText='Confirmar']  - Texto del botón de confirmación.
 *   @param {string}   [options.confirmColor='#28a745']   - Color de fondo del botón confirm.
 *   @param {Function} [options.onConfirm=null]           - Callback al pulsar el botón confirm.
 */
function showModal(title, content, type, options) {
    type    = type    || 'error';
    options = options || {};

    var modal      = $('#errorModal');
    var errorList  = $('#errorList');
    var modalTitle = modal.find('h3');

    // --- Botón de confirmación (se crea la primera vez que se necesita) ---
    var btnConfirm = $('#modal-confirm-btn');
    if (btnConfirm.length === 0) {
        $('.modal-content').append('<button id="modal-confirm-btn" type="button"></button>');
        btnConfirm = $('#modal-confirm-btn');
    }
    btnConfirm.hide().off('click');

    // --- Título y clases de tipo ---
    modalTitle.text(title);
    errorList.empty();
    modal.removeClass('modal-success modal-error modal-confirm').addClass('modal-' + type);

    var colors = { success: '#155724', confirm: '#856404', error: '#a94442' };
    modalTitle.css('color', colors[type] || colors.error);

    // --- Botón confirm ---
    if (type === 'confirm') {
        var confirmText  = options.confirmText  || 'Confirmar';
        var confirmColor = options.confirmColor || '#28a745';
        var onConfirm    = options.onConfirm    || null;

        btnConfirm
            .show()
            .text(confirmText)
            .css({
                'background-color': confirmColor,
                'color':            'white',
                'border':           'none',
                'padding':          '10px 20px',
                'margin-top':       '15px',
                'cursor':           'pointer',
                'border-radius':    '4px',
                'width':            '100%'
            });

        btnConfirm.on('click', function () {
            if (onConfirm) onConfirm();
            hideModal();
        });
    }

    // --- Contenido de la lista ---
    if (content === null || content === undefined) {
        // Sin contenido (p.ej. modal de éxito sin detalle)
        errorList.hide();
    } else {
        errorList.show();
        if (Array.isArray(content)) {
            content.forEach(function (item) {
                var li = $('<li>');
                if (typeof item === 'object' && item.campo) {
                    // Formato { campo, problema [, ejemplo] }
                    var html = '<strong>Campo:</strong> ' + item.campo +
                               '<br><strong>Problema:</strong> ' + item.problema;
                    if (item.ejemplo) {
                        html += '<br><strong>Ejemplo:</strong> <em>' + item.ejemplo + '</em>';
                    }
                    li.html(html);
                } else {
                    li.text(item);
                }
                errorList.append(li);
            });
        } else {
            // String simple
            errorList.append($('<li>').text(content));
        }
    }

    modal.css('display', 'flex');

    // Mueve el foco al botón cerrar (accesibilidad)
    modal.find('.close-button').focus();
}

/**
 * Oculta el modal y resetea su estado.
 */
function hideModal() {
    var modal = $('#errorModal');
    modal.hide();
    modal.removeClass('modal-success modal-error modal-confirm');
    $('#modal-confirm-btn').hide();
    $('#errorList').show();
}

// ============================================================
// Eventos globales del modal (se registran una sola vez aquí)
// ============================================================
$(document).ready(function () {
    // Cerrar con el botón ×
    $(document).on('click', '.close-button', function () {
        hideModal();
    });

    // Cerrar al hacer clic en el fondo oscuro
    $(document).on('click', '#errorModal', function (e) {
        if (e.target === this) hideModal();
    });

    // Cerrar con la tecla Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#errorModal').is(':visible')) {
            hideModal();
        }
    });
});
