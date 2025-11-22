const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/rbac');

// Admin routes - require admin permission
router.get('/admin/all',
    auth,
    checkRole('admin'),
    notificationController.getAllNotifications
);

router.post('/admin/create',
    auth,
    checkRole('admin'),
    notificationController.createNotification
);

router.put('/admin/:id',
    auth,
    checkRole('admin'),
    notificationController.updateNotification
);

router.post('/admin/:id/toggle-status',
    auth,
    checkRole('admin'),
    notificationController.toggleNotificationStatus
);

router.delete('/admin/:id',
    auth,
    checkRole('admin'),
    notificationController.deleteNotification
);

router.get('/admin/stats',
    auth,
    checkRole('admin'),
    notificationController.getNotificationStats
);// User routes - for all authenticated users
router.get('/user',
    auth,
    notificationController.getUserNotifications
);

router.post('/:id/mark-read',
    auth,
    notificationController.markAsRead
);

router.delete('/:id',
    auth,
    notificationController.deleteUserNotification
);

router.post('/mark-all-read',
    auth,
    notificationController.markAllAsRead
);

// Push notification routes
router.post('/register-device',
    auth,
    notificationController.registerDevice
);

router.post('/deactivate-device',
    auth,
    notificationController.deactivateDevice
);

router.post('/send-push',
    auth,
    checkRole('admin', 'manager'),
    notificationController.sendPushNotification
);

// Deadline reminder routes
router.post('/admin/trigger-deadline-check',
    auth,
    checkRole('admin'),
    notificationController.triggerDeadlineCheck
);

module.exports = router;