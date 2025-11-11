const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            // Lấy role manager
            const roles = await queryInterface.sequelize.query(
                "SELECT id FROM Roles WHERE name = 'manager'",
                { type: QueryTypes.SELECT }
            );

            if (!roles.length) {
                console.log('⚠️ Manager role not found');
                return;
            }

            const managerId = roles[0].id;

            // Danh sách permissions cho manager
            // Manager có hầu hết quyền như admin, ngoại trừ:
            // - users:delete (không được xóa người dùng)
            // - roles:* (không quản lý roles)
            // - permissions:read (không quản lý permissions)
            const managerPermissionNames = [
                // Người dùng (không có delete)
                'users:read',
                'users:create',
                'users:update',
                // Dự án (đầy đủ)
                'projects:read',
                'projects:create',
                'projects:update',
                'projects:delete',
                // Công việc (đầy đủ)
                'tasks:read',
                'tasks:create',
                'tasks:update',
                'tasks:delete',
                // Nhóm (đầy đủ)
                'groups:read',
                'groups:create',
                'groups:update',
                'groups:delete',
                // Báo cáo
                'reports:read'
            ];

            // Lấy permission IDs
            const permissions = await queryInterface.sequelize.query(
                `SELECT id FROM Permissions WHERE name IN (${managerPermissionNames.map(n => `'${n}'`).join(',')})`,
                { type: QueryTypes.SELECT }
            );

            if (!permissions.length) {
                console.log('⚠️ No permissions found');
                return;
            }

            console.log(`✅ Found ${permissions.length} permissions for manager`);

            const now = new Date();
            const rolePermissions = permissions.map(p => ({
                roleId: managerId,
                permissionId: p.id,
                createdAt: now,
                updatedAt: now
            }));

            // Xóa các permissions cũ của manager
            await queryInterface.bulkDelete('RolePermissions', { roleId: managerId });

            // Thêm permissions mới
            await queryInterface.bulkInsert('RolePermissions', rolePermissions);

            console.log(`✅ Assigned ${permissions.length} permissions to manager role`);
        } catch (error) {
            console.error('❌ Error assigning manager permissions:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const roles = await queryInterface.sequelize.query(
            "SELECT id FROM Roles WHERE name = 'manager'",
            { type: QueryTypes.SELECT }
        );

        if (!roles.length) return;

        await queryInterface.bulkDelete('RolePermissions', { roleId: roles[0].id });
        console.log('✅ Removed all manager permissions');
    }
};
