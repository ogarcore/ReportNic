import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

const loginForm = document.querySelector('form');
const userField = document.getElementById('user');
const passwordField = document.getElementById('password');
const hospitalField = document.getElementById('hospital');

async function verificarCredenciales(usuario, contraseña, hospital) {
    let collectionName;
    
    // Determinar la colección según el hospital seleccionado
    if (hospital === 'hospitalVelezPaiz') {
        collectionName = 'usuario_hospitalVelezPaiz';
    } else if (hospital === 'hospitalBautista') {
        collectionName = 'usuario_hospitalBautista';
    } else {
        return false;  // Si no se selecciona un hospital válido
    }

    try {
        const usuariosCollection = collection(db, collectionName);
        const snapshot = await getDocs(usuariosCollection);
        let usuarioValido = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.user === usuario && data.password === contraseña) {
                usuarioValido = true;
            }
        });

        return usuarioValido;
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

    const esValido = await verificarCredenciales(usuario, contrasena, hospital);

    if (esValido) {
        // Guardar el nombre del usuario y hospital en localStorage
        localStorage.setItem('usuario', usuario);
        localStorage.setItem('hospital', hospital);
        localStorage.setItem('notificaciones', JSON.stringify([])); // Inicializar array vacío de notificaciones
        window.location.href = 'inicio.html';  
    } else {
        errorMessageDiv.textContent = 'Usuario, contraseña o hospital incorrectos'; 
        errorMessageDiv.style.display = 'block';  
    }
});



