const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const {
    getPendingApprovals,
    approveTaskCompletion,
    rejectTaskCompletion,
    approveSubtaskCompletion,
    rejectSubtaskCompletion,
    getApprovedHistory,
    deleteHistory
} = require('../controllers/approvalController');

// All approval routes require authentication
router.use(authenticateToken);

// Middleware to check if user is admin, manager, or teamleader
const checkApprovalPermission = async (req, res, next) => {
    const { User, Role } = require('../models');
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Role, as: 'role' }]
        });
        
        if (!user || !user.role) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }
        
        const roleName = user.role.name;
        if (roleName !== 'admin' && roleName !== 'manager' && roleName !== 'teamleader') {
            return res.status(403).json({ message: 'Chỉ Admin, Manager hoặc Team Leader mới có quyền phê duyệt' });
        }
        
        req.user = user; // Update req.user with full user info
        next()
    } catch (error) {
        console.error('checkApprovalPermission error:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// Get pending approvals (admin, manager, and teamleader)
router.get('/pending', checkApprovalPermission, getPendingApprovals);

// Get approved history (admin, manager, and teamleader)
router.get('/history', checkApprovalPermission, getApprovedHistory);

// Delete history item
router.delete('/history', checkApprovalPermission, deleteHistory);

// Approve/reject task completion
router.post('/tasks/:taskId/approve', approveTaskCompletion);
router.post('/tasks/:taskId/reject', rejectTaskCompletion);

// Approve/reject subtask completion
router.post('/subtasks/:subtaskId/approve', approveSubtaskCompletion);
router.post('/subtasks/:subtaskId/reject', rejectSubtaskCompletion);

module.exports = router;
