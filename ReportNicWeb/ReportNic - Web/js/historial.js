import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
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

document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const searchName = document.getElementById("search-name").value.trim();
    const searchLastName = document.getElementById("search-lastname").value.trim();
    const searchDate = document.getElementById("search-date").value;
    
    // Limpiar cualquier mensaje de error previo
    const errorMessageDiv = document.getElementById("error-message");
    errorMessageDiv.textContent = "";  // Limpiar el mensaje de error

    const hospital = localStorage.getItem("hospital");

    let historialCollection = "";
    if (hospital === "hospitalCarlosRobertoHuembes(Filial El Carmen)") {
        historialCollection = "historial_HospitalCarlosRobertoHuembes";
    } else if (hospital === "hospitalSuMedico") {
        historialCollection = "historial_HospitalSuMedico";
    } else {
        alert("Hospital no encontrado en el localStorage");
        return;
    }

    let collectionRef = collection(db, historialCollection);
    let q = query(collectionRef);

    if (searchName) {
        q = query(q, where("nombre", "==", searchName));
    }
    if (searchLastName) {
        q = query(q, where("apellidos", "==", searchLastName));
    }
    if (searchDate) {
        const startOfDay = new Date(`${searchDate}T00:00:00`);
        const endOfDay = new Date(`${searchDate}T23:59:59`);

        const startTimestamp = Timestamp.fromDate(startOfDay);
        const endTimestamp = Timestamp.fromDate(endOfDay);

        q = query(q, where("fechaYHora", ">=", startTimestamp), where("fechaYHora", "<=", endTimestamp));
    }

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });

            localStorage.setItem("searchResults", JSON.stringify(results));

            window.location.href = "resultados.html";
        } else {
            // Mostrar el mensaje de error debajo del campo de fecha si no se encuentran coincidencias
            errorMessageDiv.textContent = "No se encontraron coincidencias.";
        }
    } catch (error) {
        console.error("Error al buscar documentos: ", error);
        errorMessageDiv.textContent = "Ocurrió un error al buscar. Inténtalo de nuevo.";
    }
});

