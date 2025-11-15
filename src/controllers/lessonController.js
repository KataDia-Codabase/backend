const { Lesson, LessonVocab } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Membuat Lesson baru
 * @route   POST /api/lessons
 * @access  Private (Asumsi: Admin)
 */
const createLesson = async (req, res) => {
    const { title, description, language_code, cefr_level } = req.body;

    // Validasi input dasar
    if (!title || !language_code || !cefr_level) {
        return res.status(400).json({
            message:
                'Gagal membuat lesson: field title, language_code, dan cefr_level wajib diisi.',
        });
    }

    try {
        const newLesson = await Lesson.create({
            title,
            description,
            language_code,
            cefr_level,
        });

        res.status(201).json({
            message: 'Lesson berhasil dibuat',
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
 * @desc    Mendapatkan semua lessons (dengan filter)
 * @route   GET /api/lessons
 * @route   GET /api/lessons?language_code=id-ID&cefr_level=A1
 * @access  Public
 */
const getAllLessons = async (req, res) => {
    try {
        const { language_code, cefr_level, search } = req.query;

        // Opsi filter
        const whereClause = {};
        if (language_code) {
            whereClause.language_code = language_code;
        }
        if (cefr_level) {
            whereClause.cefr_level = cefr_level;
        }
        if (search) {
            whereClause.title = {
                [Op.like]: `%${search}%`,
            };
        }

        const lessons = await Lesson.findAll({
            where: whereClause,
            order: [
                ['cefr_level', 'ASC'], // Urutkan berdasarkan level
                ['title', 'ASC'], // Lalu berdasarkan judul
            ],
        });

        res.status(200).json({
            message: 'Lessons berhasil diambil',
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
 * @desc    Mendapatkan detail satu lesson (termasuk vocab-nya)
 * @route   GET /api/lessons/:id
 * @access  Public
 */
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await Lesson.findByPk(id, {
            include: [
                {
                    model: LessonVocab,
                    as: 'lesson_vocab', // 'as' harus cocok dengan alias di asosiasi model (jika ada)
                },
            ],
        });

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' });
        }

        res.status(200).json({
            message: 'Lesson berhasil ditemukan',
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
 * @desc    Memperbarui Lesson
 * @route   PUT /api/lessons/:id
 * @access  Private (Asumsi: Admin)
 */
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, language_code, cefr_level } = req.body;

        const lesson = await Lesson.findByPk(id);

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' });
        }

        // Update field yang ada di body
        lesson.title = title || lesson.title;
        lesson.description = description || lesson.description;
        lesson.language_code = language_code || lesson.language_code;
        lesson.cefr_level = cefr_level || lesson.cefr_level;

        await lesson.save();

        res.status(200).json({
            message: 'Lesson berhasil diperbarui',
            data: lesson,
        });
    } catch (error) {
        console.error('Error saat memperbarui lesson:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Menghapus Lesson
 * @route   DELETE /api/lessons/:id
 * @access  Private (Asumsi: Admin)
 */
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await Lesson.findByPk(id);

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' });
        }

        await lesson.destroy();
        // Jika ON DELETE CASCADE di-setting di database (seperti di skema SQL kita),
        // semua 'lesson_vocab' terkait akan terhapus otomatis.

        res.status(200).json({
            message: 'Lesson berhasil dihapus',
            data: { id: id },
        });
    } catch (error) {
        console.error('Error saat menghapus lesson:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

// Export semua fungsi
module.exports = {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
};
