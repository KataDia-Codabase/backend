const { Lesson, LessonContent, LessonQuestion } = require('../models');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Menambahkan konten ke dalam Lesson (Support File Upload)
 * @route   POST /api/contents
 * @access  Private (Admin)
 */
const createContent = async (req, res) => {
    const { lesson_id, text_content } = req.body;

    // Cek apakah ada file yang diupload via middleware 'media_url'
    // Jika ada, simpan nama filenya. Jika tidak, cek body (fallback)
    const media_url = req.file ? req.file.filename : req.body.media_url;

    // Validasi: lesson_id wajib
    if (!lesson_id) {
        // Hapus file jika terlanjur upload tapi data tidak valid
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'lesson_id wajib diisi.' });
    }

    // Validasi: Minimal ada text_content ATAU media_url (file/string)
    if (!text_content && !media_url) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
            message:
                'Konten tidak boleh kosong. Upload audio (key: media_url) atau isi text_content.',
        });
    }

    try {
        const lesson = await Lesson.findByPk(lesson_id);
        if (!lesson) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Lesson tidak ditemukan.' });
        }

        const newContent = await LessonContent.create({
            lesson_id,
            text_content: text_content || null,
            media_url: media_url || null,
        });

        res.status(201).json({
            message: 'Konten berhasil ditambahkan.',
            data: newContent,
        });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Error createContent:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Ambil semua konten milik Lesson tertentu
 * @route   GET /api/contents?lesson_id=1
 */
const getContentsByLessonId = async (req, res) => {
    try {
        const { lesson_id } = req.query;

        if (!lesson_id) {
            return res
                .status(400)
                .json({ message: 'Parameter ?lesson_id= wajib diisi.' });
        }

        const contents = await LessonContent.findAll({
            where: { lesson_id },
            include: [
                {
                    model: LessonQuestion,
                    as: 'questions',
                    attributes: ['id', 'question_text'],
                },
            ],
            order: [['id', 'ASC']],
        });

        res.status(200).json({
            message: `Konten untuk lesson_id ${lesson_id} berhasil diambil.`,
            data: contents,
        });
    } catch (error) {
        console.error('Error getContentsByLessonId:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Ambil detail satu konten
 * @route   GET /api/contents/:id
 */
const getContentById = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await LessonContent.findByPk(id, {
            include: [{ model: Lesson, as: 'lesson' }],
        });

        if (!content) {
            return res.status(404).json({ message: 'Konten tidak ditemukan.' });
        }

        res.status(200).json({
            message: 'Detail konten berhasil ditemukan.',
            data: content,
        });
    } catch (error) {
        console.error('Error getContentById:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Update konten (Ganti Audio atau Edit Teks)
 * @route   PUT /api/contents/:id
 * @access  Private (Admin)
 */
const updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { text_content } = req.body;

        const content = await LessonContent.findByPk(id);
        if (!content) {
            // Hapus file baru jika konten lama tidak ketemu
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Konten tidak ditemukan.' });
        }

        // 1. Update Text jika ada
        if (text_content !== undefined) content.text_content = text_content;

        // 2. Update Audio File jika ada upload baru
        if (req.file) {
            const newFilename = req.file.filename;
            const oldFilename = content.media_url;

            // Hapus file lama dari disk jika ada & bukan URL eksternal (asumsi file lokal tidak punya 'http')
            if (oldFilename && !oldFilename.startsWith('http')) {
                const oldPath = path.join(
                    __dirname,
                    '../../public/uploads/audio',
                    oldFilename
                );
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            content.media_url = newFilename;
        } else if (req.body.media_url) {
            // Fallback: jika admin update via string URL (jarang terjadi jika upload mode)
            content.media_url = req.body.media_url;
        }

        await content.save();

        res.status(200).json({
            message: 'Konten berhasil diperbarui.',
            data: content,
        });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Error updateContent:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Hapus konten & File Audio Terkait
 * @route   DELETE /api/contents/:id
 */
const deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await LessonContent.findByPk(id);

        if (!content) {
            return res.status(404).json({ message: 'Konten tidak ditemukan.' });
        }

        // Hapus file fisik audio jika ada
        if (content.media_url && !content.media_url.startsWith('http')) {
            const filePath = path.join(
                __dirname,
                '../../public/uploads/audio',
                content.media_url
            );
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await content.destroy();

        res.status(200).json({
            message: 'Konten berhasil dihapus beserta file audionya.',
            data: { id },
        });
    } catch (error) {
        console.error('Error deleteContent:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Stream/Download File Audio Konten
 * @route   GET /api/content/audio/:filename
 */
const getContentFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(
            __dirname,
            '../../public/uploads/audio',
            filename
        );

        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ message: 'File audio tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error getContentFile:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createContent,
    getContentsByLessonId,
    getContentById,
    updateContent,
    deleteContent,
    getContentFile, // Export fungsi baru
};
