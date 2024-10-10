const express = require('express');
const crypto = require('crypto');
const db = require('../firebaseAdmin');
const router = express.Router();
const dotenv = require('dotenv');

// Cargar las variables de entorno
dotenv.config();

// Acceder a la clave desde el archivo .env
const ENCRYPTION_KEY = process.env.SECRET_KEY; // Obtenemos la clave desde .env
const IV_LENGTH = 16; // Para AES, el IV siempre es de 16 bytes

// Función para encriptar la contraseña
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv); // Usar Buffer.from sin 'hex'
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Función para desencriptar la contraseña
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv); // Usar Buffer.from sin 'hex'
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Ruta de login
router.post('/login', async (req, res) => {
    const { user, password } = req.body;

    try {
        const usersCollection = db.collection('usuarios_admin_movil');
        const snapshot = await usersCollection.where('user', '==', user).get();

        if (snapshot.empty) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        let validUser = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            const decryptedPassword = decrypt(data.password);
            if (decryptedPassword === password) {
                validUser = true;
            }
        });

        if (validUser) {
            return res.status(200).json({ message: 'Login exitoso' });
        } else {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('Error durante la autenticación', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
