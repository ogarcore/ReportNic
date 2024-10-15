const express = require('express');
const router = express.Router();
const db = require('../firebaseAdmin');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();


function verifyToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];

    if (!tokenHeader) {
        console.log("Token no proporcionado");
        return res.status(403).json({ message: 'Token no proporcionado.' });
    }

    const token = tokenHeader.split(' ')[1]; 

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Error al verificar token:', error); 
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
}


router.get('/historial', verifyToken, async (req, res) => {
    const { hospital: hospitalFromToken } = req.user;
    const { searchName = '', searchLastname = '', searchDate = '' } = req.query;

    if (!hospitalFromToken) {
        return res.status(400).json({ message: 'No se pudo extraer el hospital del token.' });
    }

    const hospital = hospitalFromToken;
    const collectionName = `historial_${hospital}`;

    try {
        const collectionRef = db.collection(collectionName);
        let query = collectionRef;

        if (searchName) {
            query = query.where('nombre', '==', searchName);
        }
        if (searchLastname) {
            query = query.where('apellidos', '==', searchLastname);
        }
        if (searchDate) {
            const dateStart = new Date(searchDate);
            const dateEnd = new Date(searchDate);
            dateEnd.setDate(dateEnd.getDate() + 1);
            query = query.where('fechaYHora', '>=', dateStart).where('fechaYHora', '<', dateEnd);
        }

        const querySnapshot = await query.orderBy('fechaYHora', 'desc').get();
        const historial = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener los registros:', error);
        res.status(500).json({ message: 'Error al obtener los registros.' });
    }
});



module.exports = router;
