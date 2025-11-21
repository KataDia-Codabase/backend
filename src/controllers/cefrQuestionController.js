const { CefrTest, CefrQuestion, CefrOption } = require('../models');
const fs = require('fs');
const path = require('path');

// --- Helper: Process Upload (Reused logic) ---
// Sederhana: kita ambil file dari req.file dan return nama filenya
// (Anda bisa tambahkan logika convert ke WAV disini jika mau, mirip lessonContentController)
const processUploadedFile = (file) => {
    return file.filename;
};

/**
 * @desc    Membuat Soal CEFR Baru (Support Audio Upload & Options)
 * @route   POST /api/cefr-questions
 * @access  Private (Admin)
 * @payload Multipart Form Data:
 * - cefr_test_id: 1
 * - section_type: 'listening' | 'reading' | 'vocabulary' | 'speaking'
 * - text_content: "Pertanyaan atau Teks Bacaan"
 * - target_audio: (File Audio - Optional, wajib jika listening)
 * - options: JSON String "[{'option_text':'A', 'is_correct':true}, ...]"
 */
const createCefrQuestion = async (req, res) => {
    const { cefr_test_id, section_type, text_content, order_index } = req.body;
    let options = req.body.options; // Bisa string (dari form-data) atau object (dari json raw)

    // 1. Validasi Dasar
    if (!cefr_test_id || !section_type) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res
            .status(400)
            .json({ message: 'cefr_test_id dan section_type wajib diisi.' });
    }

    // 2. Parse Options jika dikirim sebagai string (karena multipart/form-data)
    if (typeof options === 'string') {
        try {
            options = JSON.parse(options);
        } catch (e) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res
                .status(400)
                .json({
                    message: 'Format options tidak valid (harus JSON Array).',
                });
        }
    }

    try {
        // 3. Cek Test Induk
        const test = await CefrTest.findByPk(cefr_test_id);
        if (!test) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res
                .status(404)
                .json({ message: 'Cefr Test tidak ditemukan.' });
        }

        // 4. Proses File Audio (Jika ada)
        let media_url = null;
        if (req.file) {
            media_url = processUploadedFile(req.file);
        } else if (section_type === 'listening') {
            // Validasi: Listening WAJIB punya audio
            return res
                .status(400)
                .json({ message: 'Soal Listening wajib upload audio.' });
        }

        // 5. Buat Question
        const newQuestion = await CefrQuestion.create({
            cefr_test_id,
            section_type,
            text_content: text_content || '', // Bisa kosong jika listening murni
            media_url: media_url,
            order_index: order_index || 0,
        });

        // 6. Buat Options (Jika bukan Speaking dan options ada)
        // Speaking tidak punya pilihan ganda
        let createdOptions = [];
        if (section_type !== 'speaking' && options && Array.isArray(options)) {
            const optionsPayload = options.map((opt) => ({
                cefr_question_id: newQuestion.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct || false, // Pastikan boolean
            }));

            createdOptions = await CefrOption.bulkCreate(optionsPayload);
        }

        res.status(201).json({
            message: 'Soal CEFR berhasil dibuat.',
            data: {
                ...newQuestion.toJSON(),
                options: createdOptions,
            },
        });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Error createCefrQuestion:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Ambil Semua Soal dalam Satu Paket Ujian (Admin View)
 * @route   GET /api/cefr-questions/:cefr_test_id
 * @access  Private (Admin)
 */
const getQuestionsAdmin = async (req, res) => {
    try {
        const { cefr_test_id } = req.params;

        const questions = await CefrQuestion.findAll({
            where: { cefr_test_id },
            include: [
                {
                    model: CefrOption,
                    as: 'options',
                    // Di sini kita TAMPILKAN is_correct karena ini untuk Admin
                    attributes: ['id', 'option_text', 'is_correct'],
                },
            ],
            order: [
                ['order_index', 'ASC'],
                ['id', 'ASC'],
                [{ model: CefrOption, as: 'options' }, 'id', 'ASC'],
            ],
        });

        res.status(200).json({
            message: 'Data soal berhasil diambil.',
            data: questions,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Hapus Soal CEFR
 * @route   DELETE /api/cefr-questions/:id
 */
const deleteCefrQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await CefrQuestion.findByPk(id);

        if (!question) {
            return res.status(404).json({ message: 'Soal tidak ditemukan.' });
        }

        // Hapus file fisik jika ada
        if (question.media_url && !question.media_url.startsWith('http')) {
            const filePath = path.join(
                __dirname,
                '../../public/uploads/audio',
                question.media_url
            );
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {}
            }
        }

        await question.destroy();

        res.status(200).json({
            message: 'Soal CEFR berhasil dihapus.',
            data: { id },
        });
    } catch (error) {
        console.error('Error deleteCefrQuestion:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createCefrQuestion,
    getQuestionsAdmin,
    deleteCefrQuestion,
};
