let isProcessing = false;

// Función para generar y guardar el código
async function generarYGuardarCodigo() {
    if (isProcessing) return;

    isProcessing = true;
    toggleButtonState(true);

    const codigo = generarCodigoAleatorio();

    try {
        const response = await fetch('http://localhost:3001/api/users/generarCodigo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo }),
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('codigoModalContent').innerText = data.codigo;
            document.getElementById('codigoModal').style.display = 'block';
        } else {
            document.getElementById('resultado').innerText = 'Error al guardar el código.';
        }
    } catch (error) {
        document.getElementById('resultado').innerText = 'Error al guardar el código.';
    } finally {
        isProcessing = false;
        toggleButtonState(false);
    }
}

function toggleButtonState(isDisabled) {
    const button = document.getElementById('generarCodigoBtn');
    button.disabled = isDisabled; // Deshabilita el botón cuando se está procesando
}

function generarCodigoAleatorio() {
    const codigo = Math.random().toString(36).substring(2, 10); // Genera un código alfanumérico
    return codigo;
}

// Cargar usuarios en tiempo real
async function loadUsersRealTime() {
    try {
        const response = await fetch('http://localhost:3001/api/users');
        const users = await response.json();

        const userTableBody = document.querySelector('.user-table tbody');
        userTableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', user.id);
            row.innerHTML = `
                <td>${user.nombre}</td>
                <td>${user.apellido}</td>
                <td>${user.cedula}</td>
                <td>${user.telefono}</td>
                <td>${user.email}</td>
                <td>${user.contraseña}</td>
                <td>
                    <div class="actions-container">
                        <button class="actions-btn">●●●</button>
                        <div class="actions-icons" style="display: none;">
                            <button class="btn-action edit-btn" data-id="${user.id}"><img src="../images/editar.png" alt="Editar"></button>
                            <button class="btn-action delete-btn" data-id="${user.id}"><img src="../images/borrar.png" alt="Eliminar"></button>
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

            // Si el menú de acciones está oculto, mostrarlo y ocultar el botón
            if (actionsIcons.style.display === 'none' || actionsIcons.style.display === '') {
                // Cerrar otros menús de acciones abiertos
                document.querySelectorAll('.actions-container').forEach(otherContainer => {
                    if (otherContainer !== container) {
                        otherContainer.querySelector('.actions-icons').style.display = 'none';
                        otherContainer.querySelector('.actions-btn').style.display = 'block'; // Mostrar de nuevo el botón
                    }
                });
                actionsIcons.style.display = 'flex'; // Mostrar los iconos de acción
                actionsBtn.style.display = 'none'; // Ocultar el botón de tres puntos
            } else {
                actionsIcons.style.display = 'none'; // Ocultar los iconos de acción
                actionsBtn.style.display = 'block'; // Mostrar de nuevo el botón de tres puntos
            }
        });
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            abrirModalEditar(userId);  // Abre el modal de edición
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            abrirModalEliminar(userId);  // Abre el modal de eliminación
        });
    });
}

// Cerrar el menú de acciones al hacer clic fuera de él
window.addEventListener('click', (e) => {
    if (!e.target.closest('.actions-container')) {
        document.querySelectorAll('.actions-icons').forEach(container => {
            container.style.display = 'none'; // Ocultar los iconos de acción
        });
        document.querySelectorAll('.actions-btn').forEach(button => {
            button.style.display = 'block'; // Mostrar de nuevo el botón de tres puntos
        });
    }
});

// Añadir eventos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadUsersRealTime();
    document.getElementById('generarCodigoBtn').addEventListener('click', generarYGuardarCodigo);
    document.getElementById('searchBtn').addEventListener('click', async () => {
        const searchInput = document.getElementById('searchInput').value.trim();
        if (!searchInput) {
            alert("Por favor, ingrese un valor para buscar.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/users/search?query=${encodeURIComponent(searchInput)}`);
            
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
        const response = await fetch('http://localhost:3001/api/users');
        const users = await response.json();
        renderUsers(users);
    });

    document.querySelector('.closebtn').addEventListener('click', () => cerrarModal('codigoModal'));

    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('codigoModal')) {
            cerrarModal('codigoModal');
        }
    });
});

// Renderizar usuarios (para reutilizar en las búsquedas)
function renderUsers(users) {
    const userTableBody = document.querySelector('.user-table tbody');
    userTableBody.innerHTML = '';

    // Verifica que users sea un array
    if (!Array.isArray(users)) {
        console.error('La respuesta no es un array');
        userTableBody.innerHTML = `<tr><td colspan="7">Error al cargar usuarios.</td></tr>`;
        return;
    }

    if (users.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="7">No se encontraron usuarios</td></tr>`;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', user.id);
        row.innerHTML = `
            <td>${user.nombre}</td>
            <td>${user.apellido}</td>
            <td>${user.cedula}</td>
            <td>${user.telefono}</td>
            <td>${user.email}</td>
            <td>${user.contraseña}</td>
            <td>
                <div class="actions-container">
                    <button class="actions-btn">●●●</button>
                    <div class="actions-icons" style="display: none;">
                        <button class="btn-action edit-btn" data-id="${user.id}"><img src="../images/editar.png" alt="Editar"></button>
                        <button class="btn-action delete-btn" data-id="${user.id}"><img src="../images/borrar.png" alt="Eliminar"></button>
                    </div>
                </div>
            </td>
        `;
        userTableBody.appendChild(row);
    });

    asignarEventosActionsBtn(); // Asignar eventos a los botones después de renderizar
}

// Función para cerrar el modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none'; // Ocultar el modal
    }
}

function abrirModalEditar(userId) {
    const editModal = document.getElementById('editModal');
    if (!userId) {
        console.error('No se puede abrir el modal: userId es indefinido');
        return; // No intentes abrir el modal si el ID no es válido
    }

    // Limpiar los campos del formulario antes de cargar los datos
    document.getElementById('editNombre').value = '';
    document.getElementById('editApellido').value = '';
    document.getElementById('editCedula').value = '';
    document.getElementById('editTelefono').value = '';
    document.getElementById('editCorreo').value = '';

    editModal.setAttribute('data-id', userId); // Asignar el ID al modal
    editModal.style.display = 'flex'; // Asegúrate de usar 'flex' aquí
    cargarDatosUsuario(userId); // Cargar los datos del usuario
}

// Cerrar el modal cuando se hace clic fuera de él
window.addEventListener('click', (event) => {
    const editModal = document.getElementById('editModal');
    if (event.target === editModal) {
        cerrarModal('editModal'); // Asegúrate de pasar el ID correcto
    }
});

// Cerrar el modal de edición al presionar el botón "X"
document.querySelector('.close').addEventListener('click', () => cerrarModal('editModal'));

// Función para cargar los datos del usuario en el modal de edición
async function cargarDatosUsuario(userId) {
    console.log(`Cargando datos para el usuario con ID: ${userId}`); // Verificar el ID aquí
    try {
        const response = await fetch(`http://localhost:3001/api/users/${encodeURIComponent(userId)}`);
        const user = await response.json();
        
        if (!response.ok) {
            console.error(`Error al obtener datos del usuario: ${user.mensaje}`);
            return;
        }

        // Insertar los datos del usuario en los campos de edición
        document.getElementById('editNombre').value = user.nombre || '';
        document.getElementById('editApellido').value = user.apellido || '';
        document.getElementById('editCedula').value = user.cedula || '';
        document.getElementById('editTelefono').value = user.telefono || '';
        document.getElementById('editCorreo').value = user.email || '';
    } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
    }
}


// Actualizar datos de usuario
document.getElementById('btn-succes').addEventListener('click', async () => {
    const password = document.getElementById('editPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    // Procede con la actualización si las contraseñas coinciden
    const userId = document.getElementById('editModal').getAttribute('data-id'); // Obtener el ID del modal
    const nombre = document.getElementById('editNombre').value.trim();
    const apellido = document.getElementById('editApellido').value.trim();
    const cedula = document.getElementById('editCedula').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    const correo = document.getElementById('editCorreo').value.trim();

    try {
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, apellido, cedula, telefono, email: correo, contraseña: password })
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

function abrirModalEliminar(userId) {
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.style.display = 'flex'; // Asegúrate de que el modal esté visible
    // Asigna el ID del usuario que se va a eliminar
    document.getElementById('btn-delete').setAttribute('data-id', userId);
}

// Eliminar usuario
document.getElementById('btn-delete').addEventListener('click', async () => {
    const userId = document.getElementById('btn-delete').getAttribute('data-id');

    try {
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Usuario eliminado correctamente');
            cerrarModal('deleteModal'); // Cerrar modal de eliminación
            loadUsersRealTime(); // Recargar los usuarios después de la eliminación
        } else {
            alert('Error al eliminar el usuario');
        }
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
    }
});

// Asignar eventos a los botones de editar y eliminar
document.addEventListener('DOMContentLoaded', () => {
    loadUsersRealTime(); // Cargar usuarios
    asignarEventosActionsBtn(); // Asignar eventos a botones de acción
});
