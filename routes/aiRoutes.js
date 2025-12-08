const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authenticateToken = require('../middleware/auth');

// All AI routes require authentication
router.use(authenticateToken);

// Ask AI endpoint
router.post('/ask', aiController.askAI);

// Chat history
router.get('/history', aiController.getChatHistory);

// Feedback
router.post('/feedback', aiController.rateAnswer);

module.exports = router;
