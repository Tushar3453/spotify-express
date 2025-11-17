const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { createClient } = require('redis');
const http = require('http');
const { Server } = require('socket.io');
const spotifyRoutes = require('./routes/spotifyRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Allowed origins list
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

// CORS configuration
const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// http and Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// Redis client setup
const redisClient = createClient({
    socket: {
        reconnectStrategy: retries => Math.min(retries * 50, 2000)
    }
});

redisClient.on('error', (err) =>
    console.log(' Redis Client Error:', err)
);

// Attach redis to req
app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});

app.use('/api', spotifyRoutes);

const startServer = async () => {
    try {
        await Promise.all([
            mongoose.connect(process.env.MONGO_URI, {
                dbName: 'spotify_app'
            }),
            redisClient.connect()
        ]);

        console.log('✅ MongoDB connected');
        console.log('✅ Redis connected');

        server.listen(PORT, () => {
            console.log(` Server running with WebSockets at http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error(' Service startup failed:', err);
        process.exit(1);
    }
};

startServer();