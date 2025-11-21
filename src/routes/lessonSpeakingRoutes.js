const express = require('express');
const router = express.Router();
const uploadAudioMiddleware = require('../middlewares/uploadAudioMiddleware');

const {
    submitSpeakingAttempt,
    getSpeakingHistory,
} = require('../controllers/lessonSpeakingController');

// Base Prefix: /speaking

/**
 * @route   POST /speaking/submit
 * @desc    Upload audio -> Kirim ke AI -> Simpan Feedback
 * @body    user_id, lesson_id, file (key: target_audio)
 */
router.post('/submit', uploadAudioMiddleware, submitSpeakingAttempt);

/**
 * @route   GET /speaking/history
 * @desc    Lihat riwayat latihan speaking
 * @query   user_id, lesson_id
 */
router.get('/history', getSpeakingHistory);

module.exports = router;
