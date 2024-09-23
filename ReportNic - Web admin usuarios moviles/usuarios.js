import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, orderBy, addDoc, query, serverTimestamp} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBPbr-ig4ukpRmtrtpiBQX5vZneMpLpv1Y",
    authDomain: "reportnic-pruebanoti.firebaseapp.com",
    projectId: "reportnic-pruebanoti",
    storageBucket: "reportnic-pruebanoti.appspot.com",
    messagingSenderId: "893062373282",
    appId: "1:893062373282:web:2e2162de389e903fb61cfb",
    measurementId: "G-DSGS2P0DE8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


let isProcessing = false;

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




// Función para cargar usuarios en tiempo real
function loadUsersRealTime() {
    const userTableBody = document.querySelector('.user-table tbody');

    // Referencia a la colección 'registro_usuarios_moviles'
    const usersCollection = collection(db, 'registro_usuarios_moviles');

    // Consulta para ordenar usuarios por 'createdAt' de manera descendente (los más recientes primero)
    const q = query(usersCollection, orderBy('createdAt', 'desc'));

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
                <td>${userData.correo}</td>
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




//modal editar

// No cargar automáticamente los datos en los inputs de usuario y contraseña al abrir el modal
document.addEventListener('click', function (e) {
    const button = e.target.closest('.btn-action[data-modal="editModal"]');
    if (button) {
        const row = button.closest('tr'); // Obtener la fila correspondiente
        const userId = row.getAttribute('data-id'); // Obtener el ID del usuario

        // Limpiar los campos antes de cargar los datos
        document.getElementById('editUsername').value = '';
        document.getElementById('editPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('usernameError').textContent = '';
        document.getElementById('passwordError').textContent = '';

        // Cargar datos del usuario en el modal
        loadUserData(userId);
    }
});

// Cargar los datos del usuario seleccionado
async function loadUserData(userId) {
    const userDocRef = doc(db, 'usuario_hospitalVelezPaiz', userId);
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

    const username = document.getElementById('editUsername').value.trim();
    const password = document.getElementById('editPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    const usernameError = document.getElementById('editError');
    const passwordError = document.getElementById('passwordError');
    usernameError.textContent = '';
    passwordError.textContent = '';

    let hasError = false;

    // Verificación de las contraseñas
    if (password && password !== confirmPassword) {
        passwordError.textContent = 'Las contraseñas no coinciden.';
        hasError = true;
    }

    // Si ambos campos están vacíos, mostrar error
    if (!username && !password) {
        usernameError.textContent = 'Debe llenar al menos el nombre de usuario o la contraseña.';
        hasError = true;
    }

    // Si hay errores, detener la ejecución
    if (hasError) {
        return;
    }

    // Verificar si ya existe un usuario con el mismo username (si se ingresó un username)
    const usersCollection = collection(db, 'usuario_hospitalVelezPaiz');
    if (username) {
        const usernameQuery = query(usersCollection, where("user", "==", username));
        const usernameSnapshot = await getDocs(usernameQuery);

        // Si el username ya existe en otro usuario, mostrar error
        if (!usernameSnapshot.empty && usernameSnapshot.docs[0].id !== selectedUserId) {
            usernameError.textContent = 'Este nombre de usuario ya está en uso.';
            return;
        }
    }

    const userDocRef = doc(db, 'usuario_hospitalVelezPaiz', selectedUserId);

    // Crear objeto con los campos a actualizar (solo los que están llenos)
    const updatedData = {};
    if (username) {
        updatedData.user = username;
    }
    if (password) {
        updatedData.password = password;
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
                const userDocRef = doc(db, 'usuario_hospitalVelezPaiz', selectedUserToDelete);
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




