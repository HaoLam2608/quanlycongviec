
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const groupController = require('../controllers/groupController');

// Đóng nhóm
router.patch('/:id/close', authenticateToken, checkPermission('groups', 'update'), groupController.closeGroup);

// Thêm nhóm vào dự án (group_projects)
router.post('/add-to-project', authenticateToken, checkPermission('groups', 'update'), groupController.addGroupToProject);

// Xóa nhóm khỏi dự án (group_projects)
router.post('/remove-from-project', authenticateToken, checkPermission('groups', 'update'), groupController.removeGroupFromProject);

// CRUD groups
router.get('/', authenticateToken, checkPermission('groups', 'read'), groupController.getGroups);
router.get('/:id', authenticateToken, checkPermission('groups', 'read'), groupController.getGroup);
router.post('/', authenticateToken, checkPermission('groups', 'create'), groupController.createGroup);
router.put('/:id', authenticateToken, checkPermission('groups', 'update'), groupController.updateGroup);
// Xóa nhóm (vĩnh viễn)
router.delete('/:id', authenticateToken, checkPermission('groups', 'delete'), groupController.deleteGroup);

// Members
router.post('/:id/members', authenticateToken, checkPermission('groups', 'update'), groupController.addMembers);
router.delete('/:id/members/:userId', authenticateToken, checkPermission('groups', 'update'), groupController.removeMember);

// Complete project
router.post('/complete-project', authenticateToken, checkPermission('groups', 'update'), groupController.completeProject);

module.exports = router;
