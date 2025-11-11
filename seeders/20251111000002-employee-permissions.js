const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            // Lấy role employee
            const roles = await queryInterface.sequelize.query(
                "SELECT id FROM Roles WHERE name = 'employee'",
                { type: QueryTypes.SELECT }
            );

            if (!roles.length) {
                console.log('⚠️ Employee role not found');
                return;
            }

            const employeeId = roles[0].id;

            // Danh sách permissions cho employee (chỉ read)
            const employeePermissionNames = [
                'users:read',        // Xem danh sách đồng nghiệp
                'projects:read',     // Xem dự án được tham gia
                'tasks:read',        // Xem công việc của mình
                'tasks:update',      // Cập nhật trạng thái công việc của mình
                'groups:read',       // Xem nhóm
                'reports:read'       // Xem báo cáo
            ];

            // Lấy permission IDs
            const permissions = await queryInterface.sequelize.query(
                `SELECT id FROM Permissions WHERE name IN (${employeePermissionNames.map(n => `'${n}'`).join(',')})`,
                { type: QueryTypes.SELECT }
            );

            if (!permissions.length) {
                console.log('⚠️ No permissions found');
                return;
            }

            console.log(`✅ Found ${permissions.length} permissions for employee`);

            const now = new Date();
            const rolePermissions = permissions.map(p => ({
                roleId: employeeId,
                permissionId: p.id,
                createdAt: now,
                updatedAt: now
            }));

            // Xóa các permissions cũ của employee
            await queryInterface.bulkDelete('RolePermissions', { roleId: employeeId });

            // Thêm permissions mới
            await queryInterface.bulkInsert('RolePermissions', rolePermissions);

            console.log(`✅ Assigned ${permissions.length} permissions to employee role`);
        } catch (error) {
            console.error('❌ Error assigning employee permissions:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const roles = await queryInterface.sequelize.query(
            "SELECT id FROM Roles WHERE name = 'employee'",
            { type: QueryTypes.SELECT }
        );

        if (!roles.length) return;

        await queryInterface.bulkDelete('RolePermissions', { roleId: roles[0].id });
        console.log('✅ Removed all employee permissions');
    }
};
