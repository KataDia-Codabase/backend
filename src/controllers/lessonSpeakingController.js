const {
    Lesson,
    LessonContent,
    LessonSpeakingAttempt,
    User,
} = require('../models');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const { v4: uuidv4 } = require('uuid');

// URL API AI
const AI_SERVICE_URL = 'https://katadia.hshinoshowcase.site/api/v1/score';

// --- Helper: Convert Audio ---
const convertToWav = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('wav')
            .audioFrequency(16000)
            .audioChannels(1)
            .on('error', (err) => reject(err))
            .on('end', () => resolve(outputPath))
            .save(outputPath);
    });
};

/**
 * @desc    Submit Speaking Latihan (Standard Lesson)
 * @route   POST /api/speaking/submit
 * @access  Private (User)
 */
const submitSpeakingAttempt = async (req, res) => {
    const { user_id, lesson_id } = req.body;
    let uploadedFile = req.file;
    let tempConvertedPath = null;

    // 1. Validasi Dasar
    if (!uploadedFile)
        return res.status(400).json({ message: 'File audio wajib diupload.' });
    if (!user_id || !lesson_id) {
        fs.unlinkSync(uploadedFile.path);
        return res
            .status(400)
            .json({ message: 'user_id dan lesson_id wajib diisi.' });
    }

    try {
        // 2. Ambil Prompt Teks dari Lesson Content
        // Kita cari konten milik lesson ini yang berisi teks (sebagai prompt/transcript)
        const lessonContent = await LessonContent.findOne({
            where: { lesson_id },
            attributes: ['text_content'], // Di skema baru, prompt speaking ada di text_content
        });

        // Cek juga Lesson-nya untuk tahu bahasanya
        const lesson = await Lesson.findByPk(lesson_id);

        if (!lesson || !lessonContent || !lessonContent.text_content) {
            fs.unlinkSync(uploadedFile.path);
            return res.status(404).json({
                message: 'Lesson atau Prompt Speaking tidak ditemukan.',
            });
        }
        const finalSessionId = uuidv4();

        const targetTranscript = lessonContent.text_content;
        const targetLanguage = lesson.language_code || 'en-US'; // Default fallback

        // 3. Konversi Audio jika perlu
        let fileToSendPath = uploadedFile.path;
        if (path.extname(uploadedFile.originalname).toLowerCase() !== '.wav') {
            tempConvertedPath = uploadedFile.path + '_temp.wav';
            await convertToWav(uploadedFile.path, tempConvertedPath);
            fileToSendPath = tempConvertedPath;
        }

        // 4. Kirim ke AI
        const form = new FormData();
        form.append('user_id', user_id);
        form.append('language', targetLanguage); // e.g. 'en-US'
        form.append('transcript', targetTranscript); // Kalimat yang harus dibaca
        form.append('audio_file', fs.createReadStream(fileToSendPath));
        form.append('session_id', finalSessionId);

        // session_id opsional, bisa di-skip atau ditambah jika perlu
        // return res.json({ form });

        console.log(`[Speaking] Sending to AI: ${AI_SERVICE_URL}`);
        const aiResponse = await axios.post(AI_SERVICE_URL, form, {
            headers: { ...form.getHeaders() },
            timeout: 60000, // 60 detik timeout
        });

        const aiResult = aiResponse.data;

        // 5. Simpan ke Database
        const newAttempt = await LessonSpeakingAttempt.create({
            user_id,
            lesson_id,
            audio_url: uploadedFile.filename, // Simpan nama file asli
            ai_score_overall: aiResult.overall_score || 0,
            // Simpan JSON lengkap feedback agar frontend bisa render detail
            ai_feedback_json: aiResult,
        });

        // 6. Response ke Frontend
        res.status(201).json({
            message: 'Speaking attempt berhasil dinilai.',
            data: newAttempt,
        });
    } catch (error) {
        console.error('Error submitSpeakingAttempt:', error.message);
        if (error.response) {
            console.error('AI API Error:', error.response.data);
            return res.status(502).json({
                message: 'Gagal mendapatkan respons dari AI.',
                error: error.response.data,
            });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        // Cleanup file temp wav
        if (tempConvertedPath && fs.existsSync(tempConvertedPath)) {
            fs.unlinkSync(tempConvertedPath);
        }
        // File asli (uploadedFile) TIDAK dihapus, disimpan untuk history
    }
};

/**
 * @desc    Lihat History Speaking user di lesson tertentu
 * @route   GET /api/speaking/history?user_id=1&lesson_id=5
 */
const getSpeakingHistory = async (req, res) => {
    try {
        const { user_id, lesson_id } = req.query;

        const whereClause = {};
        if (user_id) whereClause.user_id = user_id;
        if (lesson_id) whereClause.lesson_id = lesson_id;

        const history = await LessonSpeakingAttempt.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: 10, // Ambil 10 terakhir saja
        });

        res.status(200).json({
            message: 'History speaking berhasil diambil.',
            data: history,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    submitSpeakingAttempt,
    getSpeakingHistory,
};
