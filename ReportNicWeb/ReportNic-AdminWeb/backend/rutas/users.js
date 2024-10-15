const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');
const db = require('../firebaseAdmin');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken para manejar los tokens

dotenv.config();
const router = express.Router();

// Función para encriptar contraseñas
function encryptPassword(password) {
    const ENCRYPTION_KEY = process.env.SECRET_KEY;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function verifyToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        console.log("Token no proporcionado");
        return res.status(403).json({ message: 'Token no proporcionado.' });
    }

    const token = tokenHeader.split(' ')[1]; // Extraer el token después de 'Bearer '

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificar el token
        req.user = decoded; // Almacenar los datos decodificados en req.user
        next();
    } catch (error) {
        console.log('Error al verificar token:', error); // Debugging del error
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
}

// Ruta para crear un nuevo usuario (con el token verificado)
router.post('/create-user', verifyToken, async (req, res) => {
    // Extraer datos del token
    const { user: usernameFromToken, hospital: hospitalFromToken, ubicacionHospital: ubicacionFromToken } = req.user;

    const { firstName, lastName, username, password, dni } = req.body;

    try {
        // Usar los datos del token en lugar de los proporcionados en el cuerpo de la solicitud
        const hospital = hospitalFromToken;
        const ubicacionHospital = ubicacionFromToken;

        let usersCollectionName = `usuarios_${hospital}`;
        const usersCollectionRef = db.collection(usersCollectionName);

        // Verificar si ya existe un usuario con el mismo username
        const usernameQuery = usersCollectionRef.where("user", "==", username).get();
        const usernameSnapshot = await usernameQuery;

        // Verificar si ya existe un usuario con el mismo dni
        const dniQuery = usersCollectionRef.where("dni", "==", dni).get();
        const dniSnapshot = await dniQuery;

        if (!usernameSnapshot.empty || !dniSnapshot.empty) {
            return res.status(400).json({ message: 'El usuario o DNI ya existe.' });
        }

        // Verificar existencia de la colección historial_
        const historialCollectionName = `historial_${hospital}`;
        const historialCollectionRef = db.collection(historialCollectionName);
        
        const historialQuery = await historialCollectionRef.limit(1).get(); // Solo obtenemos un documento para verificar
        if (historialQuery.empty) {
            // La colección no existe, crea un documento vacío para crear la colección
            await historialCollectionRef.add({}); // Esto crea la colección
        }


        const geoPoint = new admin.firestore.GeoPoint(ubicacionHospital._latitude, ubicacionHospital._longitude);


        await usersCollectionRef.add({
            firstName,
            lastName,
            user: username,
            password: encryptPassword(password),
            dni,
            ubicacionHospital: geoPoint,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ message: 'Usuario creado exitosamente.' });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ message: 'Error al crear el usuario.' });
    }
});

// Función para desencriptar contraseñas
function decryptPassword(encryptedPassword) {
    const ENCRYPTION_KEY = process.env.SECRET_KEY;
    const [iv, encrypted] = encryptedPassword.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}


// Ruta para obtener todos los usuarios
router.get('/get-users', verifyToken, async (req, res) => {

    const { hospital: hospitalFromToken } = req.user;

    if (!hospitalFromToken) {
        return res.status(400).json({ message: 'No se pudo extraer el hospital del token.' });
    }

    const hospital = hospitalFromToken;
    
    try {
        const usersCollectionName = `usuarios_${hospital}`;
        const usersSnapshot = await db.collection(usersCollectionName).orderBy('createdAt', 'desc').get();

        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                password: decryptPassword(data.password),
            };
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error al obtener los usuarios.' });
    }
});

router.get('/search', verifyToken, async (req, res) => {
    const { hospital: hospitalFromToken } = req.user; // Extraer el hospital desde el token
    const searchValue = req.query.query;

    if (!hospitalFromToken) {
        return res.status(400).json({ mensaje: 'No se pudo extraer el hospital del token.' });
    }

    if (!searchValue) {
        return res.status(400).json({ mensaje: 'El valor de búsqueda es requerido.' });
    }

    const hospital = hospitalFromToken;

    try {
        const usersCollectionName = `usuarios_${hospital}`;
        const usersRef = db.collection(usersCollectionName);

        // Realizar las consultas para los campos que se pueden buscar
        const qNombre = usersRef.where('firstName', '==', searchValue).get();
        const qApellido = usersRef.where('lastName', '==', searchValue).get();
        const qDni = usersRef.where('dni', '==', searchValue).get();
        const qUsername = usersRef.where('user', '==', searchValue).get();

        // Ejecutar las consultas en paralelo
        const [nombreSnapshot, apellidoSnapshot, dniSnapshot, usernameSnapshot] = await Promise.all([
            qNombre,
            qApellido,
            qDni,
            qUsername
        ]);

        let foundUsers = [];

        // Recorrer los resultados de cada consulta y añadir a la lista de usuarios encontrados
        nombreSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));
        apellidoSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));
        dniSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));
        usernameSnapshot.forEach(doc => foundUsers.push({ id: doc.id, ...doc.data() }));

        // Evitar duplicados basados en el dni
        foundUsers = foundUsers.filter((user, index, self) =>
            index === self.findIndex((u) => u.dni === user.dni)
        );

        if (foundUsers.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron coincidencias.' });
        }

        // Desencriptar las contraseñas de los usuarios encontrados
        foundUsers = foundUsers.map(user => ({
            ...user,
            password: decryptPassword(user.password) // Desencriptar la contraseña
        }));

        res.status(200).json(foundUsers);
    } catch (error) {
        console.error('Error al buscar los usuarios:', error);
        res.status(500).json({ success: false, mensaje: 'Error al buscar los usuarios.' });
    }
});

// Ruta para obtener un usuario por su ID
router.get('/:id', verifyToken, async (req, res) => {
    const { hospital: hospitalFromToken } = req.user;
    const userId = req.params.id;

    if (!hospitalFromToken) {
        return res.status(400).json({ mensaje: 'No se pudo extraer el hospital del token.' });
    }
    


    const hospital = hospitalFromToken;

    try {
        const usersCollectionName = `usuarios_${hospital}`;
        const userDoc = await db.collection(usersCollectionName).doc(userId).get();
        if (!userDoc.exists) {
            console.log('Usuario no encontrado:', userId);
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        res.status(200).json(userDoc.data());
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al obtener el usuario.' });
    }
});

// Ruta para editar un usuario
router.put('/:id', verifyToken, async (req, res) => {
    const userId = req.params.id;
    const { hospital: hospitalFromToken } = req.user;
    const { firstName, lastName, username, password, dni } = req.body;

    if (!hospitalFromToken) {
        return res.status(400).json({ mensaje: 'No se pudo extraer el hospital del token.' });
    }

    const hospital = hospitalFromToken;


    if (!firstName && !lastName && !username && !password && !dni) {
        return res.status(400).json({ mensaje: 'Debe enviar al menos un campo para actualizar.' });
    }

    try {
        const usersCollectionName = `usuarios_${hospital}`;
        const userRef = db.collection(usersCollectionName).doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log('Usuario no encontrado para editar:', userId);
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        let updatedData = {};
        if (firstName) updatedData.firstName = firstName;
        if (lastName) updatedData.lastName = lastName;
        if (username) updatedData.user = username;
        if (dni) updatedData.dni = dni;

        // Encriptar la contraseña antes de almacenarla
        if (password) {
            updatedData.password = encryptPassword(password);
        }

        await userRef.update(updatedData);
        res.status(200).json({ success: true, mensaje: 'Usuario actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar el usuario.' });
    }
});

// Ruta para eliminar un usuario
router.delete('/:id', verifyToken, async (req, res) => {
    const { hospital: hospitalFromToken } = req.user;
    const userId = req.params.id;


    if (!hospitalFromToken) {
        return res.status(400).json({ mensaje: 'No se pudo extraer el hospital del token.' });
    }

    const hospital = hospitalFromToken;

    try {
        const usersCollectionName = `usuarios_${hospital}`;
        const userDocRef = db.collection(usersCollectionName).doc(userId);

        await userDocRef.delete();  // Eliminar el documento del usuario

        res.status(200).json({ success: true, mensaje: 'Usuario eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar el usuario.' });
    }
});

router.get('/historial', verifyToken, async (req, res) => {
    const { hospital: hospitalFromToken } = req.user;
    const { userId } = req.query; // ID del usuario
    
    if (!hospitalFromToken || !userId) {
        return res.status(400).json({ message: 'Hospital o userId no proporcionado.' });
    }

    const hospital = hospitalFromToken;

    try {
        // Obtener el usuario
        const usersCollectionName = `usuarios_${hospital}`;
        const userDoc = await db.collection(usersCollectionName).doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const userData = userDoc.data();


        
        // Buscar en el historial
        const historialCollectionName = `historial_${hospital}`;
        const historialSnapshot = await db.collection(historialCollectionName)
            .where('usuario', '==', userData.usuario) // Aquí 'usuario' es el campo de la colección historial
            .get();

        if (historialSnapshot.empty) {
            return res.status(404).json({ message: 'No se encontraron registros en el historial.' });
        }

        const historialData = historialSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(historialData); // Enviar los datos del historial al frontend
    } catch (error) {
        console.error('Error al obtener el historial:', error);
        res.status(500).json({ message: 'Error al obtener el historial.' });
    }
});

module.exports = router;
