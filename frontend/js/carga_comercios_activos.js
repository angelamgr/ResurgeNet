// Requiere: jquery, config.js, utils.js
$(document).ready(function () {

    cargarComercios();

    function cargarComercios() {
        $.ajax({
            url:      API_BASE + '/gestion_comercios_activos',
            type:     'GET',
            dataType: 'json',
            success: function (response) {
                var contenedor = $('#contenedor-comercios');
                contenedor.empty();

                if (response.length === 0) {
                    contenedor.append('<p class="lista-vacia">No hay comercios registrados.</p>');
                    return;
                }

                $.each(response, function (i, comercio) {
                    var esActivo         = comercio.estado === 'activo';
                    var esDesactivadoTmp = comercio.estado === 'desactivado tmp';

                    var attrActivar    = esActivo         ? 'disabled class="btn-icon btn-activar btn-disabled"'    : 'class="btn-icon btn-activar"';
                    var attrDesactivar = esDesactivadoTmp ? 'disabled class="btn-icon btn-desactivar btn-disabled"' : 'class="btn-icon btn-desactivar"';

                    var fila =
                        '<div class="comercio-row" data-id="' + comercio.id_usuario + '">' +
                            '<span class="comercio-nombre">' + comercio.nombreComercio + '</span>' +
                            '<div class="acciones">' +
                                '<button ' + attrActivar    + ' title="Activar"><span></span></button>' +
                                '<button ' + attrDesactivar + ' title="Desactivar"><span></span></button>' +
                                '<button class="btn-icon btn-eliminar" title="Eliminar"><span></span></button>' +
                            '</div>' +
                        '</div>';

                    contenedor.append(fila);
                });
            }
        });
    }

    $(document).on('click', '.btn-activar:not(:disabled)', function () {
        var id = $(this).closest('.comercio-row').data('id');
        cambiarEstadoComercio(id, 'activar');
    });

    $(document).on('click', '.btn-desactivar:not(:disabled)', function () {
        var id = $(this).closest('.comercio-row').data('id');
        cambiarEstadoComercio(id, 'desactivar');
    });

    $(document).on('click', '.btn-eliminar', function () {
        var id     = $(this).closest('.comercio-row').data('id');
        var nombre = $(this).closest('.comercio-row').find('.comercio-nombre').text();

        showModal(
            '¿Confirmar eliminación?',
            'Estás a punto de eliminar a "' + nombre + '". Esta acción es irreversible.',
            'confirm',
            {
                confirmText:  'Eliminar permanentemente',
                confirmColor: '#d9534f',
                onConfirm: function () { eliminarComercio(id); }
            }
        );
    });

    function cambiarEstadoComercio(id, accion) {
        var urlFinal = accion === 'activar'
            ? API_BASE + '/estado_activar_comercio/'   + id + '/activar'
            : API_BASE + '/estado_desactivar_comercio/' + id + '/desactivar';

        $.ajax({
            url:  urlFinal,
            type: 'PUT',
            success: function () {
                cargarComercios();
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error)
                    ? xhr.responseJSON.error
                    : 'Error de conexión al cambiar estado';
                showModal('Error', msg);
            }
        });
    }

    function eliminarComercio(id) {
        $.ajax({
            url:  API_BASE + '/eliminar_comercio/' + id,
            type: 'DELETE',
            success: function (response) {
                showModal('Eliminado', response.message || 'Comercio eliminado con éxito', 'success');
                cargarComercios();
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error)
                    ? xhr.responseJSON.error
                    : 'No se pudo eliminar el comercio';
                showModal('Error de eliminación', msg);
            }
        });
    }

});
