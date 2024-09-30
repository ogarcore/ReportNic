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

const loginForm = document.querySelector('form');
const userField = document.getElementById('text');
const passwordField = document.getElementById('password');

async function verificarCredenciales(usuario, contrasena) {
    try {
        const usuariosCollection = collection(db, 'usuarios_admin_web');
        const snapshot = await getDocs(usuariosCollection);
        
        let usuarioValido = false;
        let usuarioData = null;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.user === usuario && data.password === contrasena) {
                usuarioValido = true;
                usuarioData = data;  // Guardamos los datos del usuario
            }
        });

        return { usuarioValido, usuarioData };
    } catch (error) {
        console.error("Error al verificar credenciales:", error);
        return { usuarioValido: false, usuarioData: null };
    }
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();  

    const usuario = userField.value;
    const contraseña = passwordField.value;
    const errorMessageDiv = document.getElementById('error-message');  

    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    const { usuarioValido, usuarioData } = await verificarCredenciales(usuario, contraseña);

    if (usuarioValido && usuarioData) {
        // Guardar datos en localStorage
        localStorage.setItem('user', usuarioData.user);
        localStorage.setItem('hospital', usuarioData.hospital);

        window.location.href = 'administrador.html';  
    } else {
        errorMessageDiv.textContent = 'Usuario o contraseña incorrectos'; 
        errorMessageDiv.style.display = 'block';  
    }
});
