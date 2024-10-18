const express = require('express');
const router = express.Router();
const db = require('../firebaseAdmin');

// Función para formatear la fecha y hora
const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Obtener turnos que no están en turno
router.get('/', async (req, res) => {
    try {
        const turnosSnapshot = await db.collection('Turnos').where('enTurno', '==', false).get();
        const turnos = [];

        turnosSnapshot.forEach(doc => {
            const data = doc.data();
            turnos.push({
                IdParamedico: data.IdParamedico,
                InicioTurno: formatDate(data['Inicio de Turno']),
                FinalTurno: formatDate(data['Final de Turno']),
                UnidadAmbulancia: data['Unidad de Ambulancia'],
                Apellido: data.apellido,
                Nombre: data.nombre
            });
        });

        res.json(turnos);
    } catch (error) {
        console.error('Error al obtener los turnos:', error);
        res.status(500).json({ mensaje: 'Error al obtener los turnos' });
    }
});

module.exports = router;
