const express = require('express');
const router = express.Router();
const uploadAudioMiddleware = require('../middlewares/uploadAudioMiddleware'); // <-- Import Middleware

const {
    createContent,
    getContentsByLessonId,
    getContentById,
    updateContent,
    deleteContent,
    getContentFile, // <-- Kita tambahkan fungsi untuk akses file (streaming)
} = require('../controllers/lessonContentController');

// Base Prefix: /content

/**
 * @route   GET /content?lesson_id=1
 * @desc    Ambil semua konten dalam satu lesson
 */
router.get('/', getContentsByLessonId);

/**
 * @route   POST /content
 * @desc    Tambah konten baru.
 * - Jika Listening: Upload file di key 'target_audio'
 * - Jika Reading/Speaking: Isi field 'text_content'
 */
router.post('/', uploadAudioMiddleware, createContent); // <-- Pasang Middleware

/**
 * @route   GET /content/:id
 * @desc    Ambil detail satu konten
 */
router.get('/:id', getContentById);

/**
 * @route   PUT /content/:id
 * @desc    Update konten (Ganti file audio atau edit teks)
 */
router.put('/:id', uploadAudioMiddleware, updateContent); // <-- Pasang Middleware

/**
 * @route   DELETE /content/:id
 * @desc    Hapus konten
 */
router.delete('/:id', deleteContent);

/**
 * @route   GET /content/audio/:filename
 * @desc    Akses file audio secara publik (untuk diputar di frontend)
 */
router.get('/audio/:filename', getContentFile); // <-- Route baru untuk streaming

module.exports = router;
