import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBPbr-ig4ukpRmtrtpiBQX5vZneMpLpv1Y",
    authDomain: "reportnic-pruebanoti.firebaseapp.com",
    projectId: "reportnic-pruebanoti",
    storageBucket: "reportnic-pruebanoti.appspot.com",
    messagingSenderId: "893062373282",
    appId: "1:893062373282:web:2e2162de389e903fb61cfb",
    measurementId: "G-DSGS2P0DE8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let notifications = [];
const notificationTimeout = 60000; // Tiempo límite en milisegundos (ej. 10000 ms = 10 segundos)
let isNotificationSelected = false; // Variable para saber si hay una notificación seleccionada

function getHiddenNotifications() {
    return JSON.parse(localStorage.getItem('hiddenNotifications')) || [];
}

function hideNotification(notificationId) {
    let hiddenNotifications = getHiddenNotifications();
    if (!hiddenNotifications.includes(notificationId)) {
        hiddenNotifications.push(notificationId);
    }
    localStorage.setItem('hiddenNotifications', JSON.stringify(hiddenNotifications));
}

async function saveNotificationToFirestore(notification) {
    const hospital = localStorage.getItem('hospital');
    let collectionName;

    if (hospital === 'hospitalVelezPaiz') {
        collectionName = 'usuario_hospitalVelezPaiz_historial';
    } else if (hospital === 'hospitalBautista') {
        collectionName = 'usuario_hospitalBautista_historial';
    }

    if (collectionName) {
        try {
            await addDoc(collection(db, collectionName), {
                id: notification.id,
                firstName: notification.firstName,
                lastName: notification.lastName,
                age: notification.age,
                systolic: notification.systolic,
                diastolic: notification.diastolic,
                conditions: notification.conditions,
                dateTime: new Date(),
                user: localStorage.getItem('usuario')
            });
            console.log('Notificación guardada en Firestore');
        } catch (error) {
            console.error('Error al guardar la notificación:', error);
        }
    }
}

function listenToNotifications() {
    const notifCollection = collection(db, "coleccion");

    onSnapshot(notifCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const timestamp = data.dateTime.toDate();
                const date = timestamp.toISOString().split('T')[0]; 
                const time = timestamp.toTimeString().split(' ')[0]; 

                if (!getHiddenNotifications().includes(change.doc.id)) {
                    const notification = {
                        id: change.doc.id,
                        createdAt: timestamp, // Guardar el tiempo de creación
                        date,
                        time,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        age: data.age,
                        systolic: data.systolic,
                        diastolic: data.diastolic,
                        conditions: data.conditions
                    };

                    notifications.push(notification);
                    renderNotifications(notification); 
                }
            }
        });
    });
}

function renderNotifications(notification) {
    const notificationsContainer = document.getElementById('notifications');
    const notificationDiv = document.createElement('div');
    notificationDiv.classList.add('notification', 'fadeInDown'); 
    notificationDiv.innerHTML = 
        `<h3>Emergencia en camino</h3>
        <p>Hora: ${notification.time}</p>
        <p>${notification.conditions}</p>
        <button class="close-btn">&times;</button>`;
    
    notificationDiv.addEventListener('click', () => loadPatientData(notification));

    notificationDiv.querySelector('.close-btn').addEventListener('click', (e) => {
        e.stopPropagation(); 
        saveNotificationToFirestore(notification);
        hideNotification(notification.id);
        notificationDiv.remove();
        clearPatientData(); // Limpiar la ficha al cerrar la notificación
        isNotificationSelected = false; // Restablecer el estado
    });

    notificationsContainer.appendChild(notificationDiv);

    // Ocultar la notificación después del tiempo límite desde su creación
    const timeElapsed = new Date() - notification.createdAt; // Tiempo transcurrido desde la creación
    const remainingTime = notificationTimeout - timeElapsed;

    // Solo ocultar si el tiempo restante es positivo
    if (remainingTime > 0) {
        setTimeout(() => {
            hideNotification(notification.id);
            notificationDiv.remove();
            clearPatientData(); // Limpiar la ficha al ocultar la notificación
            isNotificationSelected = false; // Restablecer el estado
        }, remainingTime);
    } else {
        // Si ya ha pasado el tiempo, oculta inmediatamente
        hideNotification(notification.id);
        notificationDiv.remove();
        clearPatientData(); // Limpiar la ficha al ocultar la notificación
        isNotificationSelected = false; // Restablecer el estado
    }
}

function loadPatientData(notification) {
    isNotificationSelected = true; // Indicar que hay una notificación seleccionada
    document.getElementById('patient-time').textContent = notification.time;
    document.getElementById('patient-date').textContent = notification.date;
    document.getElementById('patient-name').value = notification.firstName;
    document.getElementById('patient-lastname').value = notification.lastName;
    document.getElementById('patient-age').value = notification.age;
    document.getElementById('patient-blood-pressure-systolic').value = notification.systolic;
    document.getElementById('patient-blood-pressure-diastolic').value = notification.diastolic;
    document.getElementById('patient-conditions').value = notification.conditions;
}

function clearPatientData() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { hour12: false });
    document.getElementById('patient-time').textContent = timeString; // Mostrar hora actual
    document.getElementById('patient-date').textContent = now.toLocaleDateString();
    document.getElementById('patient-name').value = '';
    document.getElementById('patient-lastname').value = '';
    document.getElementById('patient-age').value = '';
    document.getElementById('patient-blood-pressure-systolic').value = '';
    document.getElementById('patient-blood-pressure-diastolic').value = '';
    document.getElementById('patient-conditions').value = '';
    isNotificationSelected = false; // Restablecer el estado
}


function updateTime() {
    if (!isNotificationSelected) { 
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { hour12: false });
        document.getElementById('patient-time').textContent = timeString;
        document.getElementById('patient-date').textContent = now.toLocaleDateString();
    }
}

updateTime();
setInterval(updateTime, 1000);
window.onload = listenToNotifications;

document.addEventListener('DOMContentLoaded', function() {
    const coordenadasManagua = [12.1364, -86.2514];
    const map = L.map('map').setView(coordenadasManagua, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
});
