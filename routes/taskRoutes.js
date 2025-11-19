const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const subtaskController = require('../controllers/subtaskController');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// ============ TASK ROUTES ============

// Quick ping (no auth) to verify router is mounted
router.get('/ping', (req, res) => {
    res.json({ ok: true, route: '/tasks/ping' });
});

// Lấy tasks theo Kanban view (grouped by status)
router.get('/project/:projectId/kanban',
    authenticateToken,
    checkPermission('projects', 'read'),
    taskController.getKanbanTasks
);

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

// Lấy tasks của nhóm (teamleader)
router.get('/group/tasks',
    authenticateToken,
    taskController.getGroupTasks
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

// Cập nhật trạng thái task (Kanban drag & drop)
const { allowOwnerOrPermission } = require('../middleware/rbac');
router.patch('/:id/status',
    authenticateToken,
    allowOwnerOrPermission('tasks', 'update'),
    taskController.updateTaskStatus
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
// NOTE: Specific paths MUST come before dynamic params like /:taskId

// Lấy subtasks của tôi (user hiện tại) với thông tin task và dự án
router.get('/subtasks/my-subtasks',
    authenticateToken,
    subtaskController.getMySubtasks
);

// Lấy subtasks của nhóm (for teamleader)
router.get('/subtasks/group-subtasks',
    authenticateToken,
    subtaskController.getGroupSubtasks
);

// Sắp xếp lại thứ tự subtasks - MUST be before /:taskId/subtasks/:id
router.put('/:taskId/subtasks/reorder',
    authenticateToken,
    allowOwnerOrPermission('tasks', 'update'),
    subtaskController.reorderSubtasks
);

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
    allowOwnerOrPermission('tasks', 'update'),
    subtaskController.updateSubtask
);

// Xóa subtask
router.delete('/:taskId/subtasks/:id',
    authenticateToken,
    allowOwnerOrPermission('tasks', 'delete'),
    subtaskController.deleteSubtask
);

module.exports = router;