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

module.exports = router;
