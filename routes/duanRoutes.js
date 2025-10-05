const express = require('express');
const router = express.Router();
const duanController = require('../controllers/duanController');
const authenticateToken = require('../middleware/auth');

router.post('/create', authenticateToken, duanController.createDuAn);
router.get('/getAll', authenticateToken, duanController.getAllDuAn);

module.exports = router;
