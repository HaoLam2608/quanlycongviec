const authenticateToken = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/rbac');
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Routes cho role management
router.get("/", authenticateToken, checkPermission('roles', 'read'), roleController.getAllRoles);
router.post("/", authenticateToken, checkPermission('roles', 'create'), roleController.createRole);
router.put("/:id", authenticateToken, checkPermission('roles', 'update'), roleController.updateRole);
router.delete("/:id", authenticateToken, checkPermission('roles', 'delete'), roleController.deleteRole);

// Routes cho permission management
router.get("/permissions", authenticateToken, checkPermission('roles', 'read'), roleController.getAllPermissions);
router.get("/:roleId/permissions", authenticateToken, checkPermission('roles', 'read'), roleController.getRolePermissions);
router.put("/:roleId/permissions", authenticateToken, checkPermission('roles', 'update'), roleController.updateRolePermissions);

module.exports = router;