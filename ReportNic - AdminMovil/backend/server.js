const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
const allowedOrigins = ['http://localhost:5501'];
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

// Rutas de autenticación y usuarios
const autenticacionRuta = require('./rutas/autenticacion');
const usersRuta = require('./rutas/users');

app.use('/api', autenticacionRuta);
app.use('/api/users', usersRuta);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
