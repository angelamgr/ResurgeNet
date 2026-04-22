// Maneja el evento de 'pageshow', que se dispara cuando se navega usando el historial
// (botón 'atrás/adelante') o cuando se carga la página desde la caché (persisted).
window.addEventListener('pageshow', function (event) {
    // Comprobamos si la página se está cargando desde la caché del navegador.
    if (event.persisted) {
        // Si se cargó desde la caché, verificamos la sesión en el servidor.
        fetch('http://localhost:8080/api/checkUserSession', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                // Si la sesión NO está activa, redirigimos.
                if (!data.active) {
                    // Usamos replace() aquí también para evitar un ciclo en el historial
                    window.location.replace('index.html');
                }
            })
            // Manejo básico de errores de red o servidor
            .catch(() => {
                // Asumimos que si hay error de conexión, es mejor cerrar la sesión.
                window.location.replace('index.html');
            });
    }
});