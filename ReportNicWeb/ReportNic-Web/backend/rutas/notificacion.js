// server/rutas/notificacion.js

const express = require('express');
const router = express.Router();
const db = require('../firebaseAdmin');
const verifyToken = require('../middleware/auth');
const admin = require('firebase-admin');

// Endpoint para guardar notificaciones cuando se cierran
router.post('/guardar', verifyToken, async (req, res) => {
    const notification = req.body;
    const { hospital, user } = req.user;

    const collectionName = `historial_${hospital}`;
    const usuario = user;

    try {
        // Verificar que fichaPaciente está presente
        if (!notification.fichaPaciente) {
            return res.status(400).json({ mensaje: 'fichaPaciente no está definida en la notificación.' });
        }

        // Desestructurar las propiedades necesarias de fichaPaciente
        const { nombre, apellidos, edad, presionSistolica, presionDiastolica, afectaciones } = notification.fichaPaciente;

        // Validar que ninguna propiedad requerida sea undefined
        if (
            nombre === undefined ||
            apellidos === undefined ||
            edad === undefined ||
            presionSistolica === undefined ||
            presionDiastolica === undefined ||
            afectaciones === undefined
        ) {
            return res.status(400).json({ mensaje: 'Faltan campos en fichaPaciente.' });
        }

        // Crear el objeto a guardar en Firestore
        const dataToSave = {
            id: notification.id || '',
            nombre: nombre,
            apellidos: apellidos,
            edad: edad,
            presionSistolica: presionSistolica,
            presionDiastolica: presionDiastolica,
            afectaciones: afectaciones,
            eta: notification.eta || '',
            fechaYHora: admin.firestore.FieldValue.serverTimestamp(),
            usuario: usuario 
        };

        // Guardar en Firestore
        await db.collection(collectionName).add(dataToSave);
        res.status(200).json({ mensaje: 'Notificación guardada en Firestore.' });
    } catch (error) {
        console.error('Error al guardar notificación:', error);
        res.status(500).json({ mensaje: 'Error en el servidor.' });
    }
});

module.exports = router;
