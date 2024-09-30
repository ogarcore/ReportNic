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


// Obtener el botón de cerrar sesión
const logoutButton = document.getElementById('logout');

// Función para cerrar sesión
logoutButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace

    // Limpiar el localStorage
    localStorage.clear();

    // Redirigir al index.html
    window.location.href = '../html/index.html';
});

