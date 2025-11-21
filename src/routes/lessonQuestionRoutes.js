const express = require('express');
const router = express.Router();

const {
    createQuestionWithOptions,
    getQuestionsByContentId,
    updateQuestion,
    deleteQuestion,
    addOption,
    deleteOption,
} = require('../controllers/lessonQuestionController');

// Base Prefix: /question

/**
 * @route   GET /question?content_id=1
 * @desc    Ambil semua soal di dalam konten tertentu
 */
router.get('/', getQuestionsByContentId);

/**
 * @route   POST /question
 * @desc    Buat soal baru + Pilihan Jawabannya (Bulk)
 */
router.post('/', createQuestionWithOptions);

/**
 * @route   PUT /question/:id
 * @desc    Update teks soal
 */
router.put('/:id', updateQuestion);

/**
 * @route   DELETE /question/:id
 * @desc    Hapus soal
 */
router.delete('/:id', deleteQuestion);

// --- Manajemen Opsi Individual (Opsional) ---

/**
 * @route   POST /question/option
 * @desc    Tambah satu opsi jawaban ke soal yg sudah ada
 */
router.post('/option', addOption);

/**
 * @route   DELETE /question/option/:id
 * @desc    Hapus satu opsi jawaban
 */
router.delete('/option/:id', deleteOption);

module.exports = router;
