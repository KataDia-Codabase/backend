const { LessonVocab, Lesson, PronunciationSubmission } = require('../models');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// --- UPDATE DIMULAI DISINI ---
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Memberitahu fluent-ffmpeg lokasi file binary ffmpeg yang benar
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// --- UPDATE BERAKHIR DISINI ---

// URL API AI
const AI_SERVICE_URL = 'https://katadia.hshinoshowcase.site/api/v1/score';

/**
 * Helper Function: Convert Audio to WAV
 * Mengubah file audio apapun menjadi WAV 16kHz Mono (Standar AI)
 */
const convertToWav = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('wav')
            .audioFrequency(16000) // Standarisasi ke 16kHz (opsional, tapi disarankan untuk AI)
            .audioChannels(1) // Standarisasi ke Mono (opsional)
            .on('error', (err) => {
                console.error('FFmpeg Error:', err);
                reject(err);
            })
            .on('end', () => {
                resolve(outputPath);
            })
            .save(outputPath);
    });
};

/**
 * @desc    Submit audio untuk penilaian pronunciation
 * @route   POST /api/pronunciation/submit
 * @access  Private
 */
const submitPronunciation = async (req, res) => {
    const { user_id, lesson_vocab_id, session_id } = req.body;

    // 1. Validasi Request Dasar
    if (!req.file) {
        return res
            .status(400)
            .json({
                message: 'File audio wajib diupload (key: target_audio).',
            });
    }
    if (!user_id || !lesson_vocab_id) {
        // Bersihkan file upload awal jika data tidak lengkap
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res
            .status(400)
            .json({ message: 'user_id dan lesson_vocab_id wajib diisi.' });
    }

    const finalSessionId = session_id || uuidv4();

    // Variable untuk melacak file sementara hasil konversi
    let fileToSendPath = req.file.path;
    let isConverted = false;
    let tempConvertedPath = null;

    try {
        // 2. Ambil Data Lesson Vocab
        const vocabItem = await LessonVocab.findByPk(lesson_vocab_id, {
            include: [{ model: Lesson, as: 'lesson' }],
        });

        if (!vocabItem) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res
                .status(404)
                .json({ message: 'Lesson Vocab tidak ditemukan.' });
        }

        const targetTranscript = vocabItem.phrase;
        const targetLanguage = vocabItem.lesson.language_code;

        // 3. LOGIKA KONVERSI AUDIO
        // Cek ekstensi file. Jika bukan .wav, lakukan konversi.
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        // NOTE: Kita ubah logikanya sedikit agar lebih robust.
        // Terkadang file .wav dari frontend formatnya tidak standar (misal header rusak atau codec salah).
        // Jadi lebih aman jika kita paksa convert SEMUA file ke standar 16kHz mono yang disukai AI,
        // TAPI untuk efisiensi, kita batasi konversi hanya jika bukan .wav atau jika diperlukan.
        // Untuk saat ini, sesuai request: konversi jika BUKAN .wav.

        if (fileExt !== '.wav') {
            console.log(
                `[Convert] File ${fileExt} terdeteksi. Mengonversi ke WAV...`
            );

            // Buat path sementara: uploads/audio/vocab-audio-xxx.wav
            // Kita ganti ekstensi file asli dengan .wav untuk nama file output sementara
            tempConvertedPath = req.file.path + '_temp_converted.wav';

            await convertToWav(req.file.path, tempConvertedPath);

            // Set path pengiriman ke file hasil konversi
            fileToSendPath = tempConvertedPath;
            isConverted = true;
            console.log(`[Convert] Berhasil dikonversi ke: ${fileToSendPath}`);
        }

        // 4. Persiapkan FormData untuk API AI
        const form = new FormData();
        form.append('user_id', user_id);
        form.append('language', targetLanguage);
        form.append('transcript', targetTranscript);
        form.append('session_id', finalSessionId);

        // Penting: Kirim file dari path yang sudah ditentukan (asli atau hasil convert)
        form.append('audio_file', fs.createReadStream(fileToSendPath));

        console.log(`[AI Hit] Mengirim ke ${AI_SERVICE_URL}...`);

        // 5. Hit API AI
        const aiResponse = await axios.post(AI_SERVICE_URL, form, {
            headers: {
                ...form.getHeaders(),
            },
            timeout: 45000, // Tambah timeout karena ada proses konversi + AI
        });

        const aiResult = aiResponse.data;

        // 6. Simpan Hasil ke Database
        // Catatan: Kita tetap menyimpan referensi ke file ASLI yang diupload user (bukan yang temp wav)
        // agar format aslinya terjaga di storage kita (misal user upload m4a dari iPhone).
        const submission = await PronunciationSubmission.create({
            user_id: user_id,
            lesson_vocab_id: lesson_vocab_id,
            user_audio_url: req.file.filename, // Simpan nama file asli di DB

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

            phoneme_errors_json: aiResult.phoneme_errors_json,
            personalized_feedback: aiResult.personalized_feedback,
            cefr_level_assessment:
                aiResult.cefr_level_assessment || aiResult.cefr_level,
        });

        // 7. Kirim Response ke Frontend
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
    } finally {
        // 8. CLEANUP (PENTING!)
        // Hapus file WAV sementara hasil konversi agar server tidak penuh
        if (
            isConverted &&
            tempConvertedPath &&
            fs.existsSync(tempConvertedPath)
        ) {
            try {
                fs.unlinkSync(tempConvertedPath);
                console.log('[Cleanup] File sementara WAV dihapus.');
            } catch (err) {
                console.error(
                    '[Cleanup Error] Gagal menghapus file temp:',
                    err
                );
            }
        }
        // File asli (req.file.path) TIDAK dihapus karena disimpan untuk history user
    }
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
                    attributes: ['phrase', 'translation', 'target_audio_url'],
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
