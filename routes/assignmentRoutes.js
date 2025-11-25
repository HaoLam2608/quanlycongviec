const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

// Get pending task assignments for current user (teamlead)
router.get('/my-pending-tasks', authenticateToken, assignmentController.getPendingTaskAssignments);

// Get unassigned tasks that teamlead can request to claim
router.get('/unassigned/available', authenticateToken, assignmentController.getUnassignedTasks);

// Manager: Get all claim requests they received
router.get('/claim-requests/my', authenticateToken, assignmentController.getClaimRequests);

// Admin: Get ALL claim requests across the system
router.get('/claim-requests/all', authenticateToken, assignmentController.getAllClaimRequests);

// Manager/Admin: Approve a claim request
router.post('/claim-requests/approve', authenticateToken, assignmentController.approveClaimRequest);

// Manager/Admin: Reject a claim request
router.post('/claim-requests/reject', authenticateToken, assignmentController.rejectClaimRequest);

// Teamlead requests to claim an unassigned task (creates pending assignment)
router.post('/claim-request', authenticateToken, assignmentController.requestToClaimTask);

// Manager creates assignment proposal
router.post('/', authenticateToken, assignmentController.createAssignment);

// Member requests to join a task/subtask
router.post('/request', authenticateToken, assignmentController.requestToJoin);

// Get join requests for current user (teamlead/manager/admin)
router.get('/requests/join', authenticateToken, assignmentController.getMyJoinRequests);

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
