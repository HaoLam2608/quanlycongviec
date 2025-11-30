const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Get teamleader role
        const roles = await queryInterface.sequelize.query(
            "SELECT id, name FROM Roles WHERE name = 'teamleader'",
            { type: QueryTypes.SELECT }
        );

        if (!roles.length) {
            console.log('⚠️  Teamleader role not found, skipping permissions');
            return;
        }

        const teamleaderId = roles[0].id;

        // Get permissions that teamleader should have
        // Teamleader can manage their group, tasks, subtasks, approve worklogs, manage documents, view performance
        const permissionNames = [
            'groups:read',        // Xem nhóm
            'tasks:read',         // Xem tasks
            'tasks:create',       // Tạo tasks
            'tasks:update',       // Cập nhật tasks
            'subtasks:read',      // Xem subtasks
            'subtasks:create',    // Tạo subtasks
            'subtasks:update',    // Cập nhật subtasks
            'subtasks:delete',    // Xóa subtasks
            'projects:read',      // Xem projects
            'reports:read',       // Xem reports
            'approvals:read',     // Xem approvals
            'approvals:create',   // Tạo approvals (phê duyệt)
            'worklogs:read',      // Xem worklogs
            'worklogs:approve',   // Duyệt worklogs
            'documents:read',     // Xem tài liệu
            'documents:create',   // Tải lên tài liệu
            'documents:delete',   // Xóa tài liệu
            'members:read'        // Xem thông tin thành viên (cho performance)
        ];

        const permissions = await queryInterface.sequelize.query(
            `SELECT id, name FROM Permissions WHERE name IN (${permissionNames.map(n => `'${n}'`).join(',')})`,
            { type: QueryTypes.SELECT }
        );

        if (!permissions.length) {
            console.log('⚠️  No permissions found, skipping');
            return;
        }

        console.log(`✅ Found ${permissions.length} permissions for teamleader`);

        // Remove existing role-permission mappings for teamleader
        await queryInterface.sequelize.query(
            `DELETE FROM RolePermissions WHERE roleId = ${teamleaderId}`,
            { type: QueryTypes.DELETE }
        );

        const now = new Date();
        const rolePermissions = permissions.map(p => ({
            roleId: teamleaderId,
            permissionId: p.id,
            createdAt: now,
            updatedAt: now
        }));

        await queryInterface.bulkInsert('RolePermissions', rolePermissions);
        console.log(`✅ Assigned ${rolePermissions.length} permissions to teamleader role`);
    },

    async down(queryInterface, Sequelize) {
        const roles = await queryInterface.sequelize.query(
            "SELECT id FROM Roles WHERE name = 'teamleader'",
            { type: QueryTypes.SELECT }
        );

        if (!roles.length) return;

        const teamleaderId = roles[0].id;
        await queryInterface.sequelize.query(
            `DELETE FROM RolePermissions WHERE roleId = ${teamleaderId}`,
            { type: QueryTypes.DELETE }
        );
    }
};
