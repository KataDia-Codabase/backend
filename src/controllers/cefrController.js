const {
    CefrTest,
    CefrQuestion,
    CefrOption,
    UserCefrResult,
    UserCefrAnswer,
    UserCefrSpeaking,
    User,
} = require('../models');

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const AI_SERVICE_URL = 'https://katadia.hshinoshowcase.site/api/v1/score';

// --- Helper Convert Audio ---
const convertToWav = (inputPath, outputFilename) => {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(path.dirname(inputPath), outputFilename);
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
 * @desc    1. Memulai Ujian (Start Test)
 * @route   POST /api/cefr/start
 */
const startTest = async (req, res) => {
    const { user_id, cefr_test_id } = req.body;

    try {
        // Buat sesi result baru (Lembar jawaban kosong)
        const newResult = await UserCefrResult.create({
            user_id,
            cefr_test_id,
            total_score: 0,
            is_passed: false,
        });

        res.status(201).json({
            message: 'Ujian dimulai.',
            data: {
                result_id: newResult.id, // ID ini dipakai untuk submit jawaban nanti
                started_at: newResult.taken_at,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    2. Ambil Soal Ujian (Get Questions)
 * @route   GET /api/cefr/questions/:cefr_test_id
 */
const getTestQuestions = async (req, res) => {
    try {
        const { cefr_test_id } = req.params;

        const questions = await CefrQuestion.findAll({
            where: { cefr_test_id },
            attributes: [
                'id',
                'section_type',
                'text_content',
                'media_url',
                'order_index',
            ], // Pilih field aman
            include: [
                {
                    model: CefrOption,
                    as: 'options',
                    attributes: ['id', 'option_text'], // PENTING: Jangan kirim is_correct ke frontend!
                },
            ],
            order: [['order_index', 'ASC']],
        });

        res.status(200).json({
            message: 'Soal ujian berhasil diambil.',
            data: questions,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    3. Submit Jawaban Pilihan Ganda (Reading/Listening)
 * @route   POST /api/cefr/answer
 */
const submitMcqAnswer = async (req, res) => {
    const { result_id, question_id, selected_option_id } = req.body;

    try {
        // Cek Kunci Jawaban di Database (Backend check)
        const option = await CefrOption.findByPk(selected_option_id);
        const isCorrect = option ? option.is_correct : false;

        // Simpan jawaban user
        // Gunakan upsert atau create biasa. Disini kita pakai create.
        // Idealnya cek dulu apakah user sudah jawab soal ini di result_id yg sama (update jika ada).
        const answer = await UserCefrAnswer.create({
            result_id,
            question_id,
            selected_option_id,
            is_correct: isCorrect, // Langsung nilai true/false
        });

        res.status(200).json({ message: 'Jawaban tersimpan.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    4. Submit Jawaban Speaking (Audio)
 * @route   POST /api/cefr/speaking
 */
const submitSpeakingAnswer = async (req, res) => {
    const { result_id, question_id, user_id } = req.body;
    const uploadedFile = req.file;

    if (!uploadedFile)
        return res.status(400).json({ message: 'Audio wajib diupload.' });

    let tempConvertedPath = null;

    try {
        // Ambil Prompt Soal untuk dikirim ke AI (sebagai transcript referensi)
        const question = await CefrQuestion.findByPk(question_id);
        if (!question) throw new Error('Soal tidak ditemukan');

        // Convert Audio ke WAV
        let fileToSendPath = uploadedFile.path;
        if (path.extname(uploadedFile.originalname).toLowerCase() !== '.wav') {
            const filename =
                path.basename(
                    uploadedFile.filename,
                    path.extname(uploadedFile.filename)
                ) + '_conv.wav';
            tempConvertedPath = await convertToWav(uploadedFile.path, filename);
            fileToSendPath = tempConvertedPath;
        }

        // Kirim ke AI
        const form = new FormData();
        form.append('user_id', user_id);
        form.append('language', 'en-US'); // Default CEFR biasanya Inggris
        form.append('transcript', question.text_content); // Prompt soal
        form.append('audio_file', fs.createReadStream(fileToSendPath));

        const aiResponse = await axios.post(AI_SERVICE_URL, form, {
            headers: { ...form.getHeaders() },
            timeout: 45000,
        });

        // Ambil HANYA skornya
        const aiScore = aiResponse.data.overall_score || 0;

        // Simpan ke DB
        await UserCefrSpeaking.create({
            result_id,
            question_id,
            audio_url: uploadedFile.filename,
            ai_score: aiScore, // Feedback detail dibuang/tidak disimpan
        });

        res.status(200).json({ message: 'Audio Speaking tersimpan.' });
    } catch (error) {
        console.error('Speaking Error:', error.message);
        res.status(500).json({ message: 'Gagal memproses audio.' });
    } finally {
        if (tempConvertedPath && fs.existsSync(tempConvertedPath)) {
            fs.unlinkSync(tempConvertedPath);
        }
        // File asli jangan dihapus
    }
};

/**
 * @desc    5. Selesai Ujian & Hitung Nilai (Finish Test)
 * @route   POST /api/cefr/finish
 */
const finishTest = async (req, res) => {
    const { result_id } = req.body;

    try {
        const result = await UserCefrResult.findByPk(result_id, {
            include: [{ model: CefrTest, as: 'test' }],
        });
        if (!result)
            return res
                .status(404)
                .json({ message: 'Sesi ujian tidak ditemukan' });

        // --- LOGIKA PENILAIAN ---

        // A. Hitung Skor Pilihan Ganda (Reading/Listening)
        const mcqAnswers = await UserCefrAnswer.findAll({
            where: { result_id },
        });
        const correctMcqCount = mcqAnswers.filter((a) => a.is_correct).length;
        const totalMcqQuestions = await CefrQuestion.count({
            where: {
                cefr_test_id: result.cefr_test_id,
                section_type: ['reading', 'listening', 'vocabulary'],
            },
        });

        // Skor MCQ (Skala 0-100)
        // Hindari pembagian dengan nol
        const mcqScore =
            totalMcqQuestions > 0
                ? (correctMcqCount / totalMcqQuestions) * 100
                : 100; // Jika tidak ada soal MCQ, anggap full

        // B. Hitung Skor Speaking
        const speakingAnswers = await UserCefrSpeaking.findAll({
            where: { result_id },
        });
        let speakingScoreTotal = 0;
        speakingAnswers.forEach((ans) => {
            speakingScoreTotal += parseFloat(ans.ai_score || 0);
        });

        // Skor Speaking (Skala 0-100)
        const speakingScoreFinal =
            speakingAnswers.length > 0
                ? speakingScoreTotal / speakingAnswers.length
                : 100; // Jika tidak ada soal speaking, anggap full atau 0 tergantung kebijakan

        // C. Hitung Final Score (Bobot Rata-rata)
        // Misal: 50% nilai MCQ + 50% nilai Speaking
        // Atau bisa disesuaikan bobotnya
        const finalScore = mcqScore * 0.5 + speakingScoreFinal * 0.5;

        // D. Cek Kelulusan
        const passingScore = parseFloat(result.test.passing_score);
        const isPassed = finalScore >= passingScore;

        // E. Update Database Result
        result.total_score = finalScore;
        result.is_passed = isPassed;
        await result.save();

        // F. Update Level User JIKA Lulus
        if (isPassed) {
            const user = await User.findByPk(result.user_id);
            if (user) {
                // Update level user ke target level ujian ini
                user.current_cefr_level = result.test.target_level;
                await user.save();
            }
        }

        res.status(200).json({
            message: 'Ujian selesai.',
            data: {
                total_score: finalScore.toFixed(2),
                is_passed: isPassed,
                new_level: isPassed ? result.test.target_level : null,
                breakdown: {
                    mcq_score: mcqScore.toFixed(2),
                    speaking_score: speakingScoreFinal.toFixed(2),
                },
            },
        });
    } catch (error) {
        console.error('Finish Test Error:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    startTest,
    getTestQuestions,
    submitMcqAnswer,
    submitSpeakingAnswer,
    finishTest,
};
