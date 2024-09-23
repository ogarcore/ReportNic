import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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


document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const searchName = document.getElementById("search-name").value.trim();
    const searchLastName = document.getElementById("search-lastname").value.trim();
    const searchDate = document.getElementById("search-date").value;

    let collectionRef = collection(db, "coleccion");  
    let q = query(collectionRef); 


    if (searchName) {
        q = query(q, where("firstName", "==", searchName));
    }
    if (searchLastName) {
        q = query(q, where("lastName", "==", searchLastName));
    }
    if (searchDate) {

        const startOfDay = new Date(`${searchDate}T00:00:00`);  
        const endOfDay = new Date(`${searchDate}T23:59:59`);  

        const startTimestamp = Timestamp.fromDate(startOfDay);  
        const endTimestamp = Timestamp.fromDate(endOfDay);


        q = query(collectionRef, where("dateTime", ">=", startTimestamp), where("dateTime", "<=", endTimestamp));
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
            alert("No se encontraron coincidencias.");
        }
    } catch (error) {
        console.error("Error al buscar documentos: ", error);
    }
});
