import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";


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

                    renderNotifications(); 
                }
            }
        });
    });
}


let lastNotificationIndex = -1; 


function renderNotifications() {
    const notificationsContainer = document.getElementById('notifications');
    
    notifications.forEach((notification, index) => {
        if (index > lastNotificationIndex) {
            const notificationDiv = document.createElement('div');
            notificationDiv.classList.add('notification', 'fadeInDown'); 
            notificationDiv.innerHTML = `
                <h3>Emergencia en camino</h3>
                <p>Hora: ${notification.time}</p>
                <p>${notification.conditions}</p>
                <button class="close-btn">&times;</button>
            `;

            
            notificationDiv.addEventListener('click', () => loadPatientData(index));

            
            notificationDiv.querySelector('.close-btn').addEventListener('click', (e) => {
                e.stopPropagation(); 
                
                
                setTimeout(() => {
                    hideNotification(notification.id); 
                    notificationDiv.remove(); 
                    clearPatientData(); 
                },);
            });

            notificationsContainer.appendChild(notificationDiv);
            
            lastNotificationIndex = index;
        }
    });
}



function clearPatientData() {
    document.getElementById('patient-time').textContent = '';
    document.getElementById('patient-date').textContent = '';
    document.getElementById('patient-name').value = '';
    document.getElementById('patient-lastname').value = '';
    document.getElementById('patient-age').value = '';
    document.getElementById('patient-blood-pressure-systolic').value = '';
    document.getElementById('patient-blood-pressure-diastolic').value = '';
    document.getElementById('patient-conditions').value = '';
    isNotificationSelected = false;
}

let isNotificationSelected = false; 


function loadPatientData(index) {
    const notification = notifications[index];
    isNotificationSelected = true;

    
    document.getElementById('patient-time').textContent = notification.time;
    document.getElementById('patient-date').textContent = notification.date;
    
    document.getElementById('patient-name').value = notification.firstName;
    document.getElementById('patient-lastname').value = notification.lastName;
    document.getElementById('patient-age').value = notification.age;
    document.getElementById('patient-blood-pressure-systolic').value = notification.systolic;
    document.getElementById('patient-blood-pressure-diastolic').value = notification.diastolic;
    document.getElementById('patient-conditions').value = notification.conditions;
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


