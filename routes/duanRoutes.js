const express = require('express');
const router = express.Router();
const duanController = require('../controllers/duanController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create', authMiddleware, duanController.createDuAn);
router.get('/getAll', authMiddleware, duanController.getAllDuAn);
router.get("/getById/:id", authMiddleware, duanController.getDuAnById);  // 👈 lấy chi tiết
router.put('/update/:id', authMiddleware, duanController.updateDuAn);   // 👈 sửa
router.delete('/delete/:id', authMiddleware, duanController.deleteDuAn); // 👈 xoá

module.exports = router;
