document.addEventListener('DOMContentLoaded', function() {

    const coordenadasManagua = [12.126970, -86.303542]; 

    const map = L.map('map').setView(coordenadasManagua, 13); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker(coordenadasManagua).addTo(map)
        .bindPopup(' Managua, Nicaragua.')
        .openPopup();
});

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

function exportToCSV() {
    // Función para exportar a CSV
    alert("Exportando a CSV...");
}

function exportToPDF() {
    // Función para exportar a PDF
    alert("Exportando a PDF...");
}



