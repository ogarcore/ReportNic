import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, onSnapshot, setDoc, doc, addDoc, orderBy, query, where,serverTimestamp, deleteDoc} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB07sR2b1NMI0lvJUYa6hHHDfAqIdhb5hI",
    authDomain: "reportnicdb.firebaseapp.com",
    projectId: "reportnicdb",
    storageBucket: "reportnicdb.appspot.com",
    messagingSenderId: "361642844511",
    appId: "1:361642844511:web:0134bcb94209b1c65116ea",
    measurementId: "G-7Z3Y1M2MP6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

let notifications = [];
const notificationTimeout = 120000; // Tiempo límite en milisegundos (ej. 10000 ms = 10 segundos)
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
    const usuario = localStorage.getItem('usuario'); // Obtener el usuario del localStorage
    let collectionName;

    if (hospital === 'hospitalCarlosRobertoHuembes(Filial El Carmen)') {
        collectionName = 'historial_HospitalCarlosRobertoHuembes';
    } else if (hospital === 'hospitalSuMedico') {
        collectionName = 'historial_HospitalSuMedico';
    }

    if (collectionName) {
        try {
            await addDoc(collection(db, collectionName), {
                id: notification.id,
                nombre: notification.nombre,
                apellidos: notification.apellidos,
                edad: notification.edad,
                presionSistolica: notification.presionSistolica,
                presionDiastolica: notification.presionDiastolica,
                afectaciones: notification.afectaciones,
                eta: notification.eta,
                fechaYHora: new Date(),
                usuario: usuario 
            });
            console.log('Notificación guardada en Firestore');
        } catch (error) {
            console.error('Error al guardar la notificación:', error);
        }
    }
}


let notifCollection;

function listenToNotifications() {
    notifCollection = collection(db, "Emergencias");

    onSnapshot(notifCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const timestamp = data.fechaYHora.toDate();
                const date = timestamp.toISOString().split('T')[0]; 
                const time = timestamp.toTimeString().split(' ')[0]; 

                const hospitalLocalStorage = localStorage.getItem('hospital');
                const notificationHospital = data.hospitalSeleccionado?.nombre; 

                // Comparar el hospital
                if (
                    (hospitalLocalStorage === 'hospitalCarlosRobertoHuembes(Filial El Carmen)' && notificationHospital === 'Hospital Carlos Roberto Huembes (Filial El Carmen)') ||
                    (hospitalLocalStorage === 'hospitalSuMedico' && notificationHospital === 'Hospital SuMédico')
                ) {
                    if (!getHiddenNotifications().includes(change.doc.id)) {
                        const notification = {
                            id: change.doc.id,
                            createdAt: timestamp, 
                            date,
                            time,
                            nombre: data.fichaPaciente.nombre,
                            apellidos: data.fichaPaciente.apellidos,
                            edad: data.fichaPaciente.edad,
                            presionSistolica: data.fichaPaciente.presionSistolica,
                            presionDiastolica: data.fichaPaciente.presionDiastolica,
                            afectaciones: data.fichaPaciente.afectaciones,
                            eta: data.eta,  // Agregar ETA
                            coordenadasActuales: data.coordenadasActuales,  // Guardar coordenadas actuales
                            hospitalSeleccionado: data.hospitalSeleccionado // Guardar hospital seleccionado
                        };

                        notifications.push(notification);
                        renderNotifications(notification); 
                    }
                } else {
                    console.log("La notificación no corresponde al hospital del usuario");
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
        <p>${notification.afectaciones}</p>
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
            saveNotificationToFirestore(notification); // Guardar en Firestore antes de desaparecer
            hideNotification(notification.id); // Ocultar notificación
            notificationDiv.remove(); // Remover de la interfaz
            clearPatientData(); 
            isNotificationSelected = false;
        }, remainingTime);
    } else {
        // Si ya ha pasado el tiempo, oculta inmediatamente
        saveNotificationToFirestore(notification); // Guardar en Firestore antes de desaparecer
        hideNotification(notification.id);
        notificationDiv.remove();
        clearPatientData(); 
        isNotificationSelected = false;
    }
}

function loadPatientData(notification) {
    isNotificationSelected = true; // Indicar que hay una notificación seleccionada

    // Mostrar la ETA en el nuevo input
    document.getElementById('tiempo').value = notification.eta;

    // Actualizar los campos del paciente
    document.getElementById('patient-time').textContent = notification.time;
    document.getElementById('patient-date').textContent = notification.date;
    document.getElementById('patient-name').value = notification.nombre;
    document.getElementById('patient-lastname').value = notification.apellidos;
    document.getElementById('patient-age').value = notification.edad;
    document.getElementById('patient-blood-pressure-systolic').value = notification.presionSistolica;
    document.getElementById('patient-blood-pressure-diastolic').value = notification.presionDiastolica;
    document.getElementById('patient-conditions').value = notification.afectaciones;

    // Actualizar mapa con las coordenadas actuales del paciente
    const { latitude: latActual, longitude: lngActual } = notification.coordenadasActuales;
    const { latitude: latHospital, longitude: lngHospital } = notification.hospitalSeleccionado.coordenadas;

    updateMapWithCoordinates(latActual, lngActual, latHospital, lngHospital);
}

let patientMarker = null;
let hospitalMarker = null;

function updateMapWithCoordinates(latActual, lngActual, latHospital, lngHospital) {
    // Limpiar los marcadores anteriores si existen
    if (patientMarker) {
        patientMarker.remove();
    }
    if (hospitalMarker) {
        hospitalMarker.remove();
    }

    // Crear un nuevo marcador para la ubicación actual del paciente con un icono personalizado
    const patientIcon = document.createElement('img');
    patientIcon.src = '../images/patient-icon.png';  // Reemplazar con la ruta correcta
    patientIcon.style.width = '40px';  // Ajustar el tamaño del icono
    patientIcon.style.height = '40px';

    patientMarker = new mapboxgl.Marker({
        element: patientIcon
    })
        .setLngLat([lngActual, latActual])
        .addTo(map);

    // Crear un nuevo marcador para la ubicación del hospital con un icono personalizado
    const hospitalIcon = document.createElement('img');
    hospitalIcon.src = '../images/hospital-icon.png';  // Reemplazar con la ruta correcta
    hospitalIcon.style.width = '40px';  // Ajustar el tamaño del icono
    hospitalIcon.style.height = '40px';

    hospitalMarker = new mapboxgl.Marker({
        element: hospitalIcon
    })
        .setLngLat([lngHospital, latHospital])
        .addTo(map);

    // Centrar el mapa y ajustar el zoom para mostrar ambos puntos (paciente y hospital)
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([lngActual, latActual]); // Añadir la ubicación del paciente
    bounds.extend([lngHospital, latHospital]); // Añadir la ubicación del hospital

    map.fitBounds(bounds, {
        padding: 50, // Espacio alrededor de los puntos en píxeles
        maxZoom: 15, // Zoom máximo
        duration: 1000 // Duración de la animación en milisegundos
    });
}

mapboxgl.accessToken = 'pk.eyJ1IjoiYXhlbDc3NyIsImEiOiJjbTE5bjBzZnEwMzZzMnZvbnhneDJqcXg3In0.5210d_aHgbv_nEIj0aUdIg';

const ubicacionHospital = JSON.parse(localStorage.getItem('ubicacionHospital'));

if (ubicacionHospital) {
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [ubicacionHospital.lng, ubicacionHospital.lat],
        zoom: 12
    });

    map.on('load', function () {
        mostrarUbicacionHospital(); // Llama a la función cuando el mapa se cargue completamente
    });
} else {
    console.error("No se encontró la ubicación en localStorage.");
}

function mostrarUbicacionHospital() {
    const ubicacionHospital = JSON.parse(localStorage.getItem('ubicacionHospital'));
    
    if (ubicacionHospital) {
        const { lng, lat } = ubicacionHospital;
        map.flyTo({ center: [lng, lat], zoom: 17 });
        
        // Crear un div para el marcador personalizado
        const el = document.createElement('div');
        el.className = 'hospital-marker';
        
        el.innerHTML = `
            <div class="hospital-icon"></div>
        `;
        
        // Crear marcador con el div personalizado
        new mapboxgl.Marker(el)
            .setLngLat([lng, lat]) // Establecer la ubicación con lat y lng
            .addTo(map); // Añadir el marcador al mapa
    }
}


// Función para actualizar el mapa si no hay notificaciones seleccionadas
function updateMap() {
    if (!isNotificationSelected) {
        mostrarUbicacionHospital();
    }
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
    document.getElementById('tiempo').value = '';
    isNotificationSelected = false; // Restablecer el estado

    // Remover los marcadores si existen
    if (patientMarker) {
        patientMarker.remove();
        patientMarker = null; // Reiniciar la variable
    }
    if (hospitalMarker) {
        hospitalMarker.remove();
        hospitalMarker = null; // Reiniciar la variable
    }

    // Actualizar el mapa
    updateMap();
}


function updateTime() {
    if (!isNotificationSelected) { 
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { hour12: false });
        document.getElementById('patient-time').textContent = timeString;
        document.getElementById('patient-date').textContent = now.toLocaleDateString();

        // Actualizar el mapa
        updateMap();
    }
}

updateTime();
setInterval(updateTime, 1000);
window.onload = listenToNotifications;


