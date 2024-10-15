const express = require('express');
const crypto = require('crypto');
const db = require('../firebaseAdmin');
const router = express.Router();
const dotenv = require('dotenv');

// Cargar las variables de entorno
dotenv.config();

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
            data.password;
            if (data.password === password) {
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
