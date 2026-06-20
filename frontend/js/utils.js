/**
 * Muestra el modal de mensajes reutilizable.
 *
 * @param {string}            title
 * @param {string|Array|null} content  string | Array de {campo, problema[, ejemplo]} | null
 * @param {string}            [type='error']  'error' | 'success' | 'confirm'
 * @param {Object}            [options={}]    confirmText, confirmColor, onConfirm
 */
function showModal(title, content, type, options) {
    type    = type    || 'error';
    options = options || {};

    var modal      = $('#errorModal');
    var errorList  = $('#errorList');
    var modalTitle = modal.find('h3');

    var btnConfirm = $('#modal-confirm-btn');
    if (btnConfirm.length === 0) {
        $('.modal-content').append('<button id="modal-confirm-btn" type="button"></button>');
        btnConfirm = $('#modal-confirm-btn');
    }
    btnConfirm.hide().off('click');

    modalTitle.text(title);
    errorList.empty();
    modal.removeClass('modal-success modal-error modal-confirm').addClass('modal-' + type);

    if (type === 'confirm') {
        var confirmText  = options.confirmText  || 'Confirmar';
        var confirmColor = options.confirmColor || '#28a745';
        var onConfirm    = options.onConfirm    || null;
        // background-color es dinamico segun la accion; el resto lo gestiona components.css
        btnConfirm.show().text(confirmText).css('background-color', confirmColor);
        btnConfirm.on('click', function () {
            if (onConfirm) onConfirm();
            hideModal();
        });
    }

    if (content === null || content === undefined) {
        errorList.hide();
    } else {
        errorList.show();
        if (Array.isArray(content)) {
            content.forEach(function (item) {
                var li = $('<li>');
                if (typeof item === 'object' && item.campo) {
                    var html = '<strong>Campo:</strong> ' + item.campo +
                               '<br><strong>Problema:</strong> ' + item.problema;
                    if (item.ejemplo) html += '<br><strong>Ejemplo:</strong> <em>' + item.ejemplo + '</em>';
                    li.html(html);
                } else {
                    li.text(item);
                }
                errorList.append(li);
            });
        } else {
            errorList.append($('<li>').text(content));
        }
    }

    modal.css('display', 'flex');
    modal.find('.close-button').focus();
}

/** Oculta el modal y resetea su estado. */
function hideModal() {
    var modal = $('#errorModal');
    modal.hide();
    modal.removeClass('modal-success modal-error modal-confirm');
    $('#modal-confirm-btn').hide();
    $('#errorList').show();
}

/** Marca un input como invalido (borde rojo). */
function inputError($input) { $input.removeClass('input-ok').addClass('input-error'); }

/** Marca un input como valido (borde gris). */
function inputOk($input) { $input.removeClass('input-error').addClass('input-ok'); }

// Cierre del modal: boton x, clic en fondo, tecla Escape.
$(document).ready(function () {
    $(document).on('click', '.close-button', function () { hideModal(); });
    $(document).on('click', '#errorModal', function (e) { if (e.target === this) hideModal(); });
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#errorModal').is(':visible')) hideModal();
    });
});
