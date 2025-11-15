const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Tentukan lokasi penyimpanan
const audioStoragePath = path.join(__dirname, '../../public/uploads/audio');

// 2. Buat direktori jika belum ada
// Ini penting agar 'destination' tidak gagal
if (!fs.existsSync(audioStoragePath)) {
    fs.mkdirSync(audioStoragePath, { recursive: true });
}

// 3. Konfigurasi Multer Disk Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Tentukan folder penyimpanan
        cb(null, audioStoragePath);
    },
    filename: (req, file, cb) => {
        // Buat nama file unik untuk menghindari konflik
        // Format: vocab-audio-[timestamp]-[nama-asli-file]
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // Menangani nama file dengan karakter non-ASCII
        const originalName = Buffer.from(file.originalname, 'latin1').toString(
            'utf8'
        );
        const newFilename =
            'vocab-audio-' + uniqueSuffix + path.extname(originalName);
        cb(null, newFilename);
    },
});

// 4. Filter File (Hanya terima audio)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
        // Terima file
        cb(null, true);
    } else {
        // Tolak file
        cb(new Error('Upload gagal. Hanya file audio yang diizinkan!'), false);
    }
};

// 5. Inisialisasi Multer
const uploadAudio = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Batas ukuran file 10MB
    },
});

// 6. Ekspor sebagai middleware untuk satu file
// 'audio_url' adalah nama field 'name' di form <input type="file" name="audio_url">
// Frontend harus mengirim file dengan key ini.
module.exports = uploadAudio.single('audio_url');
