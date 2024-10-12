// Frontend - Enviar datos al backend
// Frontend - Enviar datos al backend
const createUserForm = document.getElementById('createUserForm');
createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Función auxiliar para obtener datos de sessionStorage o localStorage
    const getDataFromStorage = (key) => {
        return sessionStorage.getItem(key) || localStorage.getItem(key); // Primero busca en sessionStorage, luego en localStorage
    };

    const userData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        username: document.getElementById('username').value,
        dni: document.getElementById('dni').value,
        password: document.getElementById('password').value,
    };

    // Obtener el token desde el almacenamiento (sessionStorage o localStorage)
    const token = getDataFromStorage('token'); // Asume que el token está guardado con la clave 'token'



    try {
        const response = await fetch('http://localhost:3002/api/users/create-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Incluir el token en los headers
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (response.ok) {
            // Cerrar el modal de creación de usuario
            document.getElementById('userModal').style.display = 'none';

            // Mostrar el modal de éxito
            document.getElementById('successModal').style.display = 'block';

            createUserForm.reset();

            loadUsersRealTime();

        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear el usuario.');
    }
});


// Lógica de los modales

// Obtener elementos del DOM
const modal = document.getElementById('userModal');
const btnCreateUser = document.getElementById('btnCreateUser');
const closeModal = document.querySelector('.close');

// Mostrar el modal cuando se hace clic en el botón "Crear Usuario"
btnCreateUser.addEventListener('click', () => {
    modal.style.display = 'flex'; // Usamos flex para centrarlo
});

// Cerrar el modal cuando se hace clic en el botón de cerrar (X)
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Cerrar el modal si se hace clic fuera del contenido del modal
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// Manejar el cierre del modal de éxito
const successModalCloseBtn = document.getElementById('successModalCloseBtn');
successModalCloseBtn.addEventListener('click', () => {
    document.getElementById('successModal').style.display = 'none';
});


//ver los usuarios en tiempo real
async function loadUsersRealTime() {
    const getDataFromStorage = (key) => {
        return sessionStorage.getItem(key) || localStorage.getItem(key); // Primero busca en sessionStorage, luego en localStorage
    };

    // Eliminar la creación de `userData`, ya que no es necesario para una solicitud GET

    const token = getDataFromStorage('token');
    try {
        const response = await fetch('http://localhost:3002/api/users/get-users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Incluir el token en los headers
            }
            // Elimina la propiedad body porque GET no permite enviar un cuerpo
        });

        const users = await response.json();

        const userTableBody = document.querySelector('.user-table tbody');
        userTableBody.innerHTML = '';

        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', user.id);
            row.innerHTML = `
                <td>${user.firstName}</td>
                <td>${user.lastName}</td>
                <td>${user.user}</td>
                <td>${user.dni}</td>
                <td>${user.password}</td> 
                <td>
                    <div class="actions-container">
                        <button class="actions-btn">●●●</button>
                        <div class="actions-icons" style="display: none;">
                            <button class="btn-action edit-btn" data-id="${user.id}"><img src="../images/editar.png" alt="Editar"></button>
                            <button class="btn-action delete-btn" data-id="${user.id}"><img src="../images/borrar.png" alt="Eliminar"></button>
                            <button class="btn-action history-btn" data-id="${user.id}"><img src="../images/historial.png" alt="Ver Historial"></button>
                        </div>
                    </div>
                </td>
            `;

            
            userTableBody.appendChild(row);
        });

        asignarEventosActionsBtn();

        

    } catch (error) {
        console.error('Error al cargar los usuarios:', error);
    }
}


// Función para asignar eventos a los botones de acción
function asignarEventosActionsBtn() {
    document.querySelectorAll('.actions-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const container = e.currentTarget.parentElement;
            const actionsIcons = container.querySelector('.actions-icons');
            const actionsBtn = container.querySelector('.actions-btn');

            // Alternar visibilidad de iconos de acción
            if (actionsIcons.style.display === 'none' || actionsIcons.style.display === '') {
                document.querySelectorAll('.actions-container').forEach(otherContainer => {
                    if (otherContainer !== container) {
                        otherContainer.querySelector('.actions-icons').style.display = 'none';
                        otherContainer.querySelector('.actions-btn').style.display = 'block';
                    }
                });
                actionsIcons.style.display = 'flex';
                actionsBtn.style.display = 'none';
            } else {
                actionsIcons.style.display = 'none';
                actionsBtn.style.display = 'block';
            }
        });
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            abrirModalEditar(userId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            abrirModalEliminar(userId);
        });
    });

    document.querySelectorAll('.history-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            abrirModalHistorial(userId);
        });
    });
}

window.addEventListener('click', (e) => {
    if (!e.target.closest('.actions-container')) {
        document.querySelectorAll('.actions-icons').forEach(container => container.style.display = 'none');
        document.querySelectorAll('.actions-btn').forEach(button => button.style.display = 'block');
    }
});

document.addEventListener('DOMContentLoaded', () => loadUsersRealTime());


// Renderizar usuarios (para reutilizar en las búsquedas o carga en tiempo real)
function renderUsers(users) {
    const userTableBody = document.querySelector('.user-table tbody');
    userTableBody.innerHTML = ''; // Limpiar la tabla antes de renderizar nuevos datos

    // Verificar si la respuesta contiene un array de usuarios
    if (!Array.isArray(users)) {
        console.error('La respuesta no es un array');
        userTableBody.innerHTML = `<tr><td colspan="7">Error al cargar usuarios.</td></tr>`;
        return;
    }

    // Si no hay usuarios, mostrar un mensaje en la tabla
    if (users.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="7">No se encontraron usuarios</td></tr>`;
        return;
    }

    // Iterar sobre cada usuario y agregarlo a la tabla
    users.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', user.id); // Asignar el ID del usuario a la fila
        row.innerHTML = `
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.user}</td>
            <td>${user.dni}</td>
            <td>${user.password}</td> 
            <td>
                <div class="actions-container">
                    <button class="actions-btn">●●●</button>
                    <div class="actions-icons" style="display: none;">
                        <button class="btn-action edit-btn" data-id="${user.id}"><img src="../images/editar.png" alt="Editar"></button>
                        <button class="btn-action delete-btn" data-id="${user.id}"><img src="../images/borrar.png" alt="Eliminar"></button>
                        <button class="btn-action history-btn" data-id="${user.id}"><img src="../images/historial.png" alt="Ver Historial"></button>
                    </div>
                </div>
            </td>
        `;
        userTableBody.appendChild(row); // Agregar la fila a la tabla
    });

    // Asignar eventos a los botones de acciones después de renderizar
    asignarEventosActionsBtn();
}

// Añadir eventos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadUsersRealTime();
    document.getElementById('searchBtn').addEventListener('click', async () => {
        const searchInput = document.getElementById('searchInput').value.trim();
        if (!searchInput) {
            alert("Por favor, ingrese un valor para buscar.");
            return;
        }

        const getDataFromStorage = (key) => {
            return sessionStorage.getItem(key) || localStorage.getItem(key); // Primero busca en sessionStorage, luego en localStorage
        };

            const token = getDataFromStorage('token');


        try {
            const response = await fetch(`http://localhost:3002/api/users/search?query=${encodeURIComponent(searchInput)}`,{
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Incluir el token en los headers
                }
                // Elimina la propiedad body porque GET no permite enviar un cuerpo
            });
            // Asegúrate de que la respuesta es válida
            if (!response.ok) {
                throw new Error(`Error en la búsqueda: ${response.statusText}`);
            }

            const users = await response.json();
            
            // Verifica que users sea un array
            if (!Array.isArray(users)) {
                throw new TypeError('La respuesta no es un array');
            }

            renderUsers(users);
        } catch (error) {
            console.error('Error al buscar usuarios:', error);
            alert('Ocurrió un error al buscar los usuarios.'); // Mensaje de alerta para el usuario
        }
    });

    document.getElementById('viewAllBtn').addEventListener('click', async () => {
        const getDataFromStorage = (key) => {
            return sessionStorage.getItem(key) || localStorage.getItem(key); // Primero busca en sessionStorage, luego en localStorage
        };

            const token = getDataFromStorage('token');
            const response = await fetch('http://localhost:3002/api/users/get-users',{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Incluir el token en los headers
            }
            // Elimina la propiedad body porque GET no permite enviar un cuerpo
        });
        const users = await response.json();
        renderUsers(users);
    });
});

// Función para cerrar el modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none'; // Ocultar el modal
    }
}

// Función para abrir el modal de edición y cargar los datos del usuario
function abrirModalEditar(userId) {
    const editModal = document.getElementById('editModal');
    if (!userId) {
        console.error('No se puede abrir el modal: userId es indefinido');
        return;
    }

    // Limpiar los campos del formulario antes de cargar los datos
    document.getElementById('editNombre').value = '';
    document.getElementById('editApellido').value = '';
    document.getElementById('editCedula').value = '';
    document.getElementById('editUsername').value = '';
    document.getElementById('editPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    editModal.setAttribute('data-id', userId); // Asignar el ID al modal
    editModal.style.display = 'flex'; // Mostrar el modal
    cargarDatosUsuario(userId); // Cargar los datos del usuario
}


// Cerrar el modal cuando se hace clic fuera de él
window.addEventListener('click', (event) => {
    const editModal = document.getElementById('editModal');
    if (event.target === editModal) {
        cerrarModal('editModal');
    }
});

// Cerrar el modal al presionar el botón de cerrar (X)
document.querySelector('.close').addEventListener('click', () => cerrarModal('editModal'));

// Función para cargar los datos del usuario en el modal de edición
async function cargarDatosUsuario(userId) {

    const getDataFromStorage = (key) => {
        return sessionStorage.getItem(key) || localStorage.getItem(key); // Primero busca en sessionStorage, luego en localStorage
    };

    const token = getDataFromStorage('token');

    try {

        const response = await fetch(`http://localhost:3002/api/users/${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        const user = await response.json();

        if (!response.ok) {
            console.error(`Error al obtener datos del usuario: ${user.message}`);
            return;
        }

        // Insertar los datos del usuario en los campos del formulario
        document.getElementById('editNombre').value = user.firstName || '';
        document.getElementById('editApellido').value = user.lastName || '';
        document.getElementById('editCedula').value = user.dni || '';
        document.getElementById('editUsername').value = user.username || '';
    } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
    }
}

// Función para actualizar los datos del usuario
document.getElementById('btn-success').addEventListener('click', async () => {
    const password = document.getElementById('editPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    const userId = document.getElementById('editModal').getAttribute('data-id');
    const nombre = document.getElementById('editNombre').value.trim();
    const apellido = document.getElementById('editApellido').value.trim();
    const cedula = document.getElementById('editCedula').value.trim();
    const username = document.getElementById('editUsername').value.trim();

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:3002/api/users/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ firstName: nombre, lastName: apellido, dni: cedula, username, password })
        });

        if (response.ok) {
            alert('Usuario actualizado correctamente');
            cerrarModal('editModal');
            loadUsersRealTime();
        } else {
            alert('Error al actualizar el usuario');
        }
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
    }
});

// Añadir el evento de abrir el modal de edición en la tabla de usuarios
document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const userId = e.currentTarget.getAttribute('data-id');
        abrirModalEditar(userId);
    });
});


// Función para abrir el modal de eliminación
function abrirModalEliminar(userId) {
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.style.display = 'flex'; // Asegúrate de que el modal esté visible
    // Asigna el ID del usuario que se va a eliminar
    document.getElementById('btn-delete').setAttribute('data-id', userId);
}

// Eliminar usuario
document.getElementById('btn-delete').addEventListener('click', async () => {
    const userId = document.getElementById('btn-delete').getAttribute('data-id');
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:3002/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Usuario eliminado correctamente');
            cerrarModal('deleteModal'); // Cerrar el modal de eliminación
            loadUsersRealTime(); // Recargar los usuarios después de la eliminación
        } else {
            alert('Error al eliminar el usuario');
        }
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
    }
});

// Añadir el evento de abrir el modal de edición y eliminación en la tabla de usuarios
document.addEventListener('DOMContentLoaded', () => {
    loadUsersRealTime(); // Cargar usuarios
    asignarEventosActionsBtn(); // Asignar eventos a botones de acción
});


async function cargarHistorial(userId) {
    const getDataFromStorage = (key) => sessionStorage.getItem(key) || localStorage.getItem(key);
    const token = getDataFromStorage('token');
    
    console.log('Token obtenido:', token);
    console.log('Intentando cargar el historial del usuario con ID:', userId);
    
    try {
        const response = await fetch(`http://localhost:3002/api/users/historial?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        // Intenta analizar la respuesta como JSON
        let historial;
        try {
            historial = await response.json();
        } catch (parseError) {
            console.error('Error al analizar la respuesta JSON:', parseError);
            const textResponse = await response.text(); // Leer como texto para ver el error
            console.error('Texto de la respuesta:', textResponse);
            return; // Salir de la función si no se puede analizar la respuesta
        }

        console.log('Respuesta de la API:', response);
        console.log('Historial obtenido:', historial);

        if (response.ok) {
            console.log('Respuesta correcta. Procediendo a mostrar el historial en la tabla.');
            mostrarHistorialEnTabla(historial); // Mostrar el historial en la tabla
        } else {
            console.error('Error al cargar el historial:', historial?.message || 'No se proporcionó un mensaje de error.');
        }
    } catch (error) {
        console.error('Error al cargar el historial:', error);
    }
}

function abrirModalHistorial(userId) {
    const historyModal = document.getElementById('historyModal');
    if (historyModal) {
        console.log('Abriendo modal de historial.');
        historyModal.style.display = 'flex'; // Muestra el modal (usa 'flex' para centrarlo)

        // Cargar el historial al abrir el modal
        cargarHistorial(userId);
    } else {
        console.error('No se encontró el modal de historial.');
    }
}

function mostrarHistorialEnTabla(historial) {
    console.log('Mostrando historial en la tabla:', historial);
    const tableBody = document.querySelector('#resultados-table tbody');
    
    if (!tableBody) {
        console.error('No se encontró el cuerpo de la tabla.');
        return;
    }

    tableBody.innerHTML = ''; // Limpiar la tabla

    historial.forEach(registro => {
        console.log('Procesando registro:', registro);

        const fechaYHora = new Date(registro.fechaYHora.seconds * 1000); // Convertir el timestamp a un objeto Date
        const fechaFormateada = fechaYHora.toLocaleDateString(); // Obtener solo la fecha
        const horaFormateada = fechaYHora.toLocaleTimeString(); // Obtener solo la hora

        console.log(`Registro convertido: Fecha - ${fechaFormateada}, Hora - ${horaFormateada}`);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${registro.nombre}</td>
            <td>${registro.apellidos}</td>
            <td>${registro.edad}</td>
            <td>${registro.afectaciones}</td>
            <td>${registro.presionSistolica}</td>
            <td>${registro.presionDiastolica}</td>
            <td>${fechaFormateada} ${horaFormateada}</td>
        `;
        tableBody.appendChild(row);
        console.log('Fila añadida a la tabla.');
    });
}

function exportToExcel() {
    const table = document.getElementById('resultados-table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Historial" });
    XLSX.writeFile(wb, 'historial_usuario.xlsx');
}

document.querySelectorAll('.btn-cancel').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        const modal = closeBtn.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
});

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        const modal = closeBtn.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
});

window.addEventListener('click', (event) => {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});





