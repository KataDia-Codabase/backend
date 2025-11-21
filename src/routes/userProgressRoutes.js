const express = require('express');
const router = express.Router();

const {
    submitLessonProgress,
    getUserProgress,
} = require('../controllers/userProgressController');

// Base Prefix: /progress

/**
 * @route   POST /progress
 * @desc    Simpan skor Quiz (Reading/Listening/Vocab) & tandai completed
 */
router.post('/', submitLessonProgress);

/**
 * @route   GET /progress/:user_id
 * @desc    Ambil semua lesson yang sudah dikerjakan user
 */
router.get('/:user_id', getUserProgress);

module.exports = router;
