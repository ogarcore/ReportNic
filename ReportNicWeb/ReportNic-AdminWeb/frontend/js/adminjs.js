
document.addEventListener('DOMContentLoaded', function () {
    const elements = document.querySelectorAll('.fade-in-left'); // Solo seleccionar imágenes y textos

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible'); // Añadir clase cuando está en pantalla
            } else {
                entry.target.classList.remove('visible'); // Quitar clase cuando está fuera de pantalla
            }
        });
    }, { threshold: 0.1 }); // Umbral de intersección (10% del elemento visible)

    elements.forEach(element => {
        observer.observe(element); // Observar cada imagen y texto
    });
});


