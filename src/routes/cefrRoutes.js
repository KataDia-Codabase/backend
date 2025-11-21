const express = require('express');
const router = express.Router();
const uploadAudioMiddleware = require('../middlewares/uploadAudioMiddleware');

const {
    startTest,
    getTestQuestions,
    submitMcqAnswer,
    submitSpeakingAnswer,
    finishTest,
} = require('../controllers/cefrController');

// Base Prefix: /cefr

// 1. Mulai Ujian (Dapet result_id)
router.post('/start', startTest);

// 2. Ambil Soal
router.get('/questions/:cefr_test_id', getTestQuestions);

// 3. Jawab Soal Reading/Listening/Vocab
router.post('/answer', submitMcqAnswer);

// 4. Jawab Soal Speaking (Upload Audio)
router.post('/speaking', uploadAudioMiddleware, submitSpeakingAnswer);

// 5. Selesai Ujian (Hitung Nilai & Update Level User)
router.post('/finish', finishTest);

module.exports = router;
