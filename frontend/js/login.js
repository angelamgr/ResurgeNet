$('#loginForm').submit(function(e) {
    e.preventDefault(); // evita que la página se recargue

    $.ajax({
        url: 'http://localhost:8080/api/loginUser',
        type: 'POST',
        xhrFields: { withCredentials: true }, // enviar cookies
        data: {
            usuario: $('input[name="usuario"]').val(),
            password: $('input[name="password"]').val()
        },
        success: function(response) {
            alert(response.message);
            window.location.href = response.redirect; // redirige al dashboard correspondiente
        },
        error: function(xhr) {
            let msg = (xhr.responseJSON && xhr.responseJSON.message) 
                      ? xhr.responseJSON.message 
                      : 'Error al iniciar sesión';
            alert(msg);
        }
    });
});
