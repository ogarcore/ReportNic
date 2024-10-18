// Definir getDataFromStorage fuera del DOMContentLoaded para que esté disponible globalmente
const getDataFromStorage = (key) => {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
};

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('table-body');

    const token = getDataFromStorage('token');

    // Decodificar token para extraer el hospital
    const decodeToken = (token) => {
        const payloadBase64 = token.split('.')[1];
        return JSON.parse(atob(payloadBase64));
    };

    const { hospital } = decodeToken(token);

    // Limpiar la tabla
    const clearTable = () => {
        tableBody.innerHTML = '';
    };

    // Obtener las suscripciones desde Firebase filtrando por hospital
    const fetchSubscriptions = async () => {
        try {
            const response = await fetch('http://localhost:3002/api/suscripcion/suscripciones', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            const results = await response.json();
            console.log('Suscripciones recibidas:', results);

            clearTable();

            if (response.ok) {
                if (results.length > 0) {
                    results.forEach(suscripciones => {
                        const row = document.createElement('tr');

                        const fechaInicio = new Date(suscripciones.fechaInicio._seconds * 1000);
                        const fechaFinal = new Date(suscripciones.fechaFinal._seconds * 1000);

                        row.innerHTML = `
                            <td>${suscripciones.id}</td>
                            <td>${suscripciones.plan}</td>
                            <td>${fechaInicio.toLocaleDateString()}</td>
                            <td>${fechaFinal.toLocaleDateString()}</td>
                            <td>${suscripciones.Renovacion}</td>
                            <td>${suscripciones.metodoPago}</td>
                            <td>
                                <div class="action-menu">
                                    <button class="action-btn-menu">...</button>
                                    <div class="actions" style="display: none;">
                                        <button class="action-btn renovar">Renovar</button>
                                        <button class="action-btn cancelar" data-id="${suscripciones.id}">Cancelar Suscripción</button>
                                        <button class="action-btn cambiar">Cambiar de Plan</button>
                                    </div>
                                </div>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    tableBody.innerHTML = '<tr><td colspan="7">No se encontraron suscripciones.</td></tr>';
                }
            } else {
                alert('Error al obtener las suscripciones: ' + results.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al obtener las suscripciones.');
        }
    };

    fetchSubscriptions();
});

// Evento para manejar el menú de acciones
document.addEventListener('click', (event) => {
    const actionMenus = document.querySelectorAll('.action-menu');
    actionMenus.forEach(menu => {
        const btnMenu = menu.querySelector('.action-btn-menu');
        const actions = menu.querySelector('.actions');

        if (btnMenu.contains(event.target)) {
            actions.style.display = 'block';
            btnMenu.style.display = 'none';
        } else if (!menu.contains(event.target)) {
            actions.style.display = 'none';
            btnMenu.style.display = 'block';
        }
    });
});

// Evento para abrir el modal de confirmación de cancelación
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('cancelar')) {
        const suscripcionId = event.target.getAttribute('data-id');
        document.getElementById('cancelModal').style.display = 'block';
        // Guardar el ID en un atributo data para usarlo después
        document.getElementById('confirmCancel').setAttribute('data-id', suscripcionId);
    }
});

// Evento para cerrar el modal al cancelar la acción
document.getElementById('cancelAction').addEventListener('click', () => {
    document.getElementById('cancelModal').style.display = 'none';
});

// Evento para cerrar el modal al hacer clic en la 'X'
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('cancelModal').style.display = 'none';
});

// Evento para confirmar la cancelación
document.getElementById('confirmCancel').addEventListener('click', async () => {
    const suscripcionId = document.getElementById('confirmCancel').getAttribute('data-id');
    await cancelarSuscripcion(suscripcionId);
});

// Redireccionar para renovar suscripción
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('renovar')) {
        window.location.href = 'metodopago.html';
    }
});

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('cambiar')) {
        window.location.href = 'membresias.html';  // Redirigir a membresias.html para cambiar el plan
    }
});

// Función para cancelar suscripción
async function cancelarSuscripcion(id) {
    const token = getDataFromStorage('token');

    try {
        const response = await fetch(`http://localhost:3002/api/suscripcion/suscripcion/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        const result = await response.json();

        if (response.ok) {
            // Redirigir a index.html
            window.location.href = 'index.html';
        } else {
            alert('Error al cancelar la suscripción: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al cancelar la suscripción.');
    }
}
