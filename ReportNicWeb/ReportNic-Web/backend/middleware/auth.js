const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

function verifyToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader) {
        return res.status(403).json({ message: 'Token no proporcionado.' });
    }

    const token = tokenHeader.split(' ')[1]; 
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
}

module.exports = verifyToken;
