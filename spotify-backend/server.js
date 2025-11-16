const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 
require('dotenv').config();
const spotifyRoutes = require('./routes/spotifyRoutes');
const app = express();
const PORT = process.env.PORT || 8000;
const { createClient } = require('redis')

const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
const redisClient = createClient();
redisClient.on('error', err => console.log('Redis Client Error', err));

app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});
app.use(express.json());
app.use('/api', spotifyRoutes);

const startServer = async () => {
  try {
    // Promise.all waits for both connections in parallel
    await Promise.all([
      redisClient.connect(),
      mongoose.connect(process.env.MONGO_URI, { dbName: 'spotify_app' })
    ]);
    
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

