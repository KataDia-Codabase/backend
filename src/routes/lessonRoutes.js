const express = require('express');
const router = express.Router();

const {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    getLessonsForSync,
} = require('../controllers/lessonController');

// ==============================================================================
// LESSON ROUTES (Standard Learning)
// Base Prefix: /lesson (diatur di index.js)
// ==============================================================================

/**
 * @route   GET /lesson/
 * @desc    Ambil semua list lesson (bisa filter ?cefr_level=B1&lesson_type=listening)
 */
router.get('/', getAllLessons);

/**
 * @route   GET /lesson/
 * @desc    Ambil semua list lesson (bisa filter ?cefr_level=B1&lesson_type=listening)
 */
router.get('/sync', getLessonsForSync);

/**
 * @route   POST /lesson/
 * @desc    Buat header lesson baru (Judul, Tipe, Level)
 */
router.post('/', createLesson);

/**
 * @route   GET /lesson/:id
 * @desc    Ambil SATU lesson LENGKAP dengan Content -> Questions -> Options
 * @note    Endpoint ini dipanggil saat user mulai mengerjakan lesson.
 */
router.get('/:id', getLessonById);

/**
 * @route   PUT /lesson/:id
 * @desc    Edit info dasar lesson
 */
router.put('/:id', updateLesson);

/**
 * @route   DELETE /lesson/:id
 * @desc    Hapus lesson (Hati-hati, menghapus semua soal di dalamnya!)
 */
router.delete('/:id', deleteLesson);

module.exports = router;
