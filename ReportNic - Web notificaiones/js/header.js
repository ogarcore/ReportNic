
document.addEventListener("DOMContentLoaded", function() {
    const profileMenu = document.getElementById("profileMenu");
    const dropdownMenu = document.getElementById("dropdownMenu");

    profileMenu.addEventListener("click", function(e) {
        e.stopPropagation();
        profileMenu.classList.toggle("active");
    });

    document.addEventListener("click", function(e) {
        if (!profileMenu.contains(e.target)) {
            profileMenu.classList.remove("active");
        }
    });
});

function iniciarSesion(usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
}

// Recuperar los datos de usuario
function obtenerUsuario() {
    return JSON.parse(localStorage.getItem('usuario'));
}

// Cerrar sesión y redirigir al login
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('userNotifications'); // Limpiar notificaciones del usuario si lo deseas
    window.location.href = 'index.html'; // Redirigir a la página de inicio de sesión
});


