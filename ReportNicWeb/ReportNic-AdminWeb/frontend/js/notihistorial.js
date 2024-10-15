document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('table.styled-table tbody');
    const searchBtn = document.getElementById('search-btn'); 
    const viewAllBtn = document.getElementById('view-all-btn');
    const searchNameInput = document.getElementById('search-name');
    const searchLastnameInput = document.getElementById('search-lastname');
    const searchDateInput = document.getElementById('search-date');

    const getDataFromStorage = (key) => {
        return sessionStorage.getItem(key) || localStorage.getItem(key);
    };

    const token = getDataFromStorage('token');

    // Función para limpiar la tabla antes de añadir nuevos datos
    const clearTable = () => {
        tableBody.innerHTML = ''; // Esto evitará que se agreguen duplicados
    };

    // Función para limpiar los inputs
    const clearInputs = () => {
        searchNameInput.value = '';
        searchLastnameInput.value = '';
        searchDateInput.value = '';
    };

    // Función para realizar la búsqueda y mostrar los datos
    const fetchData = async (searchParams = {}) => {
        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`http://localhost:3002/api/historial/historial?${queryString}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            const results = await response.json();

            // Limpiar la tabla antes de llenarla de nuevo
            clearTable();

            if (response.ok) {
                if (results.length > 0) {
                    results.forEach(result => {
                        const row = document.createElement('tr');

                        if (result.fechaYHora && result.fechaYHora._seconds) {
                            const dateTime = new Date(result.fechaYHora._seconds * 1000); 
                            const formattedDateTime = `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;

                            row.innerHTML = `
                                <td>${result.nombre}</td>
                                <td>${result.apellidos}</td>
                                <td>${result.edad}</td>
                                <td>${result.afectaciones}</td>
                                <td>${result.presionSistolica}</td>
                                <td>${result.presionDiastolica}</td>
                                <td>${formattedDateTime}</td>
                                <td>${result.usuario}</td>
                            `;
                        } else {
                            row.innerHTML = `
                                <td>${result.nombre}</td>
                                <td>${result.apellidos}</td>
                                <td>${result.edad}</td>
                                <td>${result.afectaciones}</td>
                                <td>${result.presionSistolica}</td>
                                <td>${result.presionDiastolica}</td>
                                <td>Fecha no disponible</td>
                                <td>${result.usuario}</td>
                            `;
                        }

                        tableBody.appendChild(row);
                    });
                } else {
                    tableBody.innerHTML = `<tr><td colspan="8">No se encontraron datos.</td></tr>`;
                }
            } else {
                alert('Error fetching data: ' + results.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching data.');
        }
    };

    // Evento para el botón de búsqueda
    searchBtn.addEventListener('click', () => {
        const searchParams = {
            searchName: searchNameInput.value.trim(),
            searchLastname: searchLastnameInput.value.trim(),
            searchDate: searchDateInput.value,
        };

        // Llamar a la función de búsqueda
        fetchData(searchParams);


    });

    // Evento para el botón de ver todos
    viewAllBtn.addEventListener('click', () => {
        fetchData(); // Mostrar todos los datos

        // Limpiar los inputs cuando se selecciona "Ver todos"
        clearInputs(); 
    });

    // Cargar todos los datos al inicio
    fetchData();
});
