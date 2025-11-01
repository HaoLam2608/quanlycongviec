const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();
        // Danh sách quyền mẫu cho hệ thống quản lý công việc
        const permissions = [
            // Quyền người dùng
            { name: 'users:read', resource: 'users', action: 'read', description: 'Xem danh sách người dùng', createdAt: now, updatedAt: now },
            { name: 'users:create', resource: 'users', action: 'create', description: 'Tạo người dùng mới', createdAt: now, updatedAt: now },
            { name: 'users:update', resource: 'users', action: 'update', description: 'Cập nhật người dùng', createdAt: now, updatedAt: now },
            { name: 'users:delete', resource: 'users', action: 'delete', description: 'Xóa người dùng', createdAt: now, updatedAt: now },
            // Quyền dự án
            { name: 'projects:read', resource: 'projects', action: 'read', description: 'Xem danh sách dự án', createdAt: now, updatedAt: now },
            { name: 'projects:create', resource: 'projects', action: 'create', description: 'Tạo dự án mới', createdAt: now, updatedAt: now },
            { name: 'projects:update', resource: 'projects', action: 'update', description: 'Cập nhật dự án', createdAt: now, updatedAt: now },
            { name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Xóa dự án', createdAt: now, updatedAt: now },
            // Quyền công việc
            { name: 'tasks:read', resource: 'tasks', action: 'read', description: 'Xem danh sách công việc', createdAt: now, updatedAt: now },
            { name: 'tasks:create', resource: 'tasks', action: 'create', description: 'Tạo công việc mới', createdAt: now, updatedAt: now },
            { name: 'tasks:update', resource: 'tasks', action: 'update', description: 'Cập nhật công việc', createdAt: now, updatedAt: now },
            { name: 'tasks:delete', resource: 'tasks', action: 'delete', description: 'Xóa công việc', createdAt: now, updatedAt: now },
            // Quyền nhóm
            { name: 'groups:read', resource: 'groups', action: 'read', description: 'Xem danh sách nhóm', createdAt: now, updatedAt: now },
            { name: 'groups:create', resource: 'groups', action: 'create', description: 'Tạo nhóm mới', createdAt: now, updatedAt: now },
            { name: 'groups:update', resource: 'groups', action: 'update', description: 'Cập nhật nhóm', createdAt: now, updatedAt: now },
            { name: 'groups:delete', resource: 'groups', action: 'delete', description: 'Xóa nhóm', createdAt: now, updatedAt: now },
            // Quyền vai trò
            { name: 'roles:read', resource: 'roles', action: 'read', description: 'Xem danh sách vai trò', createdAt: now, updatedAt: now },
            { name: 'roles:create', resource: 'roles', action: 'create', description: 'Tạo vai trò mới', createdAt: now, updatedAt: now },
            { name: 'roles:update', resource: 'roles', action: 'update', description: 'Cập nhật vai trò', createdAt: now, updatedAt: now },
            { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Xóa vai trò', createdAt: now, updatedAt: now },
            // Quyền permission
            { name: 'permissions:read', resource: 'permissions', action: 'read', description: 'Xem danh sách quyền', createdAt: now, updatedAt: now },
            // Quyền báo cáo
            { name: 'reports:read', resource: 'reports', action: 'read', description: 'Xem báo cáo', createdAt: now, updatedAt: now }
        ];
        // Xóa các quyền cũ có dấu _ trong name
        await queryInterface.bulkDelete('Permissions', { name: { [Sequelize.Op.like]: '%\_%' } }, {});
        await queryInterface.bulkInsert('Permissions', permissions);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Permissions', null, {});
    }
};
