const authenticateToken = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/rbac');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Routes cho user management
router.get("/", authenticateToken, userController.getAllUsers);
router.get("/stats", authenticateToken, checkPermission('users', 'read'), userController.getDashboardStats);
// Serve avatar for current user and by id (must be before '/:id' route to avoid conflicts)
router.get('/avatar', authenticateToken, userController.getMyAvatar);
router.get('/:id/avatar', userController.getAvatarById);

router.put('/me', authenticateToken, userController.updateMyProfile);
router.get("/:id", authenticateToken, checkPermission('users', 'read'), userController.getUserById);
router.post("/", authenticateToken, checkPermission('users', 'create'), userController.createUser);
router.put("/:id", authenticateToken, checkPermission('users', 'update'), userController.updateUser);
router.delete("/:id", authenticateToken, checkPermission('users', 'delete'), userController.deleteUser);
// Upload avatar for current user

// Upload avatar for current user
router.post('/avatar', authenticateToken, (req, res, next) => {
    if (!req.upload) return res.status(500).json({ message: 'Upload middleware not configured' });
    req.upload.single('avatar')(req, res, (err) => {
        if (err) return res.status(500).json({ message: err.message });
        next();
    });
}, userController.uploadAvatar);

// Admin upload avatar for any user
router.post('/:id/avatar', authenticateToken, checkRole('admin'), (req, res, next) => {
    if (!req.upload) return res.status(500).json({ message: 'Upload middleware not configured' });
    req.upload.single('avatar')(req, res, (err) => {
        if (err) return res.status(500).json({ message: err.message });
        next();
    });
}, userController.adminUploadAvatar);

// Remove current user's avatar
router.delete('/avatar', authenticateToken, userController.deleteAvatar);

// Update current user's profile (no extra permission required)

module.exports = router;