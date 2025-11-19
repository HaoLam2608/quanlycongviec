const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

// Manager creates assignment proposal
router.post('/', authenticateToken, assignmentController.createAssignment);

// Member requests to join a task/subtask
router.post('/request', authenticateToken, assignmentController.requestToJoin);

// List available tasks/subtasks that members can request from their teamlead
router.get('/available', authenticateToken, assignmentController.getAvailableForRequest);

// Manager accepts a request-to-join
router.post('/request/accept', authenticateToken, assignmentController.acceptRequestToJoin);

// Manager declines a request-to-join
router.post('/request/decline', authenticateToken, assignmentController.declineRequestToJoin);

// Get assignment
router.get('/:id', authenticateToken, assignmentController.getAssignment);

// Assignee accepts
router.post('/:id/accept', authenticateToken, assignmentController.acceptAssignment);

// Assignee declines
router.post('/:id/decline', authenticateToken, assignmentController.declineAssignment);

module.exports = router;
