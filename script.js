import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

// Referencia al documento de la colección en Firestore
const docRef = doc(db, "coleccion", "notificacion_emergencia");

// Arreglo para almacenar las notificaciones
let notifications = [];

// Función para obtener los datos de Firestore
async function fetchNotificationData() {
try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
    const data = docSnap.data();

    const timestamp = data.dateTime.toDate(); // Convierte el timestamp a un objeto Date de JavaScript
    const date = timestamp.toISOString().split('T')[0]; // Obtén solo la fecha (YYYY-MM-DD)
    const time = timestamp.toTimeString().split(' ')[0];

    notifications.push({
        date,
        time,
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        systolic: data.systolic,
        diastolic: data.distolic,
        conditions: data.conditions
    });

    renderNotifications();
    } else {
    console.log("No se encontró el documento.");
    }
} catch (error) {
    console.error("Error obteniendo los datos:", error);
}
}

// Función para renderizar las notificaciones
function renderNotifications() {
    const notificationsContainer = document.getElementById('notifications');
    notificationsContainer.innerHTML = ''; 
    
    notifications.forEach((notification, index) => {
        const notificationDiv = document.createElement('div');
        notificationDiv.classList.add('notification');
        notificationDiv.innerHTML = `
        <h3>Emergencia</h3>
        <p>Hora: ${notification.time}</p>
        <p>${notification.conditions}</p>
        `;
        notificationDiv.addEventListener('click', () => loadPatientData(index));
        notificationsContainer.appendChild(notificationDiv);
    });
    }

    let isNotificationSelected = false; // Variable de control

// Función para cargar los datos del paciente al hacer clic en una notificación
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
    
    // Cargar las notificaciones al cargar la página
    window.onload = fetchNotificationData;
    

// mapa 
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
    // Función para exportar a CSV
    alert("Exportando a CSV...");
}

function exportToPDF() {
    // Función para exportar a PDF
    alert("Exportando a PDF...");
}





