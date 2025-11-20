// Penting: Import dari models/index.js agar relasi (associations) terbaca!
const {
    Lesson,
    LessonContent,
    LessonQuestion,
    LessonOption,
} = require('../models'); // <-- Import dari index.js

const { Op } = require('sequelize');

/**
 * @desc    Membuat Header Lesson Baru
 * @route   POST /api/lessons
 * @access  Private (Admin)
 */
const createLesson = async (req, res) => {
    const { title, description, cefr_level, lesson_type, order_index } =
        req.body;

    // Validasi input dasar
    if (!title || !cefr_level || !lesson_type) {
        return res.status(400).json({
            message:
                'Gagal membuat lesson: title, cefr_level, dan lesson_type wajib diisi.',
        });
    }

    try {
        const newLesson = await Lesson.create({
            title,
            description,
            cefr_level,
            lesson_type, // 'listening', 'reading', 'vocabulary', 'speaking'
            order_index: order_index || 0,
        });

        res.status(201).json({
            message:
                'Header Lesson berhasil dibuat. Silakan tambahkan konten ke lesson ini.',
            data: newLesson,
        });
    } catch (error) {
        console.error('Error saat membuat lesson:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Mendapatkan semua lessons (Filterable)
 * @route   GET /api/lessons
 * @query   ?cefr_level=A1&lesson_type=reading
 * @access  Public
 */
const getAllLessons = async (req, res) => {
    try {
        const { cefr_level, lesson_type, search } = req.query;

        // Bangun query filter dinamis
        const whereClause = {};
        if (cefr_level) whereClause.cefr_level = cefr_level;
        if (lesson_type) whereClause.lesson_type = lesson_type;
        if (search) {
            whereClause.title = { [Op.like]: `%${search}%` };
        }

        const lessons = await Lesson.findAll({
            where: whereClause,
            attributes: [
                'id',
                'title',
                'cefr_level',
                'lesson_type',
                'description',
                'order_index',
            ], // Ambil field penting saja
            order: [
                ['cefr_level', 'ASC'],
                ['order_index', 'ASC'],
                ['title', 'ASC'],
            ],
        });

        res.status(200).json({
            message: 'Data lessons berhasil diambil',
            total_data: lessons.length,
            data: lessons,
        });
    } catch (error) {
        console.error('Error saat mengambil semua lessons:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Mendapatkan FULL DETAIL satu lesson (Pohon Lengkap)
 * @route   GET /api/lessons/:id
 * @access  Public
 * @note    Ini endpoint PALING PENTING untuk frontend "Play Lesson"
 */
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;

        // NESTED EAGER LOADING
        // Mengambil Lesson -> Contents -> Questions -> Options
        const lesson = await Lesson.findByPk(id, {
            include: [
                {
                    model: LessonContent,
                    as: 'contents', // Harus sesuai alias di models/index.js
                    include: [
                        {
                            model: LessonQuestion,
                            as: 'questions', // Harus sesuai alias di models/index.js
                            include: [
                                {
                                    model: LessonOption,
                                    as: 'options', // Harus sesuai alias di models/index.js
                                },
                            ],
                        },
                    ],
                },
            ],
            order: [
                // Urutkan konten di dalam lesson
                [{ model: LessonContent, as: 'contents' }, 'id', 'ASC'],
                // Urutkan pertanyaan di dalam konten
                [
                    { model: LessonContent, as: 'contents' },
                    { model: LessonQuestion, as: 'questions' },
                    'id',
                    'ASC',
                ],
                // Urutkan opsi A,B,C,D
                [
                    { model: LessonContent, as: 'contents' },
                    { model: LessonQuestion, as: 'questions' },
                    { model: LessonOption, as: 'options' },
                    'id',
                    'ASC',
                ],
            ],
        });

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' });
        }

        res.status(200).json({
            message: 'Detail Lesson berhasil ditemukan',
            data: lesson,
        });
    } catch (error) {
        console.error('Error saat mengambil lesson by ID:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Update Lesson Header
 * @route   PUT /api/lessons/:id
 * @access  Private (Admin)
 */
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, cefr_level, lesson_type, order_index } =
            req.body;

        const lesson = await Lesson.findByPk(id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' });
        }

        // Update fields
        lesson.title = title || lesson.title;
        lesson.description = description || lesson.description;
        lesson.cefr_level = cefr_level || lesson.cefr_level;
        lesson.lesson_type = lesson_type || lesson.lesson_type;
        if (order_index !== undefined) lesson.order_index = order_index;

        await lesson.save();

        res.status(200).json({
            message: 'Lesson berhasil diperbarui',
            data: lesson,
        });
    } catch (error) {
        console.error('Error saat memperbarui lesson:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Hapus Lesson (Cascade Delete)
 * @route   DELETE /api/lessons/:id
 * @access  Private (Admin)
 */
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await Lesson.findByPk(id);

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' });
        }

        // Karena kita set ON DELETE CASCADE di database (SQL),
        // menghapus parent akan otomatis menghapus content, question, dan options.
        await lesson.destroy();

        res.status(200).json({
            message:
                'Lesson berhasil dihapus permanen beserta seluruh kontennya.',
            data: { id },
        });
    } catch (error) {
        console.error('Error saat menghapus lesson:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
};
