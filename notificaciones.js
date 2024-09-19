import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Arreglo para almacenar las notificaciones
let notifications = [];

// Obtener las notificaciones ocultas de localStorage
function getHiddenNotifications() {
    return JSON.parse(localStorage.getItem('hiddenNotifications')) || [];
}

// Guardar las notificaciones ocultas en localStorage
function hideNotification(notificationId) {
    let hiddenNotifications = getHiddenNotifications();
    if (!hiddenNotifications.includes(notificationId)) {
        hiddenNotifications.push(notificationId);
    }
    localStorage.setItem('hiddenNotifications', JSON.stringify(hiddenNotifications));
}

// Función para escuchar notificaciones en tiempo real (sin orderBy)
function listenToNotifications() {
    const notifCollection = collection(db, "coleccion");

    onSnapshot(notifCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const timestamp = data.dateTime.toDate(); // Convertir el timestamp a objeto Date
                const date = timestamp.toISOString().split('T')[0]; // Obtener solo la fecha
                const time = timestamp.toTimeString().split(' ')[0]; // Obtener solo la hora

                // Revisar si la notificación está oculta
                if (!getHiddenNotifications().includes(change.doc.id)) {
                    // Agregar notificación en orden de llegada (FIFO)
                    notifications.push({
                        id: change.doc.id,
                        date,
                        time,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        age: data.age,
                        systolic: data.systolic,
                        diastolic: data.diastolic,
                        conditions: data.conditions
                    });

                    renderNotifications();  // Renderizar las notificaciones
                }
            }
        });
    });
}

// Función para renderizar las notificaciones
let lastNotificationIndex = -1; // Para controlar la última notificación

// Función para renderizar las notificaciones
function renderNotifications() {
    const notificationsContainer = document.getElementById('notifications');
    
    notifications.forEach((notification, index) => {
        if (index > lastNotificationIndex) {
            const notificationDiv = document.createElement('div');
            notificationDiv.classList.add('notification', 'fadeInDown'); // Clase de animación
            notificationDiv.innerHTML = `
                <h3>Emergencia</h3>
                <p>Hora: ${notification.time}</p>
                <p>${notification.conditions}</p>
                <button class="close-btn">&times;</button>
            `;

            // Evento para cargar datos del paciente al hacer clic en la notificación
            notificationDiv.addEventListener('click', () => loadPatientData(index));

            // Evitar que el botón de cierre afecte el evento de selección de notificación
            notificationDiv.querySelector('.close-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Para evitar que se dispare el evento de clic en la notificación
                
                // Esperar la duración de la animación (0.5s en este caso) antes de eliminarla
                setTimeout(() => {
                    hideNotification(notification.id); // Ocultar la notificación permanentemente
                    notificationDiv.remove(); // Eliminar la notificación visualmente
                    clearPatientData(); // Limpiar la ficha del paciente
                },);
            });

            notificationsContainer.appendChild(notificationDiv);
            
            lastNotificationIndex = index;
        }
    });
}


// Función para limpiar la ficha del paciente
function clearPatientData() {
    document.getElementById('patient-time').textContent = '';
    document.getElementById('patient-date').textContent = '';
    document.getElementById('patient-name').value = '';
    document.getElementById('patient-lastname').value = '';
    document.getElementById('patient-age').value = '';
    document.getElementById('patient-blood-pressure-systolic').value = '';
    document.getElementById('patient-blood-pressure-diastolic').value = '';
    document.getElementById('patient-conditions').value = '';
    isNotificationSelected = false; // Vuelve a activar la actualización del reloj
}

let isNotificationSelected = false; // Variable de control

// Función para cargar los datos del paciente al hacer clic en una notificación
function loadPatientData(index) {
    const notification = notifications[index];
    isNotificationSelected = true;

    // Establecer los valores de fecha y hora de la notificación seleccionada
    document.getElementById('patient-time').textContent = notification.time;
    document.getElementById('patient-date').textContent = notification.date;
    
    document.getElementById('patient-name').value = notification.firstName;
    document.getElementById('patient-lastname').value = notification.lastName;
    document.getElementById('patient-age').value = notification.age;
    document.getElementById('patient-blood-pressure-systolic').value = notification.systolic;
    document.getElementById('patient-blood-pressure-diastolic').value = notification.diastolic;
    document.getElementById('patient-conditions').value = notification.conditions;
}

// Función para actualizar la hora y fecha actuales cuando la ficha está vacía
function updateTime() {
    if (!isNotificationSelected) { // Solo actualizar si no se ha seleccionado una notificación
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { hour12: false }); // Formato de 24 horas
        document.getElementById('patient-time').textContent = timeString;
        document.getElementById('patient-date').textContent = now.toLocaleDateString();
    }
}

// Llamar a la función para mostrar la hora actual al cargar la página
updateTime();

// Actualizar la hora cada segundo
setInterval(updateTime, 1000);

// Iniciar el listener de notificaciones al cargar la página
window.onload = listenToNotifications;

// Mapa
document.addEventListener('DOMContentLoaded', function() {
    const coordenadasManagua = [12.126970, -86.303542]; 
    const map = L.map('map').setView(coordenadasManagua, 13); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker(coordenadasManagua).addTo(map)
        .bindPopup(' Managua, Nicaragua.')
        .openPopup();
});

// Menú del perfil
document.addEventListener("DOMContentLoaded", function() {
    const profileMenu = document.getElementById("profileMenu");
    const dropdownMenu = document.getElementById("dropdownMenu");

    profileMenu.addEventListener("click", function(e) {
        e.stopPropagation();
        profileMenu.classList.toggle("active");
    });

    document.addEventListener("click", function(e) {
        if (!profileMenu.contains(e.target)) {
            profileMenu.classList.remove("active");
        }
    });
});

function exportToCSV() {
    alert("Exportando a CSV...");
}

function exportToPDF() {
    alert("Exportando a PDF...");
}
