const express = require('express');
const router = express.Router();
const duanController = require('../controllers/duanController');
const authenticateToken = require('../middleware/auth');

router.post('/create', authenticateToken, duanController.createDuAn);
router.get('/getAll', authenticateToken, duanController.getAllDuAn);
router.get("/getById/:id", authenticateToken, duanController.getDuAnById);  // 👈 lấy chi tiết
router.put('/update/:id', authenticateToken, duanController.updateDuAn);   // 👈 sửa
router.delete('/delete/:id', authenticateToken, duanController.deleteDuAn); // 👈 xoá

module.exports = router;
