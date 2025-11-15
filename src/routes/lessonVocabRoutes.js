const express = require('express');
const router = express.Router();

// Impor middleware upload
const uploadAudioMiddleware = require('../middlewares/uploadAudioMiddleware');

// Impor fungsi controller
const {
    createLessonVocab,
    getAllLessonVocab,
    getLessonVocabById,
    updateLessonVocab,
    deleteLessonVocab,
    getAudioFile,
} = require('../controllers/lessonVocabController');

// Catatan:
// Rute-rute ini akan memiliki prefix '/vocab' jika Anda
// mengaturnya di index.js (app.use('/vocab', ...))

/**
 * @route   GET /vocab/
 * @desc    Mendapatkan semua item vocab (opsional: filter by lesson_id)
 * @access  Public
 */
router.get('/', getAllLessonVocab);

/**
 * @route   POST /vocab/
 * @desc    Membuat item vocab baru (termasuk upload audio)
 * @access  Private (Admin)
 */
// Terapkan middleware DI SINI
router.post('/', uploadAudioMiddleware, createLessonVocab);

/**
 * @route   GET /vocab/:id
 * @desc    Mendapatkan detail satu item vocab
 * @access  Public
 */
router.get('/:id', getLessonVocabById);

/**
 * @route   PUT /vocab/:id
 * @desc    Memperbarui item vocab
 * @access  Private (Admin)
 */
// Terapkan middleware DI SINI juga
router.put('/:id', uploadAudioMiddleware, updateLessonVocab);

/**
 * @route   DELETE /vocab/:id
 * @desc    Menghapus item vocab
 * @access  Private (Admin)
 */
router.delete('/:id', deleteLessonVocab);

/**
 * @route   GET /vocab/audio/:filename
 * @desc    Mengirimkan file audio yang tersimpan secara lokal
 * @access  Public
 */
router.get('/audio/:filename', getAudioFile); // <-- Rute baru

module.exports = router;
