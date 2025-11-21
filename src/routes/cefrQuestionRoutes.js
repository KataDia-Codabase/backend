const express = require('express');
const router = express.Router();
const uploadAudioMiddleware = require('../middlewares/uploadAudioMiddleware');

const {
    createCefrQuestion,
    getQuestionsAdmin,
    deleteCefrQuestion,
} = require('../controllers/cefrQuestionController');

// Base Prefix: /cefr-question

/**
 * @route   POST /cefr-question
 * @desc    Tambah Soal Baru (Support Audio Upload & JSON Options string)
 */
router.post('/', uploadAudioMiddleware, createCefrQuestion);

/**
 * @route   GET /cefr-question/:cefr_test_id
 * @desc    Ambil semua soal ujian tertentu (Mode Admin - Kunci jawaban terlihat)
 */
router.get('/:cefr_test_id', getQuestionsAdmin);

/**
 * @route   DELETE /cefr-question/:id
 * @desc    Hapus soal ujian
 */
router.delete('/:id', deleteCefrQuestion);

module.exports = router;
