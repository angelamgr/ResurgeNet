$(document).ready(function () {
    cargarProductosComercio();

    function cargarProductosComercio() {

    const id_comercio = localStorage.getItem('id_usuario'); 

    if (!id_comercio) {
        console.error("No hay id_comercio");
        return;
    }

    $.ajax({
        url: `http://localhost:8080/api/listado_productos_comercio/${id_comercio}`,
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                const contenedor = $('#contenedor-comercios');
                contenedor.empty();

                if (response.length === 0) {
                    contenedor.append('<p style="text-align:center; padding:20px;">No hay productos.</p>');
                    return;
                }

                response.forEach(producto => {
                    const fila = `
                    <div class="comercio-row" data-id="${producto.id_producto}">
                        <span class="comercio-nombre">${producto.nombre}</span>

                        <div class="acciones">
                            <button class="btn-icon btn-editar" title="Editar">
                                <span></span>
                            </button>
                        </div>
                    </div>`;
                    
                    contenedor.append(fila);
                });
            },
            error: function (err) {
                console.error(err);
            }
        });
    }

    // --- Evento para editar el comercio, nos enlaza con la pagina de edición del producto ---
   $(document).on('click', '.btn-editar:not(:disabled)', function () { 
        const id = $(this).closest('.comercio-row').data('id'); 
        
        window.location.href = `actualizar_producto.html?id=${id}`;
    });
});

