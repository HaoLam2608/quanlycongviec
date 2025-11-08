const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads/reports');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique: timestamp-randomnumber-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, uniqueSuffix + '-' + nameWithoutExt + ext);
    }
});

// File filter - chỉ cho phép các file document
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, Word, Excel, PowerPoint, hình ảnh và text.'), false);
    }
};

// Cấu hình upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

module.exports = upload;
