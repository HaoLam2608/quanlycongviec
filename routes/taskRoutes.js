const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const subtaskController = require('../controllers/subtaskController');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// ============ TASK ROUTES ============

// Lấy tasks của một dự án
router.get('/project/:projectId', 
    authenticateToken, 
    checkPermission('projects', 'read'),
    taskController.getTasksByProject
);

// Lấy tasks của tôi (user hiện tại)
router.get('/my-tasks', 
    authenticateToken,
    taskController.getMyTasks
);

// Lấy chi tiết một task
router.get('/:id', 
    authenticateToken,
    checkPermission('tasks', 'read'),
    taskController.getTaskById
);

// Tạo task mới
router.post('/', 
    authenticateToken,
    checkPermission('tasks', 'create'),
    taskController.createTask
);

// Cập nhật task
router.put('/:id', 
    authenticateToken,
    checkPermission('tasks', 'update'),
    taskController.updateTask
);

// Xóa task
router.delete('/:id', 
    authenticateToken,
    checkPermission('tasks', 'delete'),
    taskController.deleteTask
);

// ============ SUBTASK ROUTES ============

// Lấy subtasks của một task
router.get('/:taskId/subtasks', 
    authenticateToken,
    checkPermission('tasks', 'read'),
    subtaskController.getSubtasksByTask
);

// Tạo subtask mới
router.post('/:taskId/subtasks', 
    authenticateToken,
    checkPermission('tasks', 'create'),
    subtaskController.createSubtask
);

// Cập nhật subtask
router.put('/:taskId/subtasks/:id', 
    authenticateToken,
    checkPermission('tasks', 'update'),
    subtaskController.updateSubtask
);

// Xóa subtask
router.delete('/:taskId/subtasks/:id', 
    authenticateToken,
    checkPermission('tasks', 'delete'),
    subtaskController.deleteSubtask
);

// Sắp xếp lại thứ tự subtasks
router.put('/:taskId/subtasks/reorder', 
    authenticateToken,
    checkPermission('tasks', 'update'),
    subtaskController.reorderSubtasks
);

module.exports = router;