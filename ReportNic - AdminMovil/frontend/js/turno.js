document.addEventListener('DOMContentLoaded', () => {
    fetchTurnos();
});

async function fetchTurnos() {
    try {
        const response = await fetch('http://localhost:3001/api/turnos');
        const turnos = await response.json();

        const tbody = document.querySelector('.user-table tbody');
        tbody.innerHTML = ''; // Limpiar tabla antes de agregar nuevos datos

        turnos.forEach(turno => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${turno.IdParamedico}</td>
                <td>${turno.Nombre}</td>
                <td>${turno.Apellido}</td>
                <td>${turno.UnidadAmbulancia}</td>
                <td>${turno.InicioTurno}</td>
                <td>${turno.FinalTurno}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar los turnos:', error);
    }
}