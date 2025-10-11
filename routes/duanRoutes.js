const express = require('express');
const router = express.Router();
const duanController = require('../controllers/duanController');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.post('/create', authenticateToken, checkPermission('projects', 'create'), duanController.createDuAn);
router.get('/getAll', authenticateToken, checkPermission('projects', 'read'), duanController.getAllDuAn);
router.get("/getById/:id", authenticateToken, checkPermission('projects', 'read'), duanController.getDuAnById);  // 👈 lấy chi tiết
router.put('/update/:id', authenticateToken, checkPermission('projects', 'update'), duanController.updateDuAn);   // 👈 sửa
router.delete('/delete/:id', authenticateToken, checkPermission('projects', 'delete'), duanController.deleteDuAn); // 👈 xoá

module.exports = router;
