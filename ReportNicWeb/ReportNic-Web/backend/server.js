const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./firebaseAdmin');



// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

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

const notificacionesHiddenRuta = require('./rutas/notificacionesHidden');
const historialRuta = require('./rutas/historial');
const autenticacionRuta = require('./rutas/autenticacion');
const notificacionesRuta = require('./rutas/notificacion');


app.use('/api/autenticacion', autenticacionRuta);
app.use('/api/historial', historialRuta);
app.use('/api/notificacion', notificacionesRuta)
app.use('/api/notificacion', notificacionesHiddenRuta); 

app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Crear servidor HTTP y configurar Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

// Middleware de autenticación para Socket.io
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Token requerido'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Token inválido'));
        socket.user = decoded;
        next();
    });
});

// Manejar conexiones de Socket.io
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.user.user}`);

    // Escuchar cambios en la colección 'Emergencias'
    const notifCollection = db.collection('Emergencias');

    const observer = notifCollection.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const timestamp = data.fechaYHora.toDate();
                const date = timestamp.toISOString().split('T')[0]; 
                const time = timestamp.toTimeString().split(' ')[0]; 
                const currentTime = new Date();
                const timeDifference = currentTime - timestamp;
                // Filtrar notificaciones según el hospital del usuario
                if (
                    
                    (timeDifference <= 600000 && socket.user.hospital.trim().toLowerCase().replace(/\s+/g, '') === data.hospitalSeleccionado?.nombre.trim().toLowerCase().replace(/\s+/g, ''))
                    
                ) {
                    socket.emit('nuevaNotificacion', {
                        id: change.doc.id,
                        createdAt: timestamp.toISOString(), 
                        date,
                        time,
                        fichaPaciente: {  
                            nombre: data.fichaPaciente.nombre,
                            apellidos: data.fichaPaciente.apellidos,
                            edad: data.fichaPaciente.edad,
                            presionSistolica: data.fichaPaciente.presionSistolica,
                            presionDiastolica: data.fichaPaciente.presionDiastolica,
                            afectaciones: data.fichaPaciente.afectaciones
                        },
                        eta: data.eta,  
                        coordenadasActuales: data.coordenadasActuales,  
                        hospitalSeleccionado: data.hospitalSeleccionado
                    });
                    
                } 
            } 
        });
    });

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.user.user}`);
        observer(); // Detener el listener de Firestore
    });
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
