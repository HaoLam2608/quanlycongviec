const { Role, Permission, RolePermission, User } = require('../models');
const { Op } = require('sequelize');

// Lấy tất cả roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            include: [
                {
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                },
                {
                    model: User,
                    as: 'users',
                    attributes: ['id']
                }
            ]
        });

        // Đếm số user cho mỗi role
        const rolesWithCount = roles.map(role => ({
            ...role.toJSON(),
            userCount: role.users.length,
            users: undefined // Remove users array, chỉ giữ count
        }));

        res.json({ roles: rolesWithCount });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Tạo role mới
exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions = [] } = req.body;

        // Kiểm tra role đã tồn tại
        const existingRole = await Role.findOne({ where: { name } });
        if (existingRole) {
            return res.status(400).json({ message: 'Tên vai trò đã tồn tại' });
        }

        // Tạo role
        const role = await Role.create({ name, description });

        // Gán permissions cho role
        if (permissions.length > 0) {
            const permissionRecords = await Permission.findAll({
                where: { id: permissions }
            });

            await role.addPermissions(permissionRecords);
        }

        // Lấy role với permissions
        const roleWithPermissions = await Role.findByPk(role.id, {
            include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
        });

        res.status(201).json({
            message: 'Tạo vai trò thành công',
            role: roleWithPermissions
        });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cập nhật role
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions = [] } = req.body;

        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ message: 'Không tìm thấy vai trò' });
        }

        // Kiểm tra tên role trùng (nếu thay đổi)
        if (name && name !== role.name) {
            const existingRole = await Role.findOne({ where: { name } });
            if (existingRole) {
                return res.status(400).json({ message: 'Tên vai trò đã tồn tại' });
            }
        }

        // Cập nhật role
        await role.update({ name, description });

        // Cập nhật permissions
        await role.setPermissions([]);
        if (permissions.length > 0) {
            const permissionRecords = await Permission.findAll({
                where: { id: permissions }
            });
            await role.addPermissions(permissionRecords);
        }

        // Lấy role đã cập nhật
        const updatedRole = await Role.findByPk(id, {
            include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
        });

        res.json({
            message: 'Cập nhật vai trò thành công',
            role: updatedRole
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Xóa role
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ message: 'Không tìm thấy vai trò' });
        }

        // Kiểm tra có user nào đang sử dụng role này không
        const usersWithRole = await User.count({ where: { roleId: id } });
        if (usersWithRole > 0) {
            return res.status(400).json({ 
                message: `Không thể xóa vai trò này vì có ${usersWithRole} người dùng đang sử dụng` 
            });
        }

        // Xóa role permissions
        await RolePermission.destroy({ where: { roleId: id } });

        // Xóa role
        await role.destroy();

        res.json({ message: 'Xóa vai trò thành công' });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy tất cả permissions
exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            order: [['resource', 'ASC'], ['action', 'ASC']]
        });

        // Nhóm permissions theo resource
        const groupedPermissions = permissions.reduce((acc, permission) => {
            const resource = permission.resource;
            if (!acc[resource]) {
                acc[resource] = [];
            }
            acc[resource].push(permission);
            return acc;
        }, {});

        res.json({ 
            permissions,
            groupedPermissions
        });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy permissions của một role
exports.getRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;

        const role = await Role.findByPk(roleId, {
            include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
        });

        if (!role) {
            return res.status(404).json({ message: 'Không tìm thấy vai trò' });
        }

        res.json({ 
            role,
            permissions: role.permissions 
        });
    } catch (error) {
        console.error('Get role permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cập nhật permissions cho role
exports.updateRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissions = [] } = req.body;

        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(404).json({ message: 'Không tìm thấy vai trò' });
        }

        // Xóa tất cả permissions cũ
        await RolePermission.destroy({ where: { roleId } });

        // Thêm permissions mới
        if (permissions.length > 0) {
            const rolePermissions = permissions.map(permissionId => ({
                roleId,
                permissionId
            }));

            await RolePermission.bulkCreate(rolePermissions);
        }

        // Lấy role với permissions mới
        const updatedRole = await Role.findByPk(roleId, {
            include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }]
        });

        res.json({
            message: 'Cập nhật quyền thành công',
            role: updatedRole
        });
    } catch (error) {
        console.error('Update role permissions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};