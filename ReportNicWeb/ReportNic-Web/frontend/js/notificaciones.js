// client/notificaciones.js

// Configurar el Access Token de Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiYXhlbDc3NyIsImEiOiJjbTE5bjBzZnEwMzZzMnZvbnhneDJqcXg3In0.5210d_aHgbv_nEIj0aUdIg'; 

let socket;
let notifications = [];
const notificationTimeout = 120000; // 2 minutos
let isNotificationSelected = false; // Para saber si hay una notificación seleccionada
let patientMarker = null;
let hospitalMarker = null;
let map; // Declarar map globalmente

// Función para obtener el token JWT del almacenamiento
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Función para decodificar el token y obtener los datos del usuario
function getUserData() {
    const token = getToken();
    if (!token) return null;
    try {
        return jwt_decode(token);
    } catch (error) {
        console.error('Error decodificando el token:', error);
        return null;
    }
}

// Función para obtener hiddenNotifications desde el token
function getHiddenNotifications() {
    const userData = getUserData();
    return userData ? userData.notificaciones || [] : [];
}

// Función para inicializar la conexión Socket.io
function initializeSocket() {
    const token = getToken();
    if (!token) {
        console.error('No se encontró el token JWT.');
        return;
    }

    socket = io('http://localhost:3003', {
        auth: {
            token: token
        }
    });

    socket.on('connect', () => {
        console.log('Conectado al servidor de notificaciones.');
    });

    socket.on('nuevaNotificacion', (notification) => {
        // Filtrar notificaciones ya ocultas
        if (!getHiddenNotifications().includes(notification.id)) {
            notifications.push(notification);
            renderNotifications(notification);
        }
    });

    socket.on('disconnect', () => {
        console.log('Desconectado del servidor de notificaciones.');
    });

    socket.on('connect_error', (err) => {
        console.error('Error de conexión con Socket.io:', err.message);
    });
}

// Función para agregar una notificación a hiddenNotifications
async function addHiddenNotification(notificationId) {
    const token = getToken();
    if (!token) {
        console.error('No se encontró el token JWT.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3003/api/notificacion/hidden', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notificationId })
        });

        const data = await response.json();

        if (response.ok) {
            // Actualizar el token en el almacenamiento local
            localStorage.setItem('token', data.token) || sessionStorage.setItem('token', data.token);
            console.log('hiddenNotifications actualizado y token renovado.');
        } else {
            console.error('Error al actualizar hiddenNotifications:', data.mensaje);
        }
    } catch (error) {
        console.error('Error al actualizar hiddenNotifications:', error);
    }
}

// Función para guardar la notificación en Firestore a través del backend
async function saveNotificationToFirestore(notification) {
    // Añadir la notificación a la lista de ocultas
    await addHiddenNotification(notification.id);

    // Enviar la notificación al backend para que se guarde en Firestore
    try {
        const response = await fetch('http://localhost:3003/api/notificacion/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(notification) // Enviar el objeto de notificación completo
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Notificación guardada en Firestore:', data.mensaje);
        } else {
            console.error('Error al guardar la notificación:', data.mensaje);
        }
    } catch (error) {
        console.error('Error al enviar la notificación al backend:', error);
    }
}

// Función para renderizar las notificaciones en el HTML
// Función para renderizar las notificaciones en el HTML
function renderNotifications(notification) {
    const notificationsContainer = document.getElementById('notifications');
    const notificationDiv = document.createElement('div');
    let closedManually = false; // Para controlar si se cierra manualmente

    notificationDiv.classList.add('notification', 'fadeInDown');
    notificationDiv.setAttribute('data-id', notification.id); // Para facilitar la eliminación
    notificationDiv.innerHTML = 
        `<h3>Emergencia en camino</h3>
        <p>Hora: ${notification.time}</p>
        <p>${notification.fichaPaciente.afectaciones}</p>
        <button class="close-btn">&times;</button>`;

    notificationDiv.addEventListener('click', () => loadPatientData(notification));

    // Evento para cerrar manualmente la notificación (al hacer clic en el botón "x")
    notificationDiv.querySelector('.close-btn').addEventListener('click', async (e) => {
        e.stopPropagation(); 
        closedManually = true; // Marcar que se cerró manualmente
        await saveNotificationToFirestore(notification); // Guardar en Firestore al cerrar manualmente
        hideNotification(notification.id); // Ocultar notificación
        notificationDiv.remove(); // Remover de la interfaz
        clearPatientData(); // Limpiar la ficha al cerrar la notificación
        isNotificationSelected = false; // Restablecer el estado
    });

    notificationsContainer.appendChild(notificationDiv);

    // Convertir 'createdAt' a Date
    const notificationCreatedAt = new Date(notification.createdAt);
    const timeElapsed = new Date() - notificationCreatedAt; // Tiempo transcurrido en ms
    const remainingTime = notificationTimeout - timeElapsed;

    // Solo ocultar si el tiempo restante es positivo
    if (remainingTime > 0) {
        setTimeout(async () => {
            if (!closedManually) {
                await saveNotificationToFirestore(notification); // Guardar en Firestore antes de desaparecer
                hideNotification(notification.id); // Ocultar notificación
                notificationDiv.remove(); // Remover de la interfaz
                clearPatientData(); 
                isNotificationSelected = false;
            }
        }, remainingTime);
    } else {
        // Si ya ha pasado el tiempo, oculta inmediatamente si no se cerró manualmente
        if (!closedManually) {
            saveNotificationToFirestore(notification); // Guardar en Firestore antes de desaparecer
            hideNotification(notification.id);
            notificationDiv.remove();
            clearPatientData(); 
            isNotificationSelected = false;
        }
    }
}


// Función para cargar los datos del paciente en la ficha
function loadPatientData(notification) {
    isNotificationSelected = true; // Indicar que hay una notificación seleccionada

    // Mostrar la ETA en el input
    document.getElementById('tiempo').value = notification.eta;

    // Actualizar los campos del paciente
    document.getElementById('patient-time').textContent = notification.time;
    document.getElementById('patient-date').textContent = notification.date;
    document.getElementById('patient-name').value = notification.fichaPaciente.nombre;
    document.getElementById('patient-lastname').value = notification.fichaPaciente.apellidos;
    document.getElementById('patient-age').value = notification.fichaPaciente.edad;
    document.getElementById('patient-blood-pressure-systolic').value = notification.fichaPaciente.presionSistolica;
    document.getElementById('patient-blood-pressure-diastolic').value = notification.fichaPaciente.presionDiastolica;
    document.getElementById('patient-conditions').value = notification.fichaPaciente.afectaciones;

    // Actualizar mapa con las coordenadas actuales del paciente
    const { latitude: latActual, longitude: lngActual } = notification.coordenadasActuales;
    const { latitude: latHospital, longitude: lngHospital } = notification.hospitalSeleccionado.coordenadas;

    updateMapWithCoordinates(latActual, lngActual, latHospital, lngHospital);
}

// Función para actualizar el mapa con las coordenadas
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

// Función para inicializar el mapa
function initializeMap() {
    const userData = getUserData();
    if (!userData) {
        console.error('No se encontró la información del usuario en el token.');
        return;
    }

    const ubicacionHospital = userData.ubicacionHospital;

    if (ubicacionHospital) {
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [ubicacionHospital.lng, ubicacionHospital.lat],
            zoom: 12
        });

        map.on('load', function () {
            mostrarUbicacionHospital();
        });
    } else {
        console.error("No se encontró la ubicación en el token.");
    }
}

// Función para mostrar la ubicación del hospital en el mapa
function mostrarUbicacionHospital() {
    const userData = getUserData();
    const ubicacionHospital = userData.ubicacionHospital;

    if (ubicacionHospital) {
        const { lng, lat } = ubicacionHospital;
        map.flyTo({ center: [lng, lat], zoom: 17 });

        // Crear un div para el marcador personalizado
        const el = document.createElement('div');
        el.className = 'hospital-marker';
        el.innerHTML = `<div class="hospital-icon"></div>`;

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

// Función para limpiar los datos del paciente
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

// Función para actualizar la hora y fecha cada segundo
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

// Función para manejar la inicialización de la aplicación
function initializeApp() {
    initializeMap();
    initializeSocket();
    updateTime();
    setInterval(updateTime, 1000);
}

function hideNotification(notificationId) {
    const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
    if (notificationElement) {
        notificationElement.remove();  // Elimina el elemento de la interfaz
        console.log(`Notificación ${notificationId} ocultada.`);
    }
}



window.onload = initializeApp;
