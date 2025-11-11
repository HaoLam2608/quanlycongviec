const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
    getMemberStats,
    getTodayTasks,
    getUpcomingTasks,
    getRecentActivities,
    getMemberTasks,
    getMemberProjects,
    updateMemberTaskStatus,
    updateMemberSubtaskStatus
} = require('../controllers/memberController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Debug endpoint - xem user info
router.get('/debug/me', (req, res) => {
    res.json({
        userId: req.user.id,
        manv: req.user.manv,
        hoten: req.user.hoten,
        chucvu: req.user.chucvu
    });
});

// Dashboard endpoints
router.get('/dashboard/stats', getMemberStats);
router.get('/tasks/today', getTodayTasks);
router.get('/tasks/upcoming', getUpcomingTasks);
router.get('/activities/recent', getRecentActivities);

// Task management endpoints
router.get('/tasks', getMemberTasks);

// Update task status (for members)
router.patch('/tasks/:taskId/status', updateMemberTaskStatus);

// Update subtask status (for members)
router.patch('/tasks/:taskId/subtasks/:subtaskId/status', updateMemberSubtaskStatus);

// Project endpoints
router.get('/projects', getMemberProjects);

module.exports = router;