const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

// Admin only - all backup routes require admin role

// Get backup settings
router.get('/settings',
    auth,
    checkRole('admin'),
    backupController.getBackupSettings
);

// Update backup settings
router.put('/settings',
    auth,
    checkRole('admin'),
    backupController.updateBackupSettings
);

// Trigger manual backup
router.post('/trigger',
    auth,
    checkRole('admin'),
    backupController.triggerBackup
);

// Get list of backups
router.get('/list',
    auth,
    checkRole('admin'),
    backupController.getBackupList
);

// Download backup file
router.get('/download/:fileName',
    auth,
    checkRole('admin'),
    backupController.downloadBackup
);

// Delete backup file
router.delete('/:fileName',
    auth,
    checkRole('admin'),
    backupController.deleteBackup
);

// Restore database from backup
router.post('/restore',
    auth,
    checkRole('admin'),
    backupController.restoreBackup
);

module.exports = router;
