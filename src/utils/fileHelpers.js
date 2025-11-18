const fs = require('fs');
const path = require('path');

/**
 * Menghapus file dari sistem file
 * @param {string} folderPath - Nama folder di dalam /uploads (contoh: 'products')
 * @param {string} filename - Nama file yang akan dihapus
 */
const deleteFile = (folderPath, filename) => {
    if (!filename) return;

    const filePath = path.join(
        __dirname,
        '../..',
        'public',
        folderPath,
        filename
    );
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`File ${filename} berhasil dihapus dari ${folderPath}`);
        } catch (err) {
            console.error(`Gagal menghapus file: ${err.message}`);
        }
    }
};

module.exports = deleteFile;
