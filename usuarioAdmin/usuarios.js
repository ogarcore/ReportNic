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





document.addEventListener("DOMContentLoaded", function() {
    const actionButtons = document.querySelectorAll('.actions-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const container = button.parentElement;
            container.classList.add('active');
        });
    });

    // Cerrar los íconos y mostrar los tres puntos al hacer clic fuera
    document.addEventListener('click', function(event) {
        const actionContainers = document.querySelectorAll('.actions-container');
        
        actionContainers.forEach(container => {
            if (!container.contains(event.target)) {
                container.classList.remove('active');
            }
        });
    });
});



// Obtener elementos del DOM
const modals = document.querySelectorAll('.modal');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const historyModal = document.getElementById('historyModal');
const closeButtons = document.querySelectorAll('.close');

// Abrir los modales al hacer clic en los botones correspondientes
document.querySelectorAll('.btn-action').forEach(button => {
    button.addEventListener('click', (e) => {
        const modalId = button.getAttribute('data-modal');
        document.getElementById(modalId).style.display = 'flex';
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        modals.forEach(modal => modal.style.display = 'none');
    });
});

const btnCancel = document.querySelector('.btn-cancel'); // Selecciona el botón de cancelar
if (btnCancel) {
    btnCancel.addEventListener('click', () => {
        deleteModal.style.display = 'none'; // Cierra el modal de eliminación
    });
}

// Cerrar el modal cuando se hace clic fuera de su contenido
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});




