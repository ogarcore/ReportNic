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



