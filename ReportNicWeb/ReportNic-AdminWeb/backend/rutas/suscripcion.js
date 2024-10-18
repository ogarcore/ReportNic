const express = require('express');
const router = express.Router();
const db = require('../firebaseAdmin'); // Reutilizando tu archivo de conexión a Firebase
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

const JWT_SECRET = process.env.JWT_SECRET; // Define your JWT secret

// Middleware para verificar el token JWT
function verifyToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        console.log("Token no proporcionado");
        return res.status(403).json({ message: 'Token no proporcionado.' });
    }

    const token = tokenHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verificar y decodificar el token
        req.user = decoded; // Guardar el contenido decodificado del token en req.user
        next();
    } catch (error) {
        console.log('Error al verificar token:', error);
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
}

// Ruta para actualizar el token con plan y precio
router.post('/actualizarToken', (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Obtener el token existente de la cabecera
    const { plan, price } = req.body;

    try {
        // Verificar y decodificar el token existente
        const decoded = jwt.verify(token, JWT_SECRET);

        // Actualizar el payload con el nuevo plan y precio
        const updatedPayload = {
            ...decoded, // Mantén todos los datos originales
            plan: plan, // Añade los nuevos datos
            price: price
        };

        // Volver a firmar el token con el payload actualizado
        const updatedToken = jwt.sign(updatedPayload, JWT_SECRET);

        // Devolver el token actualizado
        res.json({ token: updatedToken });
    } catch (error) {
        console.error('Error al actualizar el token:', error);
        res.status(400).json({ error: 'Token inválido o caducado' });
    }
});

// Ruta para guardar la suscripción
router.post('/guardarSuscripcion', verifyToken, async (req, res) => {
    const { selectedPlan, metodoPago } = req.body;
    const { hospital } = req.user; // Extraer el hospital del token decodificado

    try {
        // Generar fechas de suscripción
        const fechaInicio = admin.firestore.Timestamp.fromDate(new Date());
        let fechaFinal;

        // Definir la duración del plan
        switch (selectedPlan) {
            case 'Plan Mensual':
                fechaFinal = admin.firestore.Timestamp.fromDate(new Date(fechaInicio.toDate().setMonth(fechaInicio.toDate().getMonth() + 1)));
                break;
            case 'Plan Trimestral':
                fechaFinal = admin.firestore.Timestamp.fromDate(new Date(fechaInicio.toDate().setMonth(fechaInicio.toDate().getMonth() + 3)));
                break;
            case 'Plan Semestral':
                fechaFinal = admin.firestore.Timestamp.fromDate(new Date(fechaInicio.toDate().setMonth(fechaInicio.toDate().getMonth() + 6)));
                break;
            default:
                return res.status(400).json({ error: 'Plan inválido' });
        }

        // Verificar si ya existe una suscripción para el hospital
        const suscripcionesSnapshot = await db.collection('suscripciones').where('hospital', '==', hospital).get();

        if (!suscripcionesSnapshot.empty) {
            // Si existe, actualizar el documento existente
            suscripcionesSnapshot.forEach(async (doc) => {
                await doc.ref.update({
                    plan: selectedPlan,
                    fechaInicio: fechaInicio, // Actualizar fecha de inicio
                    fechaFinal: fechaFinal,   // Actualizar fecha final
                    metodoPago: metodoPago || "Tarjeta de credito"
                });
            });
            res.json({ message: 'Suscripción actualizada' });
        } else {
            // Si no existe, crear una nueva suscripción

            // Generar un ID aleatorio de 5 dígitos
            const generateRandomId = () => {
                return Math.floor(10000 + Math.random() * 90000).toString(); // Genera un número entre 10000 y 99999
            };

            const newId = generateRandomId();

            // Crear el nuevo documento de suscripción, agregando el campo 'hospital'
            await db.collection('suscripciones').add({
                id: newId, // ID aleatorio de 5 dígitos
                plan: selectedPlan,
                fechaInicio: fechaInicio, // Guardar como timestamp
                fechaFinal: fechaFinal,   // Guardar como timestamp
                Renovacion: "automatica",
                metodoPago: metodoPago || "Tarjeta de credito",
                hospital: hospital // Agregar el campo hospital extraído del token
            });

            res.json({ message: 'Suscripción creada' });
        }

        // Actualizar el campo 'suscripcion' en 'usuarios_admin_web' basado en el hospital
        const usuariosAdminSnapshot = await db.collection('usuarios_admin_web').where('hospital', '==', hospital).get();

        if (!usuariosAdminSnapshot.empty) {
            usuariosAdminSnapshot.forEach(async (doc) => {
                await doc.ref.update({ suscripcion: true });
            });
        }

        // 2. Actualizar el campo 'acceso' en 'usuarios_{hospital}' basado en el hospital
        const usuariosSnapshot = await db.collection(`usuarios_${hospital}`).get();
        if (!usuariosSnapshot.empty) {
            usuariosSnapshot.forEach(async (doc) => {
                await doc.ref.update({ acceso: true });
            });
        }

    } catch (error) {
        console.error('Error al guardar la suscripción:', error);
        res.status(500).json({ error: 'Error al guardar la suscripción.' });
    }
});



router.get('/suscripciones', verifyToken, async (req, res) => {
    const { hospital } = req.user; // Extraer el campo "hospital" del token
    
        if (!hospital) {
        return res.status(400).json({ message: 'No se pudo extraer el hospital del token.' });
        }
    
        try {
        // Acceder a la colección de suscripciones en Firebase
        const suscripcionesRef = db.collection('suscripciones');
        const querySnapshot = await suscripcionesRef.where('hospital', '==', hospital).get();
    
        if (querySnapshot.empty) {
            return res.status(200).json([]); // Si no hay documentos, devolver un array vacío
        }
    
        // Construir un array con los datos de las suscripciones
        const suscripciones = querySnapshot.docs.map(doc => ({
            id: doc.data().id,
            plan: doc.data().plan,
            fechaInicio: doc.data().fechaInicio,
            fechaFinal: doc.data().fechaFinal,
            Renovacion: doc.data().Renovacion,
            metodoPago: doc.data().metodoPago,
            hospital: doc.data().hospital
        }));
    
        // Devolver las suscripciones filtradas
        return res.status(200).json(suscripciones);
    
        } catch (error) {
        console.error('Error al obtener las suscripciones:', error);
        return res.status(500).json({ message: 'Error al obtener las suscripciones.' });
        }
    });

    router.delete('/suscripcion/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const { hospital } = req.user;  // Sacamos el hospital desde el token
    
        try {
            // 1. Eliminar la suscripción en Firebase
            const suscripcionesRef = db.collection('suscripciones');
            const snapshot = await suscripcionesRef.where('id', '==', id).where('hospital', '==', hospital).get();
            
            if (snapshot.empty) {
                return res.status(404).json({ message: 'Suscripción no encontrada.' });
            }
    
            // Eliminar todos los documentos que coincidan con el id de la suscripción
            snapshot.forEach(async (doc) => {
                await doc.ref.delete();
            });
    
            // 2. Actualizar el campo 'suscripcion' a false en usuarios_{hospital}
            const usuariosRef = db.collection(`usuarios_${hospital}`);
            const usuariosSnapshot = await usuariosRef.get();
    
            if (!usuariosSnapshot.empty) {
                usuariosSnapshot.forEach(async (doc) => {
                    await doc.ref.update({ acceso: false });  // Actualizamos acceso a false
                });
            }
    
            // 3. Actualizar el campo 'suscripcion' a false en usuarios_admin_web (por si necesitas actualizar también en admin)
            const usuariosAdminRef = db.collection('usuarios_admin_web').where('hospital', '==', hospital);
            const usuariosAdminSnapshot = await usuariosAdminRef.get();
            
            if (!usuariosAdminSnapshot.empty) {
                usuariosAdminSnapshot.forEach(async (doc) => {
                    await doc.ref.update({ suscripcion: false });
                });
            }
    
            // 4. Responder con éxito
            res.json({ message: 'Suscripción cancelada, acceso deshabilitado y usuarios actualizados' });
    
        } catch (error) {
            console.error('Error al cancelar la suscripción:', error);
            res.status(500).json({ message: 'Error al cancelar la suscripción.' });
        }
    });
    

    

module.exports = router;
