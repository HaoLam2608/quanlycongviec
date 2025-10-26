const express = require('express');
const router = express.Router();
const WorklogController = require('../controllers/worklogController');
const authenticateToken = require('../middleware/auth');

// Lấy worklogs (theo taskId hoặc subtaskId)
router.get('/',
    authenticateToken,
    WorklogController.getByTaskOrSubtask
);

// Tạo worklog mới
router.post('/',
    authenticateToken,
    WorklogController.create
);

module.exports = router;