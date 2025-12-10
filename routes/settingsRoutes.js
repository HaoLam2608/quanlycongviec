const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authenticateToken = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// Read settings
router.get('/', authenticateToken, checkPermission('settings', 'read'), settingsController.getSettings);
// Update settings
router.put('/', authenticateToken, checkPermission('settings', 'update'), settingsController.updateSettings);
// Test notification (email or system)
router.post('/notify-test', authenticateToken, checkPermission('settings', 'update'), settingsController.sendTestNotification);

// Deadline reminder settings
router.get('/deadline-reminder', authenticateToken, checkPermission('settings', 'read'), settingsController.getDeadlineSettings);
router.put('/deadline-reminder', authenticateToken, checkPermission('settings', 'update'), settingsController.updateDeadlineSettings);
router.post('/deadline-reminder/run-now', authenticateToken, checkPermission('settings', 'update'), settingsController.runDeadlineCheck);

module.exports = router;
