const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const commentController = require('../controllers/commentController');
const commentUpload = require('../config/multerCommentConfig');

// Create a comment on a task or subtask (author is the authenticated user)
// Body: { taskId?: number, subtaskId?: number, content: string, mentions?: string (JSON array of userIds) }
// Files: images (optional), files (optional)
router.post('/', authenticateToken, commentUpload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'files', maxCount: 5 }
]), commentController.createComment);

// Update a comment (only author can update)
// Body: { content?: string }
// Files: attachments (optional, will be added to existing attachments)
router.put('/:id', authenticateToken, commentUpload.array('attachments', 5), commentController.updateComment);

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
