const { User } = require('../../models');
const bcrypt = require('bcrypt');
const ms = require('ms');
const {
    generateAccessToken,
    generateRefreshToken,
} = require('../../utils/tokenGenerator.js');

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ message: 'Email dan password wajib ada' });
    }

    try {
        const userFound = await User.findOne({
            where: { email },
        });
        if (!userFound) {
            return res
                .status(401)
                .json({ message: 'Email atau password salah' });
        }
        const isPasswordMatch = await bcrypt.compare(
            password,
            userFound.password_hash
        );
        if (!isPasswordMatch) {
            return res
                .status(401)
                .json({ message: 'Email atau password salah' });
        }

        const accessToken = generateAccessToken({
            user_id: userFound.id,
        });
        const refreshToken = generateRefreshToken({
            user_id: userFound.id,
        });

        await userFound.update({ refresh_token: refreshToken });

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            maxAge: ms(process.env.REFRESH_TOKEN_EXP || '1d'),
            sameSite: 'Lax',
            secure: false,
        });
        return res.status(200).json({
            message: 'Login berhasil',
            accessToken,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat login pada server',
            errMsg: error.message,
        });
    }
};

module.exports = handleLogin;
