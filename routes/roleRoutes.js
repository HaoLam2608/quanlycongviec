const authenticateToken = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/rbac');
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Routes cho role management
router.get("/", authenticateToken, roleController.getAllRoles);

// Routes cho permission management - PHẢI TRƯỚC /:id để Express không match :id = 'permissions'
router.get("/permissions", authenticateToken, checkPermission('roles', 'read'), roleController.getAllPermissions);
router.post("/permissions", authenticateToken, checkPermission('roles', 'create'), roleController.createPermission);

// Routes cho role management (tiếp)
router.get("/:id", authenticateToken, checkPermission('roles', 'read'), roleController.getRoleById);
router.post("/", authenticateToken, checkPermission('roles', 'create'), roleController.createRole);
router.put("/:id", authenticateToken, checkPermission('roles', 'update'), roleController.updateRole);
router.delete("/:id", authenticateToken, checkPermission('roles', 'delete'), roleController.deleteRole);

// Routes cho role permissions
router.get("/:roleId/permissions", authenticateToken, checkPermission('roles', 'read'), roleController.getRolePermissions);
router.put("/:roleId/permissions", authenticateToken, checkPermission('roles', 'update'), roleController.updateRolePermissions);

module.exports = router;