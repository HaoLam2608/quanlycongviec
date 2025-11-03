const express = require('express');
const router = express.Router();
// const { authenticateToken } = require('../middleware/auth');
const {
    getMemberStats,
    getTodayTasks,
    getUpcomingTasks,
    getRecentActivities,
    getMemberTasks
} = require('../controllers/memberController');

// Apply authentication middleware to all routes (temporarily disabled)
// router.use(authenticateToken);

// Dashboard endpoints
router.get('/dashboard/stats', getMemberStats);
router.get('/tasks/today', getTodayTasks);
router.get('/tasks/upcoming', getUpcomingTasks);
router.get('/activities/recent', getRecentActivities);

// Task management endpoints
router.get('/tasks', getMemberTasks);

module.exports = router;