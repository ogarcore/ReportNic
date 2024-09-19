import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

// Función para manejar la búsqueda
document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const searchName = document.getElementById("search-name").value.trim();
    const searchLastName = document.getElementById("search-lastname").value.trim();
    const searchDate = document.getElementById("search-date").value;

    let collectionRef = collection(db, "coleccion");  // Referencia a la colección
    let q = query(collectionRef);  // Inicializar la query

    // Crear condiciones basadas en los inputs
    if (searchName) {
        q = query(q, where("firstName", "==", searchName));
    }
    if (searchLastName) {
        q = query(q, where("lastName", "==", searchLastName));
    }
    if (searchDate) {
        // Convertir la fecha ingresada (YYYY-MM-DD) a un rango de timestamps
        const startOfDay = new Date(`${searchDate}T00:00:00`);  // Ajustar a la medianoche
        const endOfDay = new Date(`${searchDate}T23:59:59`);  // Ajustar a las 23:59:59

        const startTimestamp = Timestamp.fromDate(startOfDay);  // Convertir a Timestamp de Firestore
        const endTimestamp = Timestamp.fromDate(endOfDay);

        // Ajustar la consulta para incluir el rango de fechas en una única query
        q = query(collectionRef, where("dateTime", ">=", startTimestamp), where("dateTime", "<=", endTimestamp));
    }

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });

            // Guardar los resultados en el localStorage para usarlos en resultados.html
            localStorage.setItem("searchResults", JSON.stringify(results));

            // Redirigir a la página de resultados
            window.location.href = "resultados.html";
        } else {
            alert("No se encontraron coincidencias.");
        }
    } catch (error) {
        console.error("Error al buscar documentos: ", error);
    }
});

// Menú del perfil
document.addEventListener("DOMContentLoaded", function() {
    const profileMenu = document.getElementById("profileMenu");
    const dropdownMenu = document.getElementById("dropdownMenu");

    profileMenu.addEventListener("click", function(e) {
        e.stopPropagation();
        profileMenu.classList.toggle("active");
    });

    document.addEventListener("click", function(e) {
        if (!profileMenu.contains(e.target)) {
            profileMenu.classList.remove("active");
        }
    });
});
