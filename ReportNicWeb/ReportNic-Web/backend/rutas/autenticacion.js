const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../firebaseAdmin');
const router = express.Router();
const dotenv = require('dotenv');

// Cargar las variables de entorno
dotenv.config();

const ENCRYPTION_KEY = process.env.SECRET_KEY;
const IV_LENGTH = 16;
const JWT_SECRET = process.env.JWT_SECRET;

// Función para desencriptar la contraseña
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Ruta de login
router.post('/login', async (req, res) => {
    const { user, password, hospital } = req.body; // Asegúrate de recibir 'hospital' del frontend

    try {
        // Crear el nombre de la colección dinámicamente
        const usersCollectionName = `usuarios_${hospital}`;
        console.log(usersCollectionName);
        const usersCollectionRef = db.collection(usersCollectionName);

        // Buscar el usuario en la colección correspondiente
        const snapshot = await usersCollectionRef.where('user', '==', user).get();

        if (snapshot.empty) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        let validUser = false;
        let userData = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const decryptedPassword = decrypt(data.password);

            if (decryptedPassword === password) {
                validUser = true;
                userData = {
                    user: data.user,
                    ubicacionHospital: {
                        lat: data.ubicacionHospital._latitude,
                        lng: data.ubicacionHospital._longitude
                    },
                    hospital: hospital,  // Guardamos el hospital seleccionado
                    notificaciones: []  // Inicializamos notificaciones vacías
                };
            }
        });

        if (validUser) {
            // Incluir toda la información en el JWT
            const token = jwt.sign(userData, JWT_SECRET);

            return res.status(200).json({ token });
        } else {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('Error durante la autenticación', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
