const authenticateToken = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/rbac');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Routes cho user management
router.get("/", authenticateToken, userController.getAllUsers);
router.get("/stats", authenticateToken, checkPermission('users', 'read'), userController.getDashboardStats);
router.get("/:id", authenticateToken, checkPermission('users', 'read'), userController.getUserById);
router.post("/", authenticateToken, checkPermission('users', 'create'), userController.createUser);
router.put("/:id", authenticateToken, checkPermission('users', 'update'), userController.updateUser);
router.delete("/:id", authenticateToken, checkPermission('users', 'delete'), userController.deleteUser);

module.exports = router;