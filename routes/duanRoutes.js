const express = require('express');
const router = express.Router();
const duanController = require('../controllers/duanController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create', authMiddleware, duanController.createDuAn);
router.get('/getAll', authMiddleware, duanController.getAllDuAn);

module.exports = router;
