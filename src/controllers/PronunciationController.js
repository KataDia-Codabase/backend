const {
    LessonVocab,
    Lesson,
    User,
    PronunciationSubmission,
} = require('../models');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// URL API AI yang baru
const AI_SERVICE_URL = 'https://katadia.hshinoshowcase.site/api/v1/score';

/**
 * @desc    Submit audio untuk penilaian pronunciation
 * @route   POST /api/pronunciation/submit
 * @access  Private
 */
const submitPronunciation = async (req, res) => {
    // Ambil data dari body. session_id opsional (bisa null)
    const { user_id, lesson_vocab_id, session_id } = req.body;

    // 1. Validasi Request Dasar
    if (!req.file) {
        return res.status(400).json({
            message: 'File audio wajib diupload (key: target_audio).',
        });
    }
    if (!user_id || !lesson_vocab_id) {
        // Bersihkan file jika validasi gagal
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res
            .status(400)
            .json({ message: 'user_id dan lesson_vocab_id wajib diisi.' });
    }

    // Logika Session ID: Pakai dari frontend, atau generate baru jika tidak ada
    const finalSessionId = session_id || uuidv4();

    try {
        // 2. Ambil Data Lesson Vocab dari Database
        const vocabItem = await LessonVocab.findByPk(lesson_vocab_id, {
            include: [{ model: Lesson, as: 'lesson' }],
        });

        if (!vocabItem) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res
                .status(404)
                .json({ message: 'Lesson Vocab tidak ditemukan.' });
        }

        // Ambil transcript (kata yang harus dibaca) dan bahasa
        const targetTranscript = vocabItem.phrase;
        const targetLanguage = vocabItem.lesson.language_code; // e.g., 'en-US' atau 'id-ID'

        // 3. Persiapkan FormData untuk API AI
        const form = new FormData();
        form.append('user_id', user_id);
        form.append('language', targetLanguage); // Sesuai request: 'language'
        form.append('transcript', targetTranscript); // Sesuai request: 'transcript'
        form.append('session_id', finalSessionId); // Sesuai request: 'session_id'

        // Masukkan file audio. Key-nya 'audio_file' sesuai instruksi Anda.
        form.append('audio_file', fs.createReadStream(req.file.path));

        console.log(`[AI Hit] Mengirim ke ${AI_SERVICE_URL}...`);
        // return res.json({ formData: form });
        // 4. Hit API AI
        const aiResponse = await axios.post(AI_SERVICE_URL, form, {
            headers: {
                ...form.getHeaders(), // Header multipart/form-data yang benar
            },
            // timeout: 30000, // Timeout diperpanjang ke 30s jaga-jaga AI prosesnya lama
        });

        const aiResult = aiResponse.data;

        // Debug: Cek apa yang dikembalikan AI di console
        console.log('AI Response:', JSON.stringify(aiResult, null, 2));

        // 5. Mapping Response JSON ke Database Model
        // Berdasarkan file JSON yang Anda upload
        const submission = await PronunciationSubmission.create({
            user_id: user_id,
            lesson_vocab_id: lesson_vocab_id,
            user_audio_url: req.file.filename, // Simpan nama file lokal

            // Mapping dari JSON Response AI
            generated_transcript:
                aiResult.generated_transcript ||
                aiResult.recognized_transcript ||
                '',
            language_code: aiResult.language_code || targetLanguage,

            overall_score: aiResult.overall_score,
            accuracy_score: aiResult.accuracy_score,
            fluency_score: aiResult.fluency_score,
            prosody_score: aiResult.prosody_score,
            stress_score: aiResult.stress_score,

            // Data JSON dan Text
            phoneme_errors_json: aiResult.phoneme_errors_json, // Sequelize handle JSON otomatis
            personalized_feedback: aiResult.personalized_feedback,
            cefr_level_assessment:
                aiResult.cefr_level_assessment || aiResult.cefr_level, // Fallback ke cefr_level
        });

        // 6. Kirim Response ke Frontend
        res.status(201).json({
            message: 'Pronunciation berhasil dinilai',
            data: {
                submission_id: submission.id,
                session_id: finalSessionId,
                scores: {
                    overall: submission.overall_score,
                    accuracy: submission.accuracy_score,
                    fluency: submission.fluency_score,
                    prosody: submission.prosody_score,
                    stress: submission.stress_score,
                },
                feedback: submission.personalized_feedback,
                errors: submission.phoneme_errors_json,
                cefr: submission.cefr_level_assessment,
            },
        });
    } catch (error) {
        console.error('Error pada submitPronunciation:', error.message);

        // Jika error dari response API AI (misal 422 Unprocessable Entity atau 500)
        if (error.response) {
            console.error('AI Error Data:', error.response.data);
            return res.status(error.response.status).json({
                message: 'Gagal mendapatkan penilaian dari AI Service',
                detail: error.response.data,
            });
        }

        res.status(500).json({
            message: 'Terjadi kesalahan internal server',
            error: error.message,
        });
    }
    // Catatan: Kita TIDAK menghapus file audio lokal di blok finally/success
    // karena file tersebut dibutuhkan untuk diputar ulang oleh user (endpoint GET audio).
};

/**
 * @desc    Mendapatkan history submission user
 * @route   GET /api/pronunciation/history/:user_id
 */
const getSubmissionHistory = async (req, res) => {
    try {
        const { user_id } = req.params;

        const history = await PronunciationSubmission.findAll({
            where: { user_id },
            include: [
                {
                    model: LessonVocab,
                    as: 'lesson_vocab',
                    attributes: ['phrase', 'translation', 'target_audio_url'], // Include target audio juga
                },
            ],
            order: [['created_at', 'DESC']],
            limit: 20,
        });

        res.status(200).json({
            message: 'History berhasil diambil',
            data: history,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    submitPronunciation,
    getSubmissionHistory,
};
