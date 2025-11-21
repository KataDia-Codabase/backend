const express = require('express');
const router = express.Router();

const {
    createTest,
    getAllTests,
    getTestById,
    updateTest,
    deleteTest,
} = require('../controllers/cefrTestController');

// Base Prefix: /cefr-test

/**
 * @route   GET /cefr-test
 * @desc    List semua ujian yang tersedia
 */
router.get('/', getAllTests);

/**
 * @route   POST /cefr-test
 * @desc    Buat paket ujian baru (Dapat ID dari sini)
 */
router.post('/', createTest);

/**
 * @route   GET /cefr-test/:id
 * @desc    Detail satu ujian
 */
router.get('/:id', getTestById);

/**
 * @route   PUT /cefr-test/:id
 * @desc    Edit info ujian
 */
router.put('/:id', updateTest);

/**
 * @route   DELETE /cefr-test/:id
 * @desc    Hapus ujian
 */
router.delete('/:id', deleteTest);

module.exports = router;
