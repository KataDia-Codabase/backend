require('dotenv').config();
const PORT = process.env.PORT | 3000;
const express = require('express');
const cors = require('cors');
const db = require('./src/configs/database.js');
const cookieParser = require('cookie-parser');
const bodyParser = require('express').json;

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(bodyParser());

// ROUTES
app.use('/api/auth', require('./src/routes/authRoutes.js'));
// app.use('/api/user', require('./src/routes/userRoutes.js'));
app.use('/api/lesson', require('./src/routes/lessonRoutes.js'));
app.use('/api/lesson-vocab', require('./src/routes/lessonVocabRoutes.js'));
app.use('/api/pronunciation', require('./src/routes/pronunciationRoutes.js'));

// - **Routes**: `/api/auth`, `/api/user`, `/api/lesson`, `/api/pronunciation`, `/api/audio/upload`, `/api/stt/transcribe`, `/api/tts/speak`, `/api/score`.

// Global error handling
app.use((err, _req, res, next) => {
    res.status(500).send({
        msg: 'Uh oh! An unexpected error occured.',
        error: err.message,
    });
});

// Untuk memulai server setelah koneksi DB berhasil
async function start() {
    try {
        await db.authenticate();
        await db.sync({ alter: true });
        console.log('All models were synchronized successfully.');
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

start();

module.exports = app;
