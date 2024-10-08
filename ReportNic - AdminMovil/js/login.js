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
const userField = document.getElementById('text');
const passwordField = document.getElementById('password');

// Función para cifrar el usuario
function cifrarUsuario(usuario) {
    const clave = 'clave'; // Define una clave para la encriptación
    let cifrado = '';
    for (let i = 0; i < usuario.length; i++) {
        cifrado += String.fromCharCode(usuario.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
    }
    return cifrado;
}

// Función para descifrar el usuario
function descifrarUsuario(usuarioCifrado) {
    const clave = 'clave'; // Usa la misma clave que para cifrar
    let descifrado = '';
    for (let i = 0; i < usuarioCifrado.length; i++) {
        descifrado += String.fromCharCode(usuarioCifrado.charCodeAt(i) ^ clave.charCodeAt(i % clave.length));
    }
    return descifrado;
}

async function verificarCredenciales(usuario, contrasena) {
    try {
        const usuariosCollection = collection(db, 'usuarios_admin_movil');
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

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();  

    const usuario = userField.value;
    const contraseña = passwordField.value;
    const errorMessageDiv = document.getElementById('error-message');  

    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    const esValido = await verificarCredenciales(usuario, contraseña);

    if (esValido) {
        // Cifrar el nombre de usuario antes de almacenarlo
        const usuarioCifrado = cifrarUsuario(usuario);
        
        // Guardar en localStorage o sessionStorage según el checkbox
        if (checkbox.checked) {
            localStorage.setItem('usuario', usuarioCifrado);
        } else {
            sessionStorage.setItem('usuario', usuarioCifrado);
        }

        window.location.href = 'administrador.html';  
    } else {
        errorMessageDiv.textContent = 'Usuario o contraseña incorrectos'; 
        errorMessageDiv.style.display = 'block';  
    }
});
