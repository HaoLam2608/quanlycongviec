const express = require('express');
const router = express.Router();
const WorklogController = require('../controllers/worklogController');
const authenticateToken = require('../middleware/auth');

// Lấy worklogs của tôi
router.get('/my-worklogs',
    authenticateToken,
    WorklogController.getMyWorklogs
);

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

// Cập nhật worklog
router.put('/:id',
    authenticateToken,
    WorklogController.update
);

// Xóa worklog
router.delete('/:id',
    authenticateToken,
    WorklogController.destroy
);

module.exports = router;