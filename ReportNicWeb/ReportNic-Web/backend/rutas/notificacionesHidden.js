// server/rutas/notificacionesHidden.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/auth');
const dotenv = require('dotenv');

dotenv.config();

// Ruta para agregar una notificación a hiddenNotifications
router.post('/hidden', verifyToken, (req, res) => {
    const { notificationId } = req.body;
    const { notificaciones } = req.user; // 'notificaciones' son los hiddenNotifications

    if (!notificationId) {
        return res.status(400).json({ mensaje: 'ID de notificación requerido.' });
    }

    // Evitar duplicados
    const updatedNotificaciones = notificaciones.includes(notificationId)
        ? notificaciones
        : [...notificaciones, notificationId];

    // Crear un nuevo token con 'notificaciones' actualizadas
    const newToken = jwt.sign(
        {
            ...req.user,
            notificaciones: updatedNotificaciones
        },
        process.env.JWT_SECRET
    );

    res.status(200).json({ token: newToken });
});

module.exports = router;
