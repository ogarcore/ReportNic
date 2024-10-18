const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../firebaseAdmin');
const router = express.Router();
const dotenv = require('dotenv');

// Cargar las variables de entorno
dotenv.config();

const ENCRYPTION_KEY = process.env.SECRET_KEY; // 32 bytes para AES-256
const IV_LENGTH = 16; // Longitud del IV es de 16 bytes
const JWT_SECRET = process.env.JWT_SECRET; // Definir una clave secreta para JWT

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
    const { user, password } = req.body;

    try {
        const usersCollection = db.collection('usuarios_admin_web');
        const snapshot = await usersCollection.where('user', '==', user).get();

        if (snapshot.empty) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        let validUser = false;
        let userData = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const decryptedPassword = decrypt(data.password); // Desencriptar la contraseña almacenada

            if (decryptedPassword === password) {
                validUser = true;
                userData = {
                    user: data.user,
                    hospital: data.hospital,
                    ubicacionHospital: {
                        _latitude: data.ubicacionHospital._latitude,
                        _longitude: data.ubicacionHospital._longitude
                    }
                };
            }
        });

        if (validUser) {
            // Generar un JWT
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

router.get('/hospitalData', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Obtener el token de la cabecera
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = decoded.user;

        const usersCollection = db.collection('usuarios_admin_web');
        const snapshot = await usersCollection.where('user', '==', user).get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        let hospitalData = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            hospitalData = {
                tipoHospital: data.tipoHospital, // Obtener el tipo de hospital
                suscripcion: data.suscripcion // Obtener el estado de suscripción (booleano)
            };
        });

        // Incluir el tipoHospital en el token
        const updatedToken = jwt.sign({ ...decoded, tipoHospital: hospitalData.tipoHospital }, JWT_SECRET);

        return res.status(200).json({ ...hospitalData, token: updatedToken });
    } catch (error) {
        console.error('Error al obtener el tipo de hospital y suscripción', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
