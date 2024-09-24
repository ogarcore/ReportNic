

//modal editar
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

    // Si ambos campos están vacíos, mostrar error
    if (!nombre && !apellido && !cedula && !telefono && !correo && !password) {
        passwordError.textContent = 'Debe llenar al menos un campo.';
        hasError = true;
    }

    // Si hay errores, detener la ejecución
    if (hasError) {
        return;
    }

    // Verificar si ya existe un usuario con el mismo username (si se ingresó un username)
    const usersCollection = collection(db, 'registro_usuarios_moviles');
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

