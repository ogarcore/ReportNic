import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, onSnapshot, setDoc, doc, addDoc, orderBy, query, where,serverTimestamp, deleteDoc} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB07sR2b1NMI0lvJUYa6hHHDfAqIdhb5hI",
    authDomain: "reportnicdb.firebaseapp.com",
    projectId: "reportnicdb",
    storageBucket: "reportnicdb.appspot.com",
    messagingSenderId: "361642844511",
    appId: "1:361642844511:web:0134bcb94209b1c65116ea",
    measurementId: "G-7Z3Y1M2MP6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);


let isProcessing = false;

//crear un codigo aleatorio
// Función para generar un código aleatorio
        function generarCodigoAleatorio() {
            const codigo = Math.random().toString(36).substring(2, 10); // Genera un código alfanumérico
            console.log('Código generado:', codigo);
            return codigo;
        }

        // Función para deshabilitar o habilitar el botón
        function toggleButtonState(disabled) {
            document.getElementById('generarCodigoBtn').disabled = disabled;
        }

        // Función para guardar el código en Firestore
        async function guardarCodigoEnFirestore(codigo) {
            try {
                await addDoc(collection(db, 'codigos'), {
                    codigo: codigo,
                    valido: true,
                    timestamp: serverTimestamp()
                });
                console.log("Código guardado en Firestore:", codigo);
                // Mostrar el código en el modal
                document.getElementById('codigoModalContent').innerText = codigo;
                document.getElementById('codigoModal').style.display = "block";
            } catch (error) {
                console.error("Error al guardar el código:", error);

                // Implementación del manejo de la excepción
                if (error.code === 'cancelled') {
                    document.getElementById('resultado').innerText = "Operación cancelada. Intenta de nuevo.";
                } else {
                    document.getElementById('resultado').innerText = "Error al guardar el código. " + error.message;
                }
            }
        }

        async function generarYGuardarCodigo() {
            if (isProcessing) {
                return; // No hacer nada si ya está en proceso
            }

            isProcessing = true; // Marcar que está procesando
            toggleButtonState(true); // Deshabilita el botón

            const codigo = generarCodigoAleatorio();

            try {
                await guardarCodigoEnFirestore(codigo); // Espera a que Firestore termine
            } catch (error) {
                console.error("Error en la función principal:", error);
                document.getElementById('resultado').innerText = "Error al procesar el código.";
            } finally {
                isProcessing = false; // Marcar que terminó el procesamiento
                toggleButtonState(false); // Habilitar el botón cuando termine
            }
        }

        // Cerrar el modal
        function cerrarModal() {
            document.getElementById('codigoModal').style.display = "none";
            location.reload(); // Recargar la página
        }

        // Escucha el evento click del botón
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('generarCodigoBtn').addEventListener('click', generarYGuardarCodigo);

            // Agregar evento al botón de cerrar el modal
            document.querySelector('.closebtn').addEventListener('click', cerrarModal);

            // Cerrar el modal si se hace clic fuera del modal
            window.addEventListener('click', (event) => {
                if (event.target == document.getElementById('codigoModal')) {
                    cerrarModal();
                }
            });
        });



    //vista en la tabla de usuarios activos

// Función para cargar usuarios en tiempo real
function loadUsersRealTime() {
    const userTableBody = document.querySelector('.user-table tbody');

    // Referencia a la colección 'usuarios_moviles'
    const usersCollection = collection(db, 'usuarios_moviles');

    // Consulta para ordenar usuarios por 'createdAt' de manera descendente (los más recientes primero)
    const q = query(usersCollection, orderBy('Fecha de Creacion', 'desc'));

    // Escuchar los cambios en la colección en tiempo real
    onSnapshot(q, (snapshot) => {
        userTableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

        // Recorrer los documentos en la colección
        snapshot.forEach((doc) => {
            const userData = doc.data();

            // Crear una fila para cada usuario
            const row = document.createElement('tr');

            row.setAttribute('data-id', doc.id);
            // Agregar las celdas con los datos del usuario
            row.innerHTML = `
                <td>${userData.nombre}</td>
                <td>${userData.apellido}</td>
                <td>${userData.cedula}</td>
                <td>${userData.telefono}</td>
                <td>${userData.email}</td>
                <td>${userData.contraseña}</td>
                <td>
                    <div class="actions-container">
                        <button class="actions-btn">●●●</button>
                        <div class="actions-icons">
                            <button class="btn-action" data-modal="editModal"><img src="../images/editar.png" alt="Editar"></button>
                            <button class="btn-action" data-modal="deleteModal"><img src="../images/borrar.png" alt="Eliminar"></button>
                        </div>
                    </div>
                </td>
            `;

            // Agregar la fila a la tabla
            userTableBody.appendChild(row);
        });
    });
}
// Llamar a la función para cargar los usuarios en tiempo real cuando se cargue la página
window.addEventListener('DOMContentLoaded', loadUsersRealTime);


// Buscar
// Escuchar el evento del botón 'Buscar'
document.getElementById('searchBtn').addEventListener('click', async () => {
    const searchInput = document.getElementById('searchInput'); // Referencia al input de búsqueda
    const searchValue = searchInput.value.trim();
    const userTableBody = document.querySelector('.user-table tbody');
    userTableBody.innerHTML = ''; // Limpiar la tabla antes de mostrar resultados

    if (!searchValue) {
        alert("Por favor, ingrese un valor para buscar.");
        return;
    }

    const usersCollection = collection(db, 'usuarios_moviles');
    let foundUsers = [];

    // Crear consultas individuales
    const qNombre = query(usersCollection, where('nombre', '==', searchValue));
    const qApellido = query(usersCollection, where('apellido', '==', searchValue));
    const qCedula = query(usersCollection, where('cedula', '==', searchValue));
    const qCorreo = query(usersCollection, where('email', '==', searchValue));

    const [nombreSnapshot, apellidoSnapshot, cedulaSnapshot, correoSnapshot] = await Promise.all([
        getDocs(qNombre),
        getDocs(qApellido),
        getDocs(qCedula),
        getDocs(qCorreo)
    ]);

    nombreSnapshot.forEach((doc) => foundUsers.push({ id: doc.id, ...doc.data() }));
    apellidoSnapshot.forEach((doc) => foundUsers.push({ id: doc.id, ...doc.data() }));
    cedulaSnapshot.forEach((doc) => foundUsers.push({ id: doc.id, ...doc.data() }));
    correoSnapshot.forEach((doc) => foundUsers.push({ id: doc.id, ...doc.data() }));

    // Eliminar duplicados por cédula
    foundUsers = foundUsers.filter((user, index, self) =>
        index === self.findIndex((u) => u.cedula === user.cedula)
    );

    if (foundUsers.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="7">No se encontraron coincidencias</td></tr>`;
        return;
    }

    // Función para renderizar los usuarios encontrados
    renderUsers(foundUsers, userTableBody);

    // Limpiar el input de búsqueda después de realizar la búsqueda
    searchInput.value = '';
});

// Escuchar el evento del botón 'Ver Todos'
document.getElementById('viewAllBtn').addEventListener('click', async () => {
    const userTableBody = document.querySelector('.user-table tbody');
    userTableBody.innerHTML = ''; // Limpiar la tabla antes de mostrar resultados

    // Obtener todos los usuarios de la colección 'usuarios_moviles'
    const usersCollection = collection(db, 'usuarios_moviles');
    const usersSnapshot = await getDocs(usersCollection);

    let allUsers = [];
    usersSnapshot.forEach((doc) => allUsers.push({ id: doc.id, ...doc.data() }));

    // Renderizar todos los usuarios
    renderUsers(allUsers, userTableBody);
});

// Función para renderizar usuarios en la tabla
function renderUsers(users, tableBody) {
    if (users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7">No se encontraron usuarios</td></tr>`;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', user.id); // Agregar el data-id a la fila

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
                    <div class="actions-icons">
                        <button class="btn-action edit-btn" data-id="${user.id}" data-modal="editModal"><img src="../images/editar.png" alt="Editar"></button>
                        <button class="btn-action delete-btn" data-id="${user.id}" data-modal="deleteModal"><img src="../images/borrar.png" alt="Eliminar"></button>
                    </div>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Asignar eventos a los botones de edición y eliminación
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.closest('button').getAttribute('data-id');
            await handleEditUser(userId); // Asegúrate de tener esta función definida
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.closest('button').getAttribute('data-id');
            await handleDeleteUser(userId); // Asegúrate de tener esta función definida
        });
    });
}




//menu de opciones de la tabla
document.addEventListener("DOMContentLoaded", function() {
    // Usamos event delegation para detectar los clicks en los botones que se generan dinámicamente
    document.addEventListener('click', function(event) {
        const button = event.target.closest('.actions-btn');
        const actionContainers = document.querySelectorAll('.actions-container');

        if (button) {
            const container = button.parentElement;
            // Activar el contenedor de acciones y mostrar los íconos
            container.classList.add('active');
            
            // Evitar que el clic en el botón se propague y cierre los íconos inmediatamente
            event.stopPropagation();
        } else {
            // Cerrar los contenedores de acciones si el clic fue fuera de ellos
            actionContainers.forEach(container => {
                if (!container.contains(event.target)) {
                    container.classList.remove('active');
                }
            });
        }
    });

    // Esto asegura que los íconos desaparezcan y se muestren los tres puntos al hacer clic en cualquier otro lado
    document.addEventListener('click', function(event) {
        const actionContainers = document.querySelectorAll('.actions-container');

        actionContainers.forEach(container => {
            // Verifica que el clic no fue dentro de los contenedores de acciones ni en los botones
            if (!container.contains(event.target)) {
                container.classList.remove('active');  // Cierra las opciones y vuelve a los tres puntos
            }
        });
    });
});

//ventanas modales de editar,borrar, e historial de usuario

// Obtener elementos del DOM
const modals = document.querySelectorAll('.modales');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const closeButtons = document.querySelectorAll('.close');

// Usar event delegation para los botones generados dinámicamente
document.addEventListener('click', function(e) {
    const button = e.target.closest('.btn-action');
    if (button) {
        const modalId = button.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }
});

// Cerrar los modales al hacer clic en los botones de cerrar
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        modals.forEach(modal => modal.style.display = 'none');
    });
});

// Cerrar el modal cuando se hace clic fuera de su contenido
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modales')) {
        e.target.style.display = 'none';
    }
});

// Cerrar el modal de eliminar al hacer clic en el botón de cancelar
const btnCancel = document.querySelector('.btn-cancel');
if (btnCancel) {
    btnCancel.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });
}

// Asume que los usuarios se cargan en la tabla y cada fila tiene un botón de editar
const table = document.querySelector('#userTable');
let selectedUserId; // Guardará el ID del usuario seleccionado


document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
    const userId = this.getAttribute('data-user-id');
    
    if (!userId) {
        console.error('No se ha seleccionado un usuario');
        return;
    }
    
      // Lógica para obtener los datos del usuario a partir del userId
      getUserData(userId);  // Asegúrate de tener esta función para obtener los datos del usuario seleccionado
    });
});

//modal editar

// No cargar automáticamente los datos en los inputs de usuario y contraseña al abrir el modal
document.addEventListener('click', function (e) {
    const button = e.target.closest('.btn-action[data-modal="editModal"]');
    if (button) {
        const row = button.closest('tr'); // Obtener la fila correspondiente
        const userId = row.getAttribute('data-id'); // Obtener el ID del usuario

        // Limpiar los campos antes de cargar los datos
        document.getElementById('editNombre').value = '';
        document.getElementById('editApellido').value = '';
        document.getElementById('editCedula').value = '';
        document.getElementById('editTelefono').value = '';
        document.getElementById('editCorreo').value = '';
        document.getElementById('editPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('cedulaError').textContent = '';
        document.getElementById('correoError').textContent = '';
        document.getElementById('confirmPasswordError').textContent = '';

        // Cargar datos del usuario en el modal
        loadUserData(userId);
    }
});

// Cargar los datos del usuario seleccionado
async function loadUserData(userId) {
    const userDocRef = doc(db, 'usuarios_moviles', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // No cargar automáticamente el username ni el password
        // Esto asegura que se requiera ingresar estos datos manualmente al editar

        // Mostrar el modal
        editModal.style.display = 'flex';
        selectedUserId = userId; // Guardar el ID del usuario seleccionado
    } else {
        console.error("No se encontró el usuario.");
    }
}

// Función para alternar la visibilidad de la contraseña
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);

    toggleIcon.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.src = '../images/ojo.png'; // Cambia a la imagen de "ocultar"
        } else {
            passwordInput.type = 'password';
            toggleIcon.src = '../images/esconder.png'; // Cambia a la imagen de "mostrar"
        }
    });
}

// Aplicar la función a los campos de contraseña
document.addEventListener('DOMContentLoaded', () => {
    togglePasswordVisibility('editPassword', 'toggleIcon1');
    togglePasswordVisibility('confirmPassword', 'toggleIcon2');
});




// Manejar el formulario de edición
const editUserForm = document.getElementById('editUserForm');
editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('editNombre').value.trim();
    const apellido = document.getElementById('editApellido').value.trim();
    const cedula = document.getElementById('editCedula').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    const correo = document.getElementById('editCorreo').value.trim();
    const password = document.getElementById('editPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    const cedulaError = document.getElementById('cedulaError');
    const correoError = document.getElementById('correoError');
    const passwordError = document.getElementById('confirmPasswordError');
    
    cedulaError.textContent = '';
    correoError.textContent = '';
    passwordError.textContent = '';

    let hasError = false;

    // Verificación de las contraseñas
    if (password && password !== confirmPassword) {
        passwordError.textContent = 'Las contraseñas no coinciden.';
        hasError = true;
    }

    // Si campos están vacíos, mostrar error
    if (!nombre && !apellido && !cedula && !telefono && !correo && !password) {
        passwordError.textContent = 'Debe llenar al menos un campo.';
        hasError = true;
    }

    // Si hay errores, detener la ejecución
    if (hasError) {
        return;
    }

    // Verificar si ya existe un usuario con el mismo username (si se ingresó un username)
    const usersCollection = collection(db, 'usuarios_moviles');
    if (cedula) {
        const cedulaQuery = query(usersCollection, where("cedula", "==", cedula));
        const cedulaSnapshot = await getDocs(cedulaQuery);

        // Si el username ya existe en otro usuario, mostrar error
        if (!cedulaSnapshot.empty && cedulaSnapshot.docs[0].id !== selectedUserId) {
            cedulaError.textContent = 'Este numero de cedula ya esta en uso';
            return;
        }
    }
    if(correo){
        const correoQuery = query(usersCollection, where("correo", "==", correo));
        const correoSnapshot = await getDocs(correoQuery);

        // Si el username ya existe en otro usuario, mostrar error
        if (!correoSnapshot.empty && correoSnapshot.docs[0].id !== selectedUserId) {
            correoError.textContent = 'Este correo ya esta en uno.';
            return;
        }
    }

    const userDocRef = doc(db, 'usuarios_moviles', selectedUserId);

    // Crear objeto con los campos a actualizar (solo los que están llenos)
    const updatedData = {};
    if (nombre) {
        updatedData.nombre = nombre;
    }
    if (apellido) {
        updatedData.apellido = apellido;
    }
    if (cedula) {
        updatedData.cedula = cedula;
    }
    if (telefono) {
        updatedData.telefono = telefono;
    }
    if (correo) {
        updatedData.correo = correo;
    }
    if (password) {
        updatedData.contraseña = password;
    }
    updatedData.updatedAt = serverTimestamp(); // Actualizar la fecha de edición

    try {
        // Actualizar el documento en Firestore solo con los campos necesarios
        await setDoc(userDocRef, updatedData, { merge: true }); // Merge para no sobrescribir campos no incluidos

        // Cerrar el modal después de la actualización
        editModal.style.display = 'none';
        document.getElementById('successedit').style.display = 'block';
    } catch (error) {
        console.error("Error al actualizar el usuario: ", error);
    }
});

const successeditCloseBtn = document.getElementById('successeditCloseBtn');
successeditCloseBtn.addEventListener('click', () => {
    document.getElementById('successedit').style.display = 'none';
});


//Eliminar Usuario

let selectedUserToDelete; // Variable para almacenar el ID del usuario a eliminar
const eliminateModal = document.getElementById('deleteModal');
const successDeleteModal = document.getElementById('successDeleteModal');

// Manejar el evento de clic en el botón de eliminar
document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-action[data-modal="deleteModal"]');
    if (button) {
        const row = button.closest('tr'); // Obtener la fila correspondiente
        selectedUserToDelete = row.getAttribute('data-id'); // Guardar el ID del usuario
        eliminateModal.style.display = 'flex'; // Mostrar el modal de eliminación
    }
});

// Manejar el evento de clic en el botón de eliminar dentro del modal
const btnDelete = document.querySelector('.btn-delete');
if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
        if (selectedUserToDelete) {
            try {
                // Referencia al documento del usuario a eliminar
                const userDocRef = doc(db, 'usuarios_moviles', selectedUserToDelete);
                await deleteDoc(userDocRef); // Eliminar el documento

                // Cerrar el modal de eliminación
                deleteModal.style.display = 'none';
                
                // Mostrar modal de éxito
                successDeleteModal.style.display = 'flex';
            } catch (error) {
                console.error("Error al eliminar el usuario: ", error);
                alert('Hubo un error al eliminar el usuario.');
            }
        }
    });
}

// Cerrar el modal de éxito
const btnCloseSuccessDelete = document.getElementById('btnCloseSuccessDelete');
if (btnCloseSuccessDelete) {
    btnCloseSuccessDelete.addEventListener('click', () => {
        successDeleteModal.style.display = 'none';
    });
}






