const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authenticateToken = require('../middleware/auth');

// Multer will be configured and used where routes are mounted (index.js)
router.post('/upload', authenticateToken, (req, res, next) => {
    if (!req.upload) return res.status(500).json({ message: 'Upload middleware not configured' });
    req.upload.single('file')(req, res, (err) => {
        if (err) return res.status(500).json({ message: err.message });
        next();
    });
}, documentController.uploadDocument);
router.get('/group-documents', authenticateToken, documentController.getGroupDocuments);
router.get('/list', authenticateToken, documentController.listDocuments);
router.get('/:id/download', authenticateToken, documentController.downloadDocument);
router.delete('/:id', authenticateToken, documentController.deleteDocument);

module.exports = router;
