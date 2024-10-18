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
    const { user, password, hospital } = req.body;

    try {
        const usersCollectionName = `usuarios_${hospital}`;
        const usersCollectionRef = db.collection(usersCollectionName);

        const snapshot = await usersCollectionRef.where('user', '==', user).get();

        if (snapshot.empty) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        let validUser = false;
        let userData = {};

        // Usamos un bucle for...of para esperar la verificación de cada documento
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const decryptedPassword = decrypt(data.password);

            if (decryptedPassword === password) {
                validUser = true;

                // Verificamos la suscripción antes de continuar
                if (data.acceso !== true) {
                    return res.status(403).json({
                        error: 'No tiene permitido entrar a ReportNic-Web, por favor contacte a un administrador o mande un mensaje a support@reportnic.ni'
                    }); // Enviamos la respuesta y salimos de la función
                }

                userData = {
                    user: data.user,
                    ubicacionHospital: {
                        lat: data.ubicacionHospital._latitude,
                        lng: data.ubicacionHospital._longitude
                    },
                    hospital: hospital,
                    notificaciones: []
                };

                break; // Si encontramos un usuario válido, salimos del bucle
            }
        }

        if (validUser) {
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
