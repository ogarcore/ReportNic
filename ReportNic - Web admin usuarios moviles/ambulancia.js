import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, onSnapshot, setDoc, doc, orderBy, query, where,serverTimestamp, deleteDoc} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

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

const modal = document.getElementById('addModal');
  const btn = document.getElementById('addAmbulanceBtn');
  const closeModal = document.getElementById('closeModal');

  btn.onclick = function() {
    modal.style.display = 'block';
  }

  closeModal.onclick = function() {
    modal.style.display = 'none';
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }

// Referencia a la colección de ambulancias
const ambulanciasRef = collection(db, 'ambulancias');

// Función para generar un código único (puedes mejorar la lógica si prefieres)
function generarCodigoAmbulancia() {
  return 'AMB-' + Math.floor(1000 + Math.random() * 9000); // Código tipo AMB-1234
}

// Guardar Ambulancia
document.getElementById('saveAmbulanceBtn').addEventListener('click', async () => {
  const matricula = document.getElementById('matriculaInput').value;
  
  if (matricula === '') {
    alert('La matrícula es requerida');
    return;
  }

  const codigo = generarCodigoAmbulancia(); // Generar el código de la ambulancia

  try {
    await addDoc(ambulanciasRef, {
      codigo: codigo,
      matricula: matricula,
      fechaCreacion: serverTimestamp()
    });

    alert('Ambulancia agregada exitosamente');
    document.getElementById('addModal').style.display = 'none';
  } catch (error) {
    console.error('Error agregando ambulancia:', error);
    alert('Hubo un error al agregar la ambulancia.');
  }
});

// Tabla para mostrar ambulancias
const tbody = document.querySelector('tbody');

// Query para obtener las ambulancias ordenadas por fecha de creación
const q = query(ambulanciasRef, orderBy('fechaCreacion', 'desc'));

// Escuchar los cambios en la colección
onSnapshot(q, (snapshot) => {
  tbody.innerHTML = ''; // Limpiar la tabla antes de volver a renderizarla
  snapshot.forEach((doc) => {
    const data = doc.data();
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${data.codigo}</td>
      <td>${data.matricula}</td>
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

    tbody.appendChild(tr);
  });
});



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
        document.getElementById('editMatricula').value = '';
        document.getElementById('editError').textContent = '';

        // Cargar datos del usuario en el modal
        loadUserData(userId);
    }
});

// Cargar los datos del usuario seleccionado
async function loadUserData(userId) {
    const userDocRef = doc(db, 'ambulancias', userId);
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

// Manejar el formulario de edición
const editUserForm = document.getElementById('editUserForm');
editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const matricula = document.getElementById('editMatricula').value.trim();

    const matriculaError = document.getElementById('editError');

    
    matriculaError.textContent = '';

    let hasError = false;


    // Si ambos campos están vacíos, mostrar error
    if (!matricula) {
        matriculaError.textContent = 'Debe llenar el campo.';
        hasError = true;
    }

    // Si hay errores, detener la ejecución
    if (hasError) {
        return;
    }

    // Verificar si ya existe un usuario con el mismo username (si se ingresó un username)
    const usersCollection = collection(db, 'ambulancias');
    if (matricula) {
        const matriculaQuery = query(usersCollection, where("matricula", "==", matricula));
        const matriculaSnapshot = await getDocs(matriculaQuery);

        // Si el username ya existe en otro usuario, mostrar error
        if (!matriculaSnapshot.empty && matriculaSnapshot.docs[0].id !== selectedUserId) {
            editError.textContent = 'Este numero de matricula ya esta registrado';
            return;
        }
    }
    

    const userDocRef = doc(db, 'ambulancias', selectedUserId);

    // Crear objeto con los campos a actualizar (solo los que están llenos)
    const updatedData = {};
    if (matricula) {
        updatedData.matricula = matricula;
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
                const userDocRef = doc(db, 'ambulancias', selectedUserToDelete);
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


