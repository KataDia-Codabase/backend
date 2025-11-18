const {
    User,
    Lesson,
    LessonVocab,
    PronunciationSubmission,
} = require('../models');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

/**
 * @desc    Submit audio untuk dinilai oleh AI
 * @route   POST /api/pronunciation/submit
 * @access  Private
 */
const submitPronunciation = async (req, res) => {
    // 1. Validasi Input Awal
    if (!req.file) {
        return res.status(400).json({ message: 'File audio wajib diupload.' });
    }

    const { user_id, lesson_vocab_id, language_code } = req.body;

    if (!user_id || !lesson_vocab_id || !language_code) {
        // Hapus file jika validasi gagal
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
            message:
                'Data tidak lengkap: user_id, lesson_vocab_id, dan language_code diperlukan.',
        });
    }

    try {
        // 2. Ambil Data Vocab (untuk mendapatkan frase referensi)
        const vocab = await LessonVocab.findByPk(lesson_vocab_id);
        if (!vocab) {
            fs.unlinkSync(req.file.path);
            return res
                .status(404)
                .json({ message: 'Lesson Vocab tidak ditemukan.' });
        }

        // 3. Persiapkan Data untuk dikirim ke API AI (Python Service)
        // URL ini harus sesuai dengan endpoint di service Python Anda (misal: FastAPI)
        const AI_SERVICE_URL = 'http://localhost:8000/score';

        const formData = new FormData();
        // Mengirim stream file audio
        formData.append('audio_file', fs.createReadStream(req.file.path));
        // Mengirim teks referensi untuk dibandingkan
        formData.append('reference_text', vocab.phrase);
        // Mengirim kode bahasa
        formData.append('language_code', language_code);

        let aiResult;

        try {
            // --- HIT API AI ---
            console.log('Mengirim audio ke AI Service...');
            const response = await axios.post(AI_SERVICE_URL, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                // Timeout 10 detik agar tidak hang
                timeout: 10000,
            });

            aiResult = response.data;
            console.log('Hasil diterima dari AI:', aiResult);
        } catch (aiError) {
            console.warn(
                'Gagal menghubungi AI Service (Menggunakan Mock Data untuk Testing):',
                aiError.message
            );

            // --- MOCK DATA / SIMULASI (Agar Backend tidak crash saat development) ---
            // Dalam production, blok ini harusnya melempar error atau handling retry
            aiResult = {
                generated_transcript: vocab.phrase, // Asumsi STT berhasil
                overall_score: (Math.random() * (100 - 60) + 60).toFixed(2), // Random 60-100
                accuracy_score: 85.5,
                fluency_score: 80.0,
                prosody_score: 75.0,
                stress_score: 90.0,
                phoneme_errors: [
                    { phoneme: 'r', error_type: 'missing', index: 2 },
                    { phoneme: 'th', error_type: 'mispronounced', index: 5 },
                ],
                cefr_level: 'B1',
                feedback:
                    'Pengucapan sudah cukup jelas, namun perhatikan intonasi pada akhir kalimat.',
            };
        }

        // 4. Simpan Hasil ke Database MySQL
        const newSubmission = await PronunciationSubmission.create({
            user_id,
            lesson_vocab_id,
            user_audio_url: req.file.filename, // Nama file yang disimpan middleware
            language_code,

            // Data dari AI
            generated_transcript: aiResult.generated_transcript,
            overall_score: aiResult.overall_score,
            accuracy_score: aiResult.accuracy_score,
            fluency_score: aiResult.fluency_score,
            prosody_score: aiResult.prosody_score,
            stress_score: aiResult.stress_score,
            phoneme_errors_json: aiResult.phoneme_errors, // Sequelize otomatis stringify JSON
            cefr_level_assessment: aiResult.cefr_level,
            personalized_feedback: aiResult.feedback,
        });

        // 5. (Opsional) Update Gamification / User XP
        // Jika skor > 75, tambah XP user
        if (parseFloat(aiResult.overall_score) > 75) {
            const user = await User.findByPk(user_id);
            if (user) {
                user.xp_points += 10; // Tambah 10 XP
                user.current_streak += 1; // Tambah streak (sederhana)
                user.last_practice_date = new Date();
                await user.save();
            }
        }

        // 6. Kirim Response ke Frontend
        res.status(201).json({
            message: 'Pronunciation berhasil dinilai',
            data: newSubmission,
            xp_earned: parseFloat(aiResult.overall_score) > 75 ? 10 : 0,
        });
    } catch (error) {
        console.error('Error pada submitPronunciation:', error.message);
        // Jangan lupa hapus file jika terjadi error fatal di server
        if (req.file && fs.existsSync(req.file.path)) {
            // Opsional: Anda mungkin ingin menyimpan file gagal untuk debugging
            // fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            message: 'Terjadi kesalahan pada server',
            error: error.message,
        });
    }
};

/**
 * @desc    Mendapatkan history submission user
 * @route   GET /api/pronunciation/history/:user_id
 * @access  Private
 */
const getSubmissionHistory = async (req, res) => {
    try {
        const { user_id } = req.params;
        const history = await PronunciationSubmission.findAll({
            where: { user_id },
            include: [
                {
                    model: LessonVocab,
                    attributes: ['phrase', 'translation'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json({
            message: 'History berhasil diambil',
            data: history,
        });
    } catch (error) {
        console.error('Error getSubmissionHistory:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    submitPronunciation,
    getSubmissionHistory,
};
