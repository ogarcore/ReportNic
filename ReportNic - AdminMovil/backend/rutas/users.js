const express = require('express');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const db = admin.firestore();

// Ruta para obtener todos los usuarios en tiempo real
router.get('/all', async (req, res) => {
    try {
        const usersCollection = db.collection('usuarios_moviles');
        const snapshot = await usersCollection.orderBy('Fecha de Creacion', 'desc').get();

        if (snapshot.empty) {
            return res.status(404).json({ mensaje: 'No se encontraron usuarios.' });
        }

        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar usuarios.' });
    }
});

// Ruta para crear un nuevo usuario
router.post('/create', async (req, res) => {
    const { nombre, apellido, cedula, telefono, email, password } = req.body;

    if (!nombre || !apellido || !cedula || !telefono || !email || !password) {
        return res.status(400).json({ mensaje: 'Todos los campos son requeridos.' });
    }

    try {
        const nuevoUsuario = {
            id: uuidv4(),
            nombre,
            apellido,
            cedula,
            telefono,
            email,
            password,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('usuarios_moviles').doc(nuevoUsuario.id).set(nuevoUsuario);
        res.status(201).json({ mensaje: 'Usuario creado exitosamente.', user: nuevoUsuario });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear usuario.' });
    }
});

// Ruta para eliminar un usuario
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const userDoc = db.collection('usuarios_moviles').doc(id);
        await userDoc.delete();
        res.status(200).json({ mensaje: 'Usuario eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el usuario.' });
    }
});

module.exports = router;
