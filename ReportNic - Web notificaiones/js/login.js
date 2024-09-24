import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
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

const loginForm = document.querySelector('form');
const userField = document.getElementById('user');
const passwordField = document.getElementById('password');
const hospitalField = document.getElementById('hospital');

async function verificarCredenciales(usuario, contraseña, hospital) {
    let collectionName;
    
    // Determinar la colección según el hospital seleccionado
    if (hospital === 'hospitalCarlosRobertoHuembes(Filial El Carmen)') {
        collectionName = 'usuario_HospitalCarlosRobertoHuembes';
    } else if (hospital === 'hospitalSuMedico') {
        collectionName = 'usuario_HospitalSuMedico';
    } else {
        return false;  // Si no se selecciona un hospital válido
    }

    try {
        const usuariosCollection = collection(db, collectionName);
        const snapshot = await getDocs(usuariosCollection);
        let usuarioValido = false;
        let ubicacionHospital = ''; // Variable para guardar la ubicación

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.user === usuario && data.password === contraseña) {
                usuarioValido = true;
                
                // Convertir el GeoPoint a un objeto con latitud y longitud
                const ubicacion = data.ubicacionHospital;  // Obtenemos el GeoPoint
                ubicacionHospital = {
                    lat: ubicacion.latitude,
                    lng: ubicacion.longitude
                };
            }
        });

        // Si el usuario es válido, devolver también la ubicación
        return { usuarioValido, ubicacionHospital };
    } catch (error) {
        console.error("Error al verificar credenciales:", error);
        return false;
    }
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();  

    const usuario = userField.value;
    const contrasena = passwordField.value;
    const hospital = hospitalField.value;
    const errorMessageDiv = document.getElementById('error-message');  

    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    if (!hospital) {
        errorMessageDiv.textContent = 'Por favor, seleccione un hospital.';
        errorMessageDiv.style.display = 'block';
        return;
    }

    const resultado = await verificarCredenciales(usuario, contrasena, hospital);

    if (resultado.usuarioValido) {
        // Guardar el nombre del usuario, hospital y ubicación en localStorage
        localStorage.setItem('usuario', usuario);
        localStorage.setItem('hospital', hospital);
        
        // Aquí debes referenciar el `ubicacionHospital` del `resultado`
        localStorage.setItem('ubicacionHospital', JSON.stringify(resultado.ubicacionHospital));  // Usar resultado.ubicacionHospital
    
        localStorage.setItem('notificaciones', JSON.stringify([])); // Inicializar array vacío de notificaciones
        window.location.href = 'inicio.html';  
    } else {
        errorMessageDiv.textContent = 'Usuario, contraseña o hospital incorrectos'; 
        errorMessageDiv.style.display = 'block';  
    }
});
