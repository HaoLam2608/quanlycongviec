const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// Configure multer for comment attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/comments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'comment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, documents, and zip files are allowed.'));
    }
  }
});

// Create a comment on a task or subtask (author is the authenticated user)
// Body: { taskId?: number, subtaskId?: number, content: string }
// Files: attachments (optional, multiple files allowed)
router.post('/', authenticateToken, upload.array('attachments', 5), commentController.createComment);

// Update a comment (only author can update)
// Body: { content?: string }
// Files: attachments (optional, will be added to existing attachments)
router.put('/:id', authenticateToken, upload.array('attachments', 5), commentController.updateComment);

// Get mentionable users for a task/subtask
// Query: { taskId?: number, subtaskId?: number }
router.get('/mentionable-users', authenticateToken, commentController.getMentionableUsers);

// List comments for a task
router.get('/task/:id', commentController.listCommentsByTask);

// List comments for a subtask
router.get('/subtask/:id', commentController.listCommentsBySubtask);

// Delete a comment (only author can delete)
router.delete('/:id', authenticateToken, commentController.deleteComment);

module.exports = router;
