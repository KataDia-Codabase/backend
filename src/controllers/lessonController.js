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

/**
 * @desc    Endpoint Khusus Sync ke SQLite Frontend
 * @route   GET /api/lessons/sync
 */
const getLessonsForSync = async (req, res) => {
    try {
        // Ambil data mentah dari MySQL
        const lessons = await Lesson.findAll({
            include: [
                {
                    model: LessonContent,
                    as: 'contents',
                    include: [
                        {
                            model: LessonQuestion,
                            as: 'questions',
                            include: [{ model: LessonOption, as: 'options' }],
                        },
                    ],
                },
            ],
        });

        // --- PROSES PENJEMBATANAN DATA ---
        const formattedData = lessons.map((lesson) => {
            // Container untuk tabel-tabel pecahan SQLite
            const readingPassages = [];
            const listeningSegments = [];
            const speakingTasks = [];

            // Container untuk Quiz (karena di SQLite nempel ke Lesson, bukan Content)
            const quizQuestions = [];
            const quizOptions = [];

            // 1. JEMBATAN KONTEN (Pecah lesson_contents MySQL ke tabel spesifik SQLite)
            const processedContents = lesson.contents.map((content) => {
                // Konversi ID ke String
                const contentIdStr = content.id.toString();
                const lessonIdStr = lesson.id.toString();

                // Logika Pemisahan Data
                if (lesson.lesson_type === 'reading' && content.text_content) {
                    readingPassages.push({
                        id: `rp_${content.id}`, // ID Unik dummy untuk SQLite
                        lesson_contents_id: contentIdStr,
                        title: lesson.title,
                        passage_text: content.text_content, // Mapping Teks
                    });
                } else if (
                    lesson.lesson_type === 'listening' &&
                    content.media_url
                ) {
                    listeningSegments.push({
                        id: `ls_${content.id}`,
                        lesson_contents_id: contentIdStr,
                        audio_url: content.media_url, // Mapping Audio
                        order_index: 0,
                    });
                } else if (lesson.lesson_type === 'speaking') {
                    speakingTasks.push({
                        id: `st_${content.id}`,
                        lesson_contents_id: contentIdStr,
                        prompt_text: content.text_content, // Mapping Prompt
                        audio_url: content.media_url,
                    });
                }

                // 2. JEMBATAN SOAL (Flattening Hierarchy)
                // Ambil soal dari dalam content ini, pindahkan ke array quizQuestions lesson
                if (content.questions) {
                    content.questions.forEach((q) => {
                        const qIdStr = q.id.toString();

                        quizQuestions.push({
                            id: qIdStr,
                            lesson_id: lessonIdStr, // Link langsung ke Lesson ID
                            question_text: q.question_text,
                            question_type: lesson.lesson_type,
                            order_index: 0,
                        });

                        // 3. JEMBATAN OPSI & BOOLEAN
                        if (q.options) {
                            q.options.forEach((opt) => {
                                quizOptions.push({
                                    id: opt.id.toString(),
                                    question_id: qIdStr,
                                    option_text: opt.option_text,
                                    is_correct: opt.is_correct ? 1 : 0, // True/False -> 1/0
                                    order_index: 0,
                                });
                            });
                        }
                    });
                }

                // Kembalikan struktur tabel lesson_contents dasar untuk SQLite
                return {
                    id: contentIdStr,
                    lesson_id: lessonIdStr,
                    description: '',
                    order_index: 0,
                    created_at: new Date().toISOString(),
                };
            });

            // Susun Final Object sesuai kebutuhan Logic Sync Frontend
            return {
                lesson_data: {
                    // Tabel 'lessons'
                    id: lesson.id.toString(),
                    title: lesson.title,
                    type: lesson.lesson_type,
                    cefr_level: lesson.cefr_level,
                    description: lesson.description,
                    created_at: lesson.created_at,
                },
                contents: processedContents, // Tabel 'lesson_contents'
                details: {
                    // Tabel-tabel spesifik
                    reading_passages: readingPassages,
                    listening_segments: listeningSegments,
                    speaking_tasks: speakingTasks,
                },
                quizzes: {
                    // Tabel 'quiz_questions' & 'quiz_options'
                    questions: quizQuestions,
                    options: quizOptions,
                },
            };
        });

        res.status(200).json({
            message: 'Data sync berhasil diambil',
            data: formattedData,
        });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createLesson,
    getAllLessons,
    getLessonById,
    updateLesson,
    deleteLesson,
    getLessonsForSync,
};
