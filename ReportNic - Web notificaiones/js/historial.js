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


document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const searchName = document.getElementById("search-name").value.trim();
    const searchLastName = document.getElementById("search-lastname").value.trim();
    const searchDate = document.getElementById("search-date").value;

    let collectionRef = collection(db, "Emergencias");  
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
