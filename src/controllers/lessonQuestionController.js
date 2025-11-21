const { LessonContent, LessonQuestion, LessonOption } = require('../models');

/**
 * @desc    Membuat Soal Quiz baru BESERTA Pilihan Jawabannya
 * @route   POST /api/questions
 * @access  Private (Admin)
 * @body    {
 * "lesson_content_id": 1,
 * "question_text": "Apa warna langit?",
 * "options": [
 * { "option_text": "Biru", "is_correct": true },
 * { "option_text": "Merah", "is_correct": false }
 * ]
 * }
 */
const createQuestionWithOptions = async (req, res) => {
    const { lesson_content_id, question_text, options } = req.body;

    if (!lesson_content_id || !question_text) {
        return res.status(400).json({
            message: 'lesson_content_id dan question_text wajib diisi.',
        });
    }

    try {
        // 1. Pastikan Konten Induk ada
        const content = await LessonContent.findByPk(lesson_content_id);
        if (!content) {
            return res
                .status(404)
                .json({ message: 'Lesson Content tidak ditemukan.' });
        }

        // 2. Buat Soal
        const newQuestion = await LessonQuestion.create({
            lesson_content_id,
            question_text,
        });

        // 3. Buat Pilihan Jawaban (jika ada array options)
        let createdOptions = [];
        if (options && Array.isArray(options) && options.length > 0) {
            // Map options agar menyertakan question_id yang baru dibuat
            const optionsPayload = options.map((opt) => ({
                question_id: newQuestion.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct || false,
            }));

            createdOptions = await LessonOption.bulkCreate(optionsPayload);
        }

        res.status(201).json({
            message: 'Soal dan pilihan jawaban berhasil dibuat.',
            data: {
                ...newQuestion.toJSON(),
                options: createdOptions,
            },
        });
    } catch (error) {
        console.error('Error createQuestionWithOptions:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Ambil semua soal berdasarkan Content ID
 * @route   GET /api/questions?content_id=1
 */
const getQuestionsByContentId = async (req, res) => {
    try {
        const { content_id } = req.query;

        if (!content_id) {
            return res
                .status(400)
                .json({ message: 'Parameter ?content_id= wajib diisi.' });
        }

        const questions = await LessonQuestion.findAll({
            where: { lesson_content_id: content_id },
            include: [
                {
                    model: LessonOption,
                    as: 'options',
                    attributes: ['id', 'option_text', 'is_correct'], // Admin butuh lihat kunci jawaban
                },
            ],
            order: [
                ['id', 'ASC'], // Urutan soal
                [{ model: LessonOption, as: 'options' }, 'id', 'ASC'], // Urutan opsi A,B,C,D
            ],
        });

        res.status(200).json({
            message: 'Daftar soal berhasil diambil.',
            data: questions,
        });
    } catch (error) {
        console.error('Error getQuestionsByContentId:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Update Teks Soal
 * @route   PUT /api/questions/:id
 */
const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { question_text } = req.body;

        const question = await LessonQuestion.findByPk(id);
        if (!question) {
            return res.status(404).json({ message: 'Soal tidak ditemukan.' });
        }

        question.question_text = question_text || question.question_text;
        await question.save();

        res.status(200).json({
            message: 'Soal berhasil diperbarui.',
            data: question,
        });
    } catch (error) {
        console.error('Error updateQuestion:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Hapus Soal (Cascade delete options)
 * @route   DELETE /api/questions/:id
 */
const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await LessonQuestion.findByPk(id);

        if (!question) {
            return res.status(404).json({ message: 'Soal tidak ditemukan.' });
        }

        await question.destroy();
        // Opsi jawaban akan terhapus otomatis jika DB diset CASCADE,
        // atau Sequelize akan menghapusnya jika relasi dikonfigurasi dengan hooks: true

        res.status(200).json({
            message: 'Soal berhasil dihapus.',
            data: { id },
        });
    } catch (error) {
        console.error('Error deleteQuestion:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- FITUR TAMBAHAN: CRUD OPTION (Jika perlu edit opsi satu per satu) ---

/**
 * @desc    Tambah Opsi Jawaban Baru ke Soal yg sudah ada
 * @route   POST /api/questions/option
 */
const addOption = async (req, res) => {
    const { question_id, option_text, is_correct } = req.body;
    try {
        const option = await LessonOption.create({
            question_id,
            option_text,
            is_correct,
        });
        res.status(201).json({
            message: 'Opsi berhasil ditambah',
            data: option,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Hapus Opsi Jawaban
 * @route   DELETE /api/questions/option/:id
 */
const deleteOption = async (req, res) => {
    try {
        const { id } = req.params;
        await LessonOption.destroy({ where: { id } });
        res.status(200).json({ message: 'Opsi berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createQuestionWithOptions,
    getQuestionsByContentId,
    updateQuestion,
    deleteQuestion,
    addOption,
    deleteOption,
};
