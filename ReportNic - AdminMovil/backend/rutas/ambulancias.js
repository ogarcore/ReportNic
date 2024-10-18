const express = require('express');
const router = express.Router();
const db = require('../firebaseAdmin');
const admin = require('firebase-admin');

// Obtener todas las ambulancias
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('ambulancias').get();
        const ambulancias = [];
        snapshot.forEach(doc => {
            ambulancias.push({ id: doc.id, ...doc.data() });
        });
        res.json(ambulancias);
    } catch (error) {
        console.error("Error obteniendo ambulancias:", error);
        res.status(500).json({ mensaje: 'Error al obtener ambulancias' });
    }
});

// Agregar una nueva ambulancia
router.post('/', async (req, res) => {
    const { codigo, matricula, max } = req.body;
    if (!codigo || !matricula || max === undefined) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    try {
        const nuevaAmbulancia = {
            codigo,
            matricula,
            disponibilidad: true, // Reemplaza 'availability' con 'capacidad'
            paramedicos: {
                actual: 0,       // Reemplaza 'current' con 'actual'
                max: Number(max) // 'max' se mantiene
            },
            fechaCreacion: admin.firestore.Timestamp.now() 
        };
        const docRef = await db.collection('ambulancias').add(nuevaAmbulancia);
        res.status(201).json({ id: docRef.id, ...nuevaAmbulancia });
    } catch (error) {
        console.error("Error agregando ambulancia:", error);
        res.status(500).json({ mensaje: 'Error al agregar ambulancia' });
    }
});

// Actualizar capacidad de una ambulancia
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { disponibilidad } = req.body; // Reemplaza 'availability' con 'disponibilidad'

    // Aquí debes validar 'disponibilidad' y no 'capacidad'
    if (typeof disponibilidad !== 'boolean') {
        return res.status(400).json({ mensaje: 'Disponibilidad inválida' });
    }

    try {
        const ambulanciaRef = db.collection('ambulancias').doc(id);
        const doc = await ambulanciaRef.get();
        if (!doc.exists) {
            return res.status(404).json({ mensaje: 'Ambulancia no encontrada' });
        }

        await ambulanciaRef.update({ disponibilidad });
        res.json({ id, disponibilidad });
    } catch (error) {
        console.error("Error actualizando capacidad:", error);
        res.status(500).json({ mensaje: 'Error al actualizar capacidad' });
    }
});


// Borrar una ambulancia
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const ambulanciaRef = db.collection('ambulancias').doc(id);
        const doc = await ambulanciaRef.get();
        if (!doc.exists) {
            return res.status(404).json({ mensaje: 'Ambulancia no encontrada' });
        }

        await ambulanciaRef.delete();
        res.json({ mensaje: 'Ambulancia eliminada correctamente' });
    } catch (error) {
        console.error("Error eliminando ambulancia:", error);
        res.status(500).json({ mensaje: 'Error al eliminar ambulancia' });
    }
});

router.put('/updateParamedicoCount/:codigo', async (req, res) => {
    const { codigo } = req.params;  // Asegúrate de obtener el código correctamente
    const { incremento } = req.body;  // incremento puede ser 1 o -1

    try {
        const snapshot = await db.collection('ambulancias').where('codigo', '==', codigo).get();
        const doc = snapshot.docs[0]; // Obtienes el primer documento de snapshot
        const ambulanceRef = db.collection('ambulancias').doc(doc.id); // Creas la referencia correcta


        if (snapshot.empty) {
            return res.status(404).json({ mensaje: 'Ambulancia no encontrada' });
        }

        const { paramedicos } = doc.data();
        const nuevoActual = paramedicos.actual + incremento;

        if (nuevoActual <= paramedicos.max) {
            await ambulanceRef.update({
                'paramedicos.actual': nuevoActual,
                paramedicos: nuevoActual < paramedicos.max  // Actualiza la disponibilidad
            });

            res.json({ mensaje: 'Conteo de paramédicos actualizado correctamente.' });
        } else {
            res.status(400).json({ mensaje: 'El número de paramédicos no puede exceder el máximo.' });
        }
    } catch (error) {
        console.error("Error actualizando el conteo de paramédicos:", error);
        res.status(500).json({ mensaje: 'Error al actualizar el conteo de paramédicos.' });
    }
});

router.get('/turnos', async (req, res) => {
    const { codigo } = req.query;

    try {
        const snapshot = await db.collection('Turnos')
            .where('Unidad de Ambulancia', '==', codigo)
            .get();
        
        if (snapshot.empty) {
            return res.status(404).json({ mensaje: 'No se encontraron turnos para esta ambulancia.' });
        }

        const turnos = [];
        snapshot.forEach(doc => {
            turnos.push({ id: doc.id, ...doc.data() });
        });

        res.json(turnos);
    } catch (error) {
        console.error("Error obteniendo turnos:", error);
        res.status(500).json({ mensaje: 'Error al obtener turnos' });
    }
});



module.exports = router;