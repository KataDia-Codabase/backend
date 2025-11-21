const { CefrTest, CefrQuestion } = require('../models');

/**
 * @desc    Buat Header Ujian Baru
 * @route   POST /api/cefr-tests
 * @access  Private (Admin)
 * @body    { "title": "Ujian A1", "target_level": "A1", "passing_score": 70 }
 */
const createTest = async (req, res) => {
    const { title, target_level, passing_score } = req.body;

    if (!title || !target_level) {
        return res
            .status(400)
            .json({ message: 'Title dan target_level wajib diisi.' });
    }

    try {
        const newTest = await CefrTest.create({
            title,
            target_level, // ENUM: 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
            passing_score: passing_score || 70.0,
        });

        res.status(201).json({
            message: 'Paket Ujian berhasil dibuat.',
            data: newTest,
            // ^^^ DI SINI ANDA DAPAT 'id' (cefr_test_id) UNTUK BIKIN SOAL NANTI
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Ambil Semua Paket Ujian
 * @route   GET /api/cefr-tests
 */
const getAllTests = async (req, res) => {
    try {
        const tests = await CefrTest.findAll({
            order: [['target_level', 'ASC']],
        });

        res.status(200).json({
            message: 'Data ujian berhasil diambil.',
            data: tests,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Ambil Detail Ujian (Termasuk Preview Soal di dalamnya)
 * @route   GET /api/cefr-tests/:id
 */
const getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await CefrTest.findByPk(id, {
            include: [
                {
                    model: CefrQuestion,
                    as: 'questions',
                    attributes: ['id', 'section_type', 'order_index'], // Preview saja
                },
            ],
        });

        if (!test)
            return res.status(404).json({ message: 'Ujian tidak ditemukan.' });

        res.status(200).json({
            message: 'Detail ujian berhasil diambil.',
            data: test,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Update Info Ujian
 * @route   PUT /api/cefr-tests/:id
 */
const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, target_level, passing_score } = req.body;

        const test = await CefrTest.findByPk(id);
        if (!test)
            return res.status(404).json({ message: 'Ujian tidak ditemukan.' });

        test.title = title || test.title;
        test.target_level = target_level || test.target_level;
        test.passing_score = passing_score || test.passing_score;

        await test.save();

        res.status(200).json({
            message: 'Ujian berhasil diupdate.',
            data: test,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Hapus Paket Ujian (Hati-hati: Menghapus semua soal di dalamnya!)
 * @route   DELETE /api/cefr-tests/:id
 */
const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await CefrTest.findByPk(id);
        if (!test)
            return res.status(404).json({ message: 'Ujian tidak ditemukan.' });

        await test.destroy(); // Cascade delete akan menghapus questions terkait

        res.status(200).json({ message: 'Ujian berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createTest,
    getAllTests,
    getTestById,
    updateTest,
    deleteTest,
};
