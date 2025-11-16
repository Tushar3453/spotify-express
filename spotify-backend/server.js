const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { createClient } = require('redis');
const spotifyRoutes = require('./routes/spotifyRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const redisClient = createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});

app.use('/api', spotifyRoutes);

const startServer = async () => {
    try {
        const mongoConnection = mongoose.connect(process.env.MONGO_URI, {
            dbName: 'spotify_app'
        });
        const redisConnection = redisClient.connect();

        await Promise.all([mongoConnection, redisConnection]);

        console.log('MongoDB connected successfully.');
        console.log('Redis connected successfully.');

        app.listen(PORT, () => {
            console.log(`Backend server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect to one or more services:', err);
        process.exit(1);
    }
};

startServer();
