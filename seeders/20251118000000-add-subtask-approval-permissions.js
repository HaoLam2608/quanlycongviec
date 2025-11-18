const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        
        // Kiểm tra xem các permissions đã tồn tại chưa
        const existingPerms = await queryInterface.sequelize.query(
            "SELECT name FROM Permissions WHERE name IN ('subtasks:read', 'subtasks:create', 'subtasks:update', 'subtasks:delete', 'approvals:read', 'approvals:create', 'approvals:update')",
            { type: QueryTypes.SELECT }
        );

        const existingNames = existingPerms.map(p => p.name);

        const newPermissions = [
            // Subtask permissions
            { name: 'subtasks:read', resource: 'subtasks', action: 'read', description: 'Xem danh sách subtasks', createdAt: now, updatedAt: now },
            { name: 'subtasks:create', resource: 'subtasks', action: 'create', description: 'Tạo subtask mới', createdAt: now, updatedAt: now },
            { name: 'subtasks:update', resource: 'subtasks', action: 'update', description: 'Cập nhật subtask', createdAt: now, updatedAt: now },
            { name: 'subtasks:delete', resource: 'subtasks', action: 'delete', description: 'Xóa subtask', createdAt: now, updatedAt: now },
            // Approval permissions
            { name: 'approvals:read', resource: 'approvals', action: 'read', description: 'Xem danh sách phê duyệt', createdAt: now, updatedAt: now },
            { name: 'approvals:create', resource: 'approvals', action: 'create', description: 'Phê duyệt công việc', createdAt: now, updatedAt: now },
            { name: 'approvals:update', resource: 'approvals', action: 'update', description: 'Cập nhật phê duyệt', createdAt: now, updatedAt: now }
        ].filter(p => !existingNames.includes(p.name));

        if (newPermissions.length > 0) {
            await queryInterface.bulkInsert('Permissions', newPermissions);
            console.log(`✅ Added ${newPermissions.length} new permissions`);
        } else {
            console.log('ℹ️  All permissions already exist');
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Permissions', {
            name: {
                [Sequelize.Op.in]: [
                    'subtasks:read',
                    'subtasks:create',
                    'subtasks:update',
                    'subtasks:delete',
                    'approvals:read',
                    'approvals:create',
                    'approvals:update'
                ]
            }
        });
    }
};
