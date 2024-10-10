const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(express.json());

// Inicializar Firebase Admin
if (!admin.apps.length) {
    const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://reportnicdb.firebaseio.com"
    });
}

const db = admin.firestore();

// Clave y vector de inicialización para cifrado AES
const algorithm = 'aes-256-cbc';
const secretKey = process.env.SECRET_KEY;

// Función para encriptar la contraseña
function encryptPassword(password) {
    const iv = crypto.randomBytes(16); // Generar un IV de 16 bytes
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(password, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // IV y texto cifrado separados por ":"
}

// Ruta para actualizar la contraseña del usuario en Firebase
app.put('/update-password', async (req, res) => {
    const { password } = req.body;

    try {
        // Encriptar la contraseña
        const encryptedPassword = encryptPassword(password);

        // Referencia al documento que deseas actualizar
        const userRef = db.collection('usuarios_moviles').doc('4his0CQUpWcsGPuuZVL1igmgZ1T2');

        // Actualizar el campo de la contraseña
        await userRef.update({ contraseña: encryptedPassword });

        res.status(200).send('Contraseña actualizada correctamente');
    } catch (error) {
        console.error('Error actualizando la contraseña:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
