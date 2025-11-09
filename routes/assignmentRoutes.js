const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

// Manager creates assignment proposal
router.post('/', authenticateToken, assignmentController.createAssignment);

// Get assignment
router.get('/:id', authenticateToken, assignmentController.getAssignment);

// Assignee accepts
router.post('/:id/accept', authenticateToken, assignmentController.acceptAssignment);

// Assignee declines
router.post('/:id/decline', authenticateToken, assignmentController.declineAssignment);

module.exports = router;
