const express = require('express');
const cors = require('cors');
require('dotenv').config(); //.env files updated
const spotifyRoutes = require('./routes/spotifyRoutes');
const app = express();
const PORT = process.env.PORT || 8000;

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


app.use(express.json());
app.use('/api', spotifyRoutes);

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

