const { LessonVocab, Lesson } = require('../models');
const path = require('path'); // <-- Perlu 'path'
const fs = require('fs'); // <-- Perlu 'fs'

/**
 * @desc    Membuat item vocab baru dan menambahkannya ke lesson
 * @route   POST /api/vocab
 * @access  Private (Asumsi: Admin)
 */
const createLessonVocab = async (req, res) => {
    // Data non-file sekarang ada di req.body
    const { lesson_id, phrase, translation } = req.body;

    // File yang di-upload (jika ada) ada di req.file
    // Middleware kita akan error JIKA BUKAN audio, tapi kita cek jika filenya ada
    if (!req.file) {
        return res.status(400).json({
            message:
                'Gagal membuat vocab: File audio (dengan key "target_audio") wajib diisi.',
        });
    }

    // Validasi input dasar
    if (!lesson_id || !phrase) {
        return res.status(400).json({
            message:
                'Gagal membuat vocab: field lesson_id dan phrase wajib diisi.',
        });
    }

    try {
        // 1. Pastikan Lesson induknya ada
        const lesson = await Lesson.findByPk(lesson_id);
        if (!lesson) {
            // Hapus file yang terlanjur di-upload jika lesson tidak ada
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Lesson tidak ditemukan.' });
        }

        // 2. Buat item vocab baru dengan NAMA FILE
        const newVocab = await LessonVocab.create({
            lesson_id,
            phrase,
            translation,
            // Simpan HANYA NAMA FILENYA di database
            audio_url: req.file.filename,
        });

        res.status(201).json({
            message: 'Item vocab berhasil ditambahkan ke lesson',
            data: newVocab,
        });
    } catch (error) {
        console.error('Error saat membuat lesson vocab:', error.message);
        // Jika terjadi error database, hapus file yang terlanjur di-upload
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Mendapatkan semua item vocab (biasanya difilter per lesson)
 * @route   GET /api/vocab
 * @route   GET /api/vocab?lesson_id=1
 * @access  Public
 */
const getAllLessonVocab = async (req, res) => {
    try {
        const { lesson_id } = req.query;

        const whereClause = {};
        if (lesson_id) {
            whereClause.lesson_id = lesson_id;
        }

        const vocabs = await LessonVocab.findAll({
            where: whereClause,
            order: [['id', 'ASC']], // Urutkan berdasarkan urutan dibuat
        });

        res.status(200).json({
            message: 'Item vocab berhasil diambil',
            data: vocabs,
        });
    } catch (error) {
        console.error(
            'Error saat mengambil semua lesson vocab:',
            error.message
        );
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Mendapatkan detail satu item vocab
 * @route   GET /api/vocab/:id
 * @access  Public
 */
const getLessonVocabById = async (req, res) => {
    try {
        const { id } = req.params;
        const vocab = await LessonVocab.findByPk(id, {
            include: [{ model: Lesson, as: 'lesson' }], // Sertakan info lesson induknya
        });

        if (!vocab) {
            return res
                .status(404)
                .json({ message: 'Item vocab tidak ditemukan' });
        }

        res.status(200).json({
            message: 'Item vocab berhasil ditemukan',
            data: vocab,
        });
    } catch (error) {
        console.error('Error saat mengambil vocab by ID:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Memperbarui item vocab
 * @route   PUT /api/vocab/:id
 * @access  Private (Asumsi: Admin)
 */
const updateLessonVocab = async (req, res) => {
    try {
        const { id } = req.params;
        const { lesson_id, phrase, translation } = req.body; // Data non-file

        const vocab = await LessonVocab.findByPk(id);

        if (!vocab) {
            // Jika vocab tidak ditemukan, hapus file baru (jika ada)
            if (req.file) fs.unlinkSync(req.file.path);
            return res
                .status(404)
                .json({ message: 'Item vocab tidak ditemukan' });
        }

        // Jika lesson_id diubah, pastikan lesson baru itu ada
        if (lesson_id && lesson_id !== vocab.lesson_id) {
            const lessonExists = await Lesson.findByPk(lesson_id);
            if (!lessonExists) {
                return res
                    .status(404)
                    .json({ message: 'Lesson (tujuan) baru tidak ditemukan' });
            }
            vocab.lesson_id = lesson_id;
        }

        // Update field yang ada di body
        vocab.phrase = phrase || vocab.phrase;
        vocab.translation = translation || vocab.translation;

        // Cek jika ada file BARU yang di-upload
        if (req.file) {
            const newFilename = req.file.filename;
            const oldFilename = vocab.audio_url;

            // 1. Hapus file audio LAMA (jika ada)
            if (oldFilename) {
                const oldPath = path.join(
                    __dirname,
                    '../../public/uploads/audio',
                    oldFilename
                );
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // 2. Gunakan nama file BARU
            vocab.audio_url = newFilename;
        }

        await vocab.save();

        res.status(200).json({
            message: 'Item vocab berhasil diperbarui',
            data: vocab,
        });
    } catch (error) {
        // Jika error, hapus file baru (jika ada)
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Error saat memperbarui lesson vocab:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Menghapus item vocab
 * @route   DELETE /api/vocab/:id
 * @access  Private (Asumsi: Admin)
 */
const deleteLessonVocab = async (req, res) => {
    try {
        const { id } = req.params;
        const vocab = await LessonVocab.findByPk(id);

        if (!vocab) {
            return res
                .status(404)
                .json({ message: 'Item vocab tidak ditemukan' });
        }

        const oldFilename = vocab.audio_url;

        if (oldFilename) {
            const oldPath = path.join(
                __dirname,
                '../../public/uploads/audio',
                oldFilename
            );
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        await vocab.destroy();

        res.status(200).json({
            message: 'Item vocab berhasil dihapus',
            data: { id: id },
        });
    } catch (error) {
        console.error('Error saat menghapus lesson vocab:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Mengirimkan file audio (streaming)
 * @route   GET /api/vocab/audio/:filename
 * @access  Public
 */
const getAudioFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(
            __dirname,
            '../../public/uploads/audio',
            filename
        );

        // Cek apakah file ada
        if (fs.existsSync(filePath)) {
            // Kirim file
            res.sendFile(filePath);
        } else {
            res.status(404).json({ message: 'File audio tidak ditemukan.' });
        }
    } catch (error) {
        console.error('Error saat mengambil file audio:', error.message);
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

// Export semua fungsi (termasuk yang baru)
module.exports = {
    createLessonVocab,
    getAllLessonVocab,
    getLessonVocabById,
    updateLessonVocab,
    deleteLessonVocab,
    getAudioFile, // <-- Export fungsi baru
};
