const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');


// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configurar CORS
const allowedOrigins = ['http://localhost:5500','http://localhost:5501','http://localhost:5502' ];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('El origen CORS no está permitido.'), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const historialRuta = require('./rutas/historial');
const autenticacionRuta = require('./rutas/autenticacion');
const usersRuta = require('./rutas/users');

app.use('/api/historial', historialRuta);
app.use('/api/autenticacion', autenticacionRuta);
app.use('/api/users', usersRuta);

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
