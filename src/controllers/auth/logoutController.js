const { User } = require('../../models');
const ms = require('ms');

const handleLogout = async (req, res) => {
    const refreshToken = req.cookies?.jwt;
    if (!refreshToken) {
        return res
            .status(200)
            .json({ message: 'Tidak ada token pada cookie, sudah logout' });
    }

    try {
        const userFound = await User.findOne({
            where: { refresh_token: refreshToken },
        });
        if (!userFound) {
            res.clearCookie('jwt', {
                httpOnly: true,
                maxAge: ms(process.env.REFRESH_TOKEN_EXP || '1d'),
                sameSite: 'Lax',
                secure: false,
            });
            return res.status(200).json({
                message: 'User tidak ditemukan, cookie sudah dibersihkan',
            });
        }

        await userFound.update({ refresh_token: null });
        res.clearCookie('jwt', refreshToken, {
            httpOnly: true,
            maxAge: ms(process.env.REFRESH_TOKEN_EXP || '1d'),
            sameSite: 'Lax',
            secure: false,
        });
        return res.status(200).json({ message: 'Logout berhasil' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Terjadi kesalahan saat mencoba logout',
            errMsg: error.message,
        });
    }
};

module.exports = handleLogout;
