const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const router = express.Router();

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
    const serviceAccountPath = path.resolve(__dirname, '../', process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://reportnicdb.firebaseio.com"
    });
}

const db = admin.firestore();

// Ruta para generar el hash de una contraseña
router.post('/generar-hash', async (req, res) => {
    const { contrasena } = req.body;

    if (!contrasena) {
        return res.status(400).json({ mensaje: 'La contraseña es requerida.' });
    }

    try {
        const saltRounds = 10;
        const contrasenaHashed = await bcrypt.hash(contrasena, saltRounds);
        res.status(200).json({ hash: contrasenaHashed });
    } catch (error) {
        console.error("Error al generar hash:", error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
});

// Ruta para manejar el login
router.post('/login', async (req, res) => {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
        return res.status(400).json({ mensaje: 'Usuario y contraseña son requeridos.' });
    }

    try {
        const usuariosCollection = db.collection('usuarios_admin_movil');
        const snapshot = await usuariosCollection.where('user', '==', usuario).limit(1).get();

        if (snapshot.empty) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        const passwordMatch = await bcrypt.compare(contraseña, data.password);

        if (passwordMatch) {
            const token = jwt.sign(
                { usuario: data.user, id: doc.id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.status(200).json({ mensaje: 'Autenticación exitosa.', token });
        } else {
            res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
        }
    } catch (error) {
        console.error("Error al verificar credenciales:", error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
});

module.exports = router;
