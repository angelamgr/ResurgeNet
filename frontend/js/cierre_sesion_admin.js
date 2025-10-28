$('#logout-btn').click(function() {
    $.ajax({
        url: 'http://localhost:8080/api/logoutUser',
        type: 'POST',
        xhrFields: {
            withCredentials: true // para enviar cookies
        },
        success: function(response) {
            alert(response.message); // Sesión cerrada
            window.location.href = 'index.html'; // Redirige al login
        },
        error: function(xhr) {
            let msg = (xhr.responseJSON && xhr.responseJSON.message) 
                        ? xhr.responseJSON.message 
                        : 'Error al cerrar sesión';
            alert(msg);
        }
    });
});
