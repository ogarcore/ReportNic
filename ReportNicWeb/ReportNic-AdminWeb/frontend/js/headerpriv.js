document.addEventListener("DOMContentLoaded", function() {
    const profileMenu = document.getElementById("profileMenu");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const headerMenu = document.querySelector(".header-menu ul");

    // Guardamos los enlaces del perfil, contacto y cerrar sesión
    const contactanosLink = dropdownMenu.querySelector('a[href="contactanospriv.html"]');
    const cerrarSesionLink = dropdownMenu.querySelector('a[href="index.html"]');

    profileMenu.addEventListener("click", function(e) {
        e.stopPropagation();
        profileMenu.classList.toggle("active");
    });

    document.addEventListener("click", function(e) {
        if (!profileMenu.contains(e.target)) {
            profileMenu.classList.remove("active");
        }
    });

    // Mover los elementos del menú principal al dropdown y asegurarse de que estén al principio
    function handleScreenResize() {
        if (window.innerWidth <= 768) {
            while (headerMenu.firstChild) {
                dropdownMenu.insertBefore(headerMenu.firstChild, contactanosLink); // Insertar antes del perfil
            }
        } else {
            // Mover los elementos de vuelta a la cabecera cuando la pantalla es grande
            while (dropdownMenu.firstChild && dropdownMenu.firstChild !== contactanosLink) {
                headerMenu.appendChild(dropdownMenu.firstChild);
            }
        }
    }

    window.addEventListener("resize", handleScreenResize);
    handleScreenResize();
});

const logoutButton = document.getElementById('logout');

// Función para cerrar sesión
logoutButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace

    // Limpiar el localStorage
    localStorage.clear();
    sessionStorage.clear();

    // Redirigir al index.html
    window.location.href = '../html/index.html';
});