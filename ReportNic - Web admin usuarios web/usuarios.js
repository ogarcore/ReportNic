//ventana modal para crear usuarios
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


//INICIALIZAR FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, onSnapshot, setDoc, doc, orderBy, query, where, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

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

// Recuperar el valor del hospital almacenado en localStorage
const hospital = localStorage.getItem('hospital');

// Seleccionar la colección adecuada basada en el valor del hospital
let usersCollection;
if (hospital === 'Bautista') {
    usersCollection = collection(db, 'usuario_hospitalBautista');
} else if (hospital === 'Velez Paiz') {
    usersCollection = collection(db, 'usuario_hospitalVelezPaiz');
} else {
    console.error('Hospital no reconocido.');
}

// Manejar el envío del formulario para crear un nuevo usuario
const createUserForm = document.getElementById('createUserForm');
createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener los valores de los campos del formulario
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const dni = document.getElementById('dni').value;

    // Elementos para mostrar mensajes de error
    const usernameError = document.getElementById('usernameError');
    const dniError = document.getElementById('dniError');

    // Limpiar los mensajes de error previos
    usernameError.textContent = '';
    dniError.textContent = '';

    try {
        // Verificar si ya existe un usuario con el mismo username
        const usernameQuery = query(usersCollection, where("user", "==", username));
        const usernameSnapshot = await getDocs(usernameQuery);

        // Verificar si ya existe un usuario con el mismo dni
        const dniQuery = query(usersCollection, where("dni", "==", dni));
        const dniSnapshot = await getDocs(dniQuery);

        let hasError = false;

        // Si ya existe un usuario con el mismo username, mostrar un mensaje de error
        if (!usernameSnapshot.empty) {
            usernameError.textContent = 'Este nombre de usuario ya está en uso.';
            hasError = true;
        }

        // Si ya existe un usuario con el mismo dni, mostrar un mensaje de error
        if (!dniSnapshot.empty) {
            dniError.textContent = 'Esta cédula ya está registrada.';
            hasError = true;
        }

        // Si hay errores, no continuar con la creación del usuario
        if (hasError) {
            return;
        }

        // Obtener todos los documentos existentes en la colección
        const snapshot = await getDocs(usersCollection);
        const userCount = snapshot.size + 1;  // Calculamos el número de documentos existentes + 1

        // Crear el documento con nombre personalizado (user1, user2, etc.)
        const userDocRef = doc(usersCollection, `user${userCount}`);
        await setDoc(userDocRef, {
            firstName: firstName,
            lastName: lastName,
            user: username,
            password: password,
            dni: dni,
            createdAt: serverTimestamp()
        });

        // Limpiar el formulario
        createUserForm.reset();

        // Cerrar el modal de creación de usuario
        document.getElementById('userModal').style.display = 'none';

        // Mostrar el modal de éxito
        document.getElementById('successModal').style.display = 'block';
    } catch (error) {
        console.error("Error al agregar el usuario: ", error);
        alert('Hubo un error al registrar el usuario.');
    }
});

// Manejar el cierre del modal de éxito
const successModalCloseBtn = document.getElementById('successModalCloseBtn');
successModalCloseBtn.addEventListener('click', () => {
    document.getElementById('successModal').style.display = 'none';
});



// Función para cargar usuarios en tiempo real
function loadUsersRealTime() {
    const userTableBody = document.querySelector('.user-table tbody');
    
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
                <td>${userData.firstName}</td>
                <td>${userData.lastName}</td>
                <td>${userData.user}</td>
                <td>${userData.password}</td>
                <td>${userData.dni}</td>
                <td>
                    <div class="actions-container">
                        <button class="actions-btn">●●●</button>
                        <div class="actions-icons">
                            <button class="btn-action" data-modal="editModal"><img src="../images/editar.png" alt="Editar"></button>
                            <button class="btn-action" data-modal="deleteModal"><img src="../images/borrar.png" alt="Eliminar"></button>
                            <button class="btn-action" data-modal="historyModal"><img src="../images/historial.png" alt="Ver Historial"></button>
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



//menu de opciones
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
const modals = document.querySelectorAll('.modal');
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
    if (e.target.classList.contains('modal')) {
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
    // Recuperar el hospital desde localStorage
    const hospital = localStorage.getItem('hospital');
    let usersCollection;

    if (hospital === 'Bautista') {
        usersCollection = 'usuario_hospitalBautista';
    } else if (hospital === 'Velez Paiz') {
        usersCollection = 'usuario_hospitalVelezPaiz';
    } else {
        console.error('Hospital no reconocido.');
        return;
    }

    const userDocRef = doc(db, usersCollection, userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();

        // Mostrar el modal sin cargar automáticamente los campos username y password
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
    const hospital = localStorage.getItem('hospital');
let usersCollection;

if (hospital === 'Bautista') {
    usersCollection = collection(db, 'usuario_hospitalBautista');
} else if (hospital === 'Velez Paiz') {
    usersCollection = collection(db, 'usuario_hospitalVelezPaiz');
} else {
    console.error('Hospital no reconocido.');
    return;
}

if (username) {
    const usernameQuery = query(usersCollection, where("user", "==", username));
    const usernameSnapshot = await getDocs(usernameQuery);

    // Si el username ya existe en otro usuario, mostrar error
    if (!usernameSnapshot.empty && usernameSnapshot.docs[0].id !== selectedUserId) {
        usernameError.textContent = 'Este nombre de usuario ya está en uso.';
        return;
    }
}

const userDocRef = doc(usersCollection,selectedUserId);


// Crear objeto con los campos a actualizar
const updatedData = {};
if (username) {
    updatedData.user = username;
}
if (password) {
    updatedData.password = password;
}
updatedData.updatedAt = serverTimestamp();

try {
    // Actualizar el documento en Firestore solo con los campos necesarios
    await setDoc(userDocRef, updatedData, { merge: true });

    // Cerrar el modal y mostrar el modal de éxito
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
            const hospital = localStorage.getItem('hospital');
            let usersCollection;

            if (hospital === 'Bautista') {
                usersCollection = 'usuario_hospitalBautista';
            } else if (hospital === 'Velez Paiz') {
                usersCollection = 'usuario_hospitalVelezPaiz';
            } else {
            console.error('Hospital no reconocido.');
            return;
            }

            const userDocRef = doc(db, usersCollection, selectedUserToDelete);
            try {
                await deleteDoc(userDocRef); // Eliminar el documento

                // Cerrar el modal y mostrar el modal de éxito
                deleteModal.style.display = 'none';
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






