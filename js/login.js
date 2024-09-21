
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
const userField = document.getElementById('text');
const passwordField = document.getElementById('password');


async function verificarCredenciales(usuario, contrasena) {
    try {
        const usuariosCollection = collection(db, 'usuarios_administradores_hospitales');
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
    const contrasena = passwordField.value;
    const errorMessageDiv = document.getElementById('error-message');  


    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    const esValido = await verificarCredenciales(usuario, contrasena);

    if (esValido) {
        window.location.href = 'inicio.html';  
    } else {
        errorMessageDiv.textContent = 'Usuario o contraseña incorrectos'; 
        errorMessageDiv.style.display = 'block';  
    }
});
