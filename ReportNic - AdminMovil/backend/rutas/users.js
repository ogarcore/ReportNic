const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin'); // Importar admin
const db = require('../firebaseAdmin'); // Importar la conexión a Firestore
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const router = express.Router();

// Función para encriptar contraseñas
function encryptPassword(password) {
    const ENCRYPTION_KEY = process.env.SECRET_KEY; // Asegúrate de que la clave tenga 32 bytes
    const iv = crypto.randomBytes(16); // Inicialización del vector
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex'); // Devolver el IV y el texto cifrado
}

// Ruta para generar y guardar un código en Firestore
router.post('/generarCodigo', async (req, res) => {
    const { codigo } = req.body;

    if (!codigo) {
        return res.status(400).json({ mensaje: 'El código es requerido.' });
    }

    try {
        await db.collection('codigos').add({
            codigo,
            valido: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp(), // Cambiar esto a usar FieldValue
        });
        res.status(200).json({ success: true, codigo });
    } catch (error) {
        console.error('Error al guardar el código:', error);
        res.status(500).json({ success: false, mensaje: 'Error al guardar el código.' });
    }
});


// Función para desencriptar contraseñas
function decryptPassword(encryptedPassword) {
    const ENCRYPTION_KEY = process.env.SECRET_KEY; // Clave de encriptación
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString(); // Devuelve la contraseña desencriptada
}

// Modifica la ruta para obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const usersSnapshot = await db.collection('usuarios_moviles').orderBy('Fecha de Creacion', 'desc').get();
        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                contraseña: decryptPassword(data.contraseña) // Desencriptar la contraseña
            };
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener los usuarios.' });
    }
});

// Ruta para buscar usuarios
// Ruta para buscar usuarios
router.get('/search', async (req, res) => {
    const searchValue = req.query.query;

    if (!searchValue) {
        return res.status(400).json({ mensaje: 'El valor de búsqueda es requerido.' });
    }

    try {
        const usersRef = db.collection('usuarios_moviles');
        const qNombre = usersRef.where('nombre', '==', searchValue).get();
        const qApellido = usersRef.where('apellido', '==', searchValue).get();
        const qCedula = usersRef.where('cedula', '==', searchValue).get();
        const qCorreo = usersRef.where('email', '==', searchValue).get();

        const [nombreSnapshot, apellidoSnapshot, cedulaSnapshot, correoSnapshot] = await Promise.all([
            qNombre,
            qApellido,
            qCedula,
            qCorreo
        ]);

        let foundUsers = [];
        nombreSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));
        apellidoSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));
        cedulaSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));
        correoSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));

        // Evitar duplicados basados en la cédula
        foundUsers = foundUsers.filter((user, index, self) =>
            index === self.findIndex((u) => u.cedula === user.cedula)
        );

        if (foundUsers.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron coincidencias.' });
        }

        // Desencriptar las contraseñas de los usuarios encontrados
        foundUsers = foundUsers.map(user => ({
            ...user,
            contraseña: decryptPassword(user.contraseña) // Desencriptar la contraseña
        }));

        res.status(200).json(foundUsers);
    } catch (error) {
        console.error('Error al buscar los usuarios:', error);
        res.status(500).json({ success: false, mensaje: 'Error al buscar los usuarios.' });
    }
});


// Ruta para eliminar un usuario
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;

    console.log('Intentando eliminar usuario con ID:', userId);  // Log para verificar el ID

    try {
        const userDocRef = db.collection('usuarios_moviles').doc(userId);
        await userDocRef.delete();
        res.status(200).json({ success: true, mensaje: 'Usuario eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar el usuario.' });
    }
});

// Ruta para obtener un usuario por su ID (esta es la ruta clave para el error que mencionaste)
router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    
    console.log('Buscando usuario con ID:', userId);  // Log para verificar el ID

    try {
        const userDoc = await db.collection('usuarios_moviles').doc(userId).get();
        if (!userDoc.exists) {
            console.log('Usuario no encontrado:', userId);  // Log si el usuario no existe
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        res.status(200).json(userDoc.data());
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener el usuario.' });
    }
});

// Ruta para editar un usuario
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const { nombre, apellido, cedula, telefono, email, contraseña } = req.body;

    console.log('Editando usuario con ID:', userId);  // Log para verificar el ID

    if (!nombre && !apellido && !cedula && !telefono && !email && !contraseña) {
        return res.status(400).json({ mensaje: 'Debe enviar al menos un campo para actualizar.' });
    }

    try {
        const userRef = db.collection('usuarios_moviles').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log('Usuario no encontrado para editar:', userId);  // Log si el usuario no existe
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        let updatedData = {};
        if (nombre) updatedData.nombre = nombre;
        if (apellido) updatedData.apellido = apellido;
        if (cedula) updatedData.cedula = cedula;
        if (telefono) updatedData.telefono = telefono;
        if (email) updatedData.email = email;

        // Encriptar la contraseña antes de almacenarla
        if (contraseña) {
            updatedData.contraseña = encryptPassword(contraseña);
        }

        await userRef.update(updatedData);
        res.status(200).json({ success: true, mensaje: 'Usuario actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar el usuario.' });
    }
});

module.exports = router;
