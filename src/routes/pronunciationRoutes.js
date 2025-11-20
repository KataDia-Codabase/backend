const express = require('express');
const router = express.Router();

// 1. Import Middleware Upload
// Middleware ini bertugas menangkap file audio dari form-data dengan key 'target_audio'
const uploadAudioMiddleware = require('../middlewares/uploadAudioMiddleware');

// 2. Import Controller
const {
    submitPronunciation,
    getSubmissionHistory,
} = require('../controllers/PronunciationController');

// ==============================================================================
// DEFINISI ROUTES
// ==============================================================================

/**
 * @route   POST /api/pronunciation/submit
 * @desc    Endpoint utama untuk mengirim audio latihan
 * @access  Private (User Login)
 * * Alur Proses:
 * 1. Frontend hit endpoint ini dengan Multipart Form Data.
 * 2. 'uploadAudioMiddleware' berjalan: menyimpan file audio ke folder server.
 * 3. 'submitPronunciation' berjalan: mengirim audio ke AI Service & simpan skor ke DB.
 */
router.post('/submit', uploadAudioMiddleware, submitPronunciation);

/**
 * @route   GET /api/pronunciation/history/:user_id
 * @desc    Melihat riwayat nilai/latihan user sebelumnya
 * @access  Private (User Login)
 */
router.get('/history/:user_id', getSubmissionHistory);

module.exports = router;
