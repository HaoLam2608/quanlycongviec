const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');

// Configure multer for avatar upload (memory storage for blob)
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// Public avatar endpoint (no auth required)
router.get('/conversations/:id/avatar', chatController.getGroupAvatar);

// All other chat routes require authentication
router.use(authenticateToken);

// Conversations
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.post('/conversations/direct', chatController.createDirectConversation);
router.post('/conversations/group', chatController.createGroupConversation);

// Group avatar
router.post('/conversations/:id/avatar', avatarUpload.single('avatar'), chatController.uploadGroupAvatar);

// Messages
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.post('/conversations/:id/upload', chatController.uploadAttachment);
router.post('/conversations/:id/read', chatController.markAsRead);

// Message actions
router.put('/messages/:messageId', chatController.updateMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);

// Group management
router.post('/conversations/:id/participants', chatController.addParticipants);
router.delete('/conversations/:id/participants/:userId', chatController.removeParticipant);

module.exports = router;
