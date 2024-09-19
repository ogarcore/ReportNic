// Importa Firebase y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

// Referencias a los elementos del formulario
const loginForm = document.querySelector('form');
const userField = document.getElementById('text');
const passwordField = document.getElementById('password');

// Función para verificar usuario y contraseña
async function verificarCredenciales(usuario, contrasena) {
    try {
        const usuariosCollection = collection(db, 'usuarios_hospitales');
        const snapshot = await getDocs(usuariosCollection);
        let usuarioValido = false;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.user === usuario && data.password === contrasena) {
                usuarioValido = true;
            }
        });

        return usuarioValido;
    } catch (error) {
        console.error("Error al verificar credenciales:", error);
        return false;
    }
}

// Evento al enviar el formulario
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();  // Evitar el envío del formulario por defecto

    const usuario = userField.value;
    const contrasena = passwordField.value;
    const errorMessageDiv = document.getElementById('error-message');  // Selecciona el div del error

    // Limpiar mensaje de error anterior
    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    const esValido = await verificarCredenciales(usuario, contrasena);

    if (esValido) {
        window.location.href = 'inicio.html';  // Redirigir a la página de inicio
    } else {
        errorMessageDiv.textContent = 'Usuario o contraseña incorrectos';  // Mostrar el mensaje de error
        errorMessageDiv.style.display = 'block';  // Hacerlo visible
    }
});
