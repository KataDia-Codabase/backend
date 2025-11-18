const { User } = require('../../models');
const bcrypt = require('bcrypt');

const handleRegister = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const duplicate = await User.findOne({
        where: { email },
    });
    if (duplicate)
        return res.status(409).json({ message: 'Email sudah terdaftar' });

    try {
        const hashedPwd = await bcrypt.hash(password, 10);
        const newUser = {
            email,
            password_hash: hashedPwd,
        };
        await User.create(newUser);
        return res.status(201).json({ message: 'User baru berhasil dibuat' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Terjadi kesalahan ketika menambah user',
            errMsg: error.message,
        });
    }
};

module.exports = handleRegister;
