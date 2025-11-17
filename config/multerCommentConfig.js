const multer = require('multer');

// Sử dụng memoryStorage để lưu file trong memory buffer (cho base64 encoding)
const storage = multer.memoryStorage();

// File filter - cho phép nhiều loại file
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Loại file không được hỗ trợ'), false);
    }
};

// Cấu hình upload cho comments - giới hạn 1MB per file
const commentUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB per file
        files: 10 // Maximum 10 files per comment
    }
});

module.exports = commentUpload;
