const express = require('express');
const router = express.Router();

// Impor fungsi controller
const {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
} = require('../controllers/lessonController');

// Catatan:
// Rute-rute ini secara otomatis memiliki prefix '/lesson'
// karena cara Anda mengaturnya di index.js (app.use('/lesson', ...))

/**
 * @route   GET /lesson/
 * @desc    Mendapatkan semua lessons (dengan filter)
 */
router.get('/', getAllLessons);

/**
 * @route   POST /lesson/
 * @desc    Membuat lesson baru
 */
router.post('/', createLesson);

/**
 * @route   GET /lesson/:id
 * @desc    Mendapatkan detail satu lesson (termasuk vocab)
 */
router.get('/:id', getLessonById);

/**
 * @route   PUT /lesson/:id
 * @desc    Memperbarui lesson
 */
router.put('/:id', updateLesson);

/**
 * @route   DELETE /lesson/:id
 * @desc    Menghapus lesson
 */
router.delete('/:id', deleteLesson);

// Anda juga bisa menggabungkannya seperti ini:
//
// router.route('/')
//   .get(getAllLessons)
//   .post(createLesson);
//
// router.route('/:id')
//   .get(getLessonById)
//   .put(updateLesson)
//   .delete(deleteLesson);

module.exports = router;
