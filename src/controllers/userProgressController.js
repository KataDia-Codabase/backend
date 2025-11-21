const { UserLessonProgress, Lesson, User } = require('../models');

/**
 * @desc    Menyimpan/Update Progress Lesson (Saat user selesai quiz)
 * @route   POST /api/progress
 * @access  Private (User)
 */
const submitLessonProgress = async (req, res) => {
    const { user_id, lesson_id, score } = req.body;

    if (!user_id || !lesson_id || score === undefined) {
        return res
            .status(400)
            .json({ message: 'user_id, lesson_id, dan score wajib diisi.' });
    }

    try {
        // Cek user dan lesson valid
        const user = await User.findByPk(user_id);
        const lesson = await Lesson.findByPk(lesson_id);

        if (!user || !lesson) {
            return res
                .status(404)
                .json({ message: 'User atau Lesson tidak ditemukan.' });
        }

        // Cek apakah sudah pernah mengerjakan?
        let progress = await UserLessonProgress.findOne({
            where: { user_id, lesson_id },
        });

        if (progress) {
            // Update jika skor baru lebih tinggi atau sekadar mencatat status terakhir
            // Logic: Selalu update status completed, dan ambil max score
            const newScore = parseFloat(score);
            const oldScore = parseFloat(progress.score || 0);

            progress.score = newScore > oldScore ? newScore : oldScore;
            progress.status = 'completed';
            progress.completed_at = new Date(); // Update waktu pengerjaan terakhir
            await progress.save();

            return res.status(200).json({
                message: 'Progress diperbarui.',
                data: progress,
            });
        } else {
            // Buat progress baru
            progress = await UserLessonProgress.create({
                user_id,
                lesson_id,
                score,
                status: 'completed',
                completed_at: new Date(),
            });

            // TODO: Tambah XP User di sini jika diperlukan
            // user.xp_points += 10;
            // await user.save();

            return res.status(201).json({
                message: 'Lesson selesai! Progress tersimpan.',
                data: progress,
            });
        }
    } catch (error) {
        console.error('Error submitLessonProgress:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Mendapatkan Progress User (Dashboard)
 * @route   GET /api/progress/:user_id
 */
const getUserProgress = async (req, res) => {
    try {
        const { user_id } = req.params;

        const progress = await UserLessonProgress.findAll({
            where: { user_id },
            include: [
                {
                    model: Lesson,
                    as: 'lesson', // Harus sesuai alias di models/index.js
                    attributes: ['id', 'title', 'lesson_type', 'cefr_level'],
                },
            ],
        });

        res.status(200).json({
            message: 'Data progress user berhasil diambil.',
            data: progress,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    submitLessonProgress,
    getUserProgress,
};
