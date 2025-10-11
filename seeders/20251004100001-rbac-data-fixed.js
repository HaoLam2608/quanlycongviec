'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tạo Roles
    await queryInterface.bulkInsert('Roles', [
      { id: 1, name: 'admin', description: 'Quản trị viên hệ thống - Có toàn quyền quản lý', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'manager', description: 'Quản lý dự án - Quản lý nhân sự và dự án', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'user', description: 'Nhân viên - Quyền truy cập cơ bản', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Tạo Permissions
    await queryInterface.bulkInsert('Permissions', [
      // Quyền quản lý người dùng
      { id: 1, name: 'users:read', resource: 'users', action: 'read', description: 'Xem danh sách người dùng', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'users:create', resource: 'users', action: 'create', description: 'Tạo người dùng mới', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'users:update', resource: 'users', action: 'update', description: 'Cập nhật thông tin người dùng', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'users:delete', resource: 'users', action: 'delete', description: 'Xóa người dùng', createdAt: new Date(), updatedAt: new Date() },
      
      // Quyền quản lý dự án
      { id: 5, name: 'projects:read', resource: 'projects', action: 'read', description: 'Xem danh sách dự án', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: 'projects:create', resource: 'projects', action: 'create', description: 'Tạo dự án mới', createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: 'projects:update', resource: 'projects', action: 'update', description: 'Cập nhật thông tin dự án', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Xóa dự án', createdAt: new Date(), updatedAt: new Date() },
      
      // Quyền quản lý vai trò
      { id: 9, name: 'roles:read', resource: 'roles', action: 'read', description: 'Xem danh sách vai trò', createdAt: new Date(), updatedAt: new Date() },
      { id: 10, name: 'roles:create', resource: 'roles', action: 'create', description: 'Tạo vai trò mới', createdAt: new Date(), updatedAt: new Date() },
      { id: 11, name: 'roles:update', resource: 'roles', action: 'update', description: 'Cập nhật vai trò', createdAt: new Date(), updatedAt: new Date() },
      { id: 12, name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Xóa vai trò', createdAt: new Date(), updatedAt: new Date() },
      
      // Quyền quản lý công việc
      { id: 13, name: 'tasks:read', resource: 'tasks', action: 'read', description: 'Xem danh sách công việc', createdAt: new Date(), updatedAt: new Date() },
      { id: 14, name: 'tasks:create', resource: 'tasks', action: 'create', description: 'Tạo công việc mới', createdAt: new Date(), updatedAt: new Date() },
      { id: 15, name: 'tasks:update', resource: 'tasks', action: 'update', description: 'Cập nhật công việc', createdAt: new Date(), updatedAt: new Date() },
      { id: 16, name: 'tasks:delete', resource: 'tasks', action: 'delete', description: 'Xóa công việc', createdAt: new Date(), updatedAt: new Date() },
      
      // Quyền quản lý nhóm
      { id: 17, name: 'groups:read', resource: 'groups', action: 'read', description: 'Xem danh sách nhóm', createdAt: new Date(), updatedAt: new Date() },
      { id: 18, name: 'groups:create', resource: 'groups', action: 'create', description: 'Tạo nhóm mới', createdAt: new Date(), updatedAt: new Date() },
      { id: 19, name: 'groups:update', resource: 'groups', action: 'update', description: 'Cập nhật nhóm', createdAt: new Date(), updatedAt: new Date() },
      { id: 20, name: 'groups:delete', resource: 'groups', action: 'delete', description: 'Xóa nhóm', createdAt: new Date(), updatedAt: new Date() },
      
      // Quyền báo cáo và thống kê
      { id: 21, name: 'reports:read', resource: 'reports', action: 'read', description: 'Xem báo cáo và thống kê', createdAt: new Date(), updatedAt: new Date() },
      { id: 22, name: 'dashboard:access', resource: 'dashboard', action: 'access', description: 'Truy cập bảng điều khiển', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Gán permissions cho roles
    // Admin - Toàn quyền (all permissions)
    await queryInterface.bulkInsert('RolePermissions', [
      // Admin có tất cả quyền (permission ID 1-22)
      { roleId: 1, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },   // users:read
      { roleId: 1, permissionId: 2, createdAt: new Date(), updatedAt: new Date() },   // users:create
      { roleId: 1, permissionId: 3, createdAt: new Date(), updatedAt: new Date() },   // users:update
      { roleId: 1, permissionId: 4, createdAt: new Date(), updatedAt: new Date() },   // users:delete
      { roleId: 1, permissionId: 5, createdAt: new Date(), updatedAt: new Date() },   // projects:read
      { roleId: 1, permissionId: 6, createdAt: new Date(), updatedAt: new Date() },   // projects:create
      { roleId: 1, permissionId: 7, createdAt: new Date(), updatedAt: new Date() },   // projects:update
      { roleId: 1, permissionId: 8, createdAt: new Date(), updatedAt: new Date() },   // projects:delete
      { roleId: 1, permissionId: 9, createdAt: new Date(), updatedAt: new Date() },   // roles:read
      { roleId: 1, permissionId: 10, createdAt: new Date(), updatedAt: new Date() },  // roles:create
      { roleId: 1, permissionId: 11, createdAt: new Date(), updatedAt: new Date() },  // roles:update
      { roleId: 1, permissionId: 12, createdAt: new Date(), updatedAt: new Date() },  // roles:delete
      { roleId: 1, permissionId: 13, createdAt: new Date(), updatedAt: new Date() },  // tasks:read
      { roleId: 1, permissionId: 14, createdAt: new Date(), updatedAt: new Date() },  // tasks:create
      { roleId: 1, permissionId: 15, createdAt: new Date(), updatedAt: new Date() },  // tasks:update
      { roleId: 1, permissionId: 16, createdAt: new Date(), updatedAt: new Date() },  // tasks:delete
      { roleId: 1, permissionId: 17, createdAt: new Date(), updatedAt: new Date() },  // groups:read
      { roleId: 1, permissionId: 18, createdAt: new Date(), updatedAt: new Date() },  // groups:create
      { roleId: 1, permissionId: 19, createdAt: new Date(), updatedAt: new Date() },  // groups:update
      { roleId: 1, permissionId: 20, createdAt: new Date(), updatedAt: new Date() },  // groups:delete
      { roleId: 1, permissionId: 21, createdAt: new Date(), updatedAt: new Date() },  // reports:read
      { roleId: 1, permissionId: 22, createdAt: new Date(), updatedAt: new Date() },  // dashboard:access
      
      // Manager - Quyền quản lý dự án và nhân sự (không được tạo/xóa dự án)
      { roleId: 2, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },   // users:read
      { roleId: 2, permissionId: 3, createdAt: new Date(), updatedAt: new Date() },   // users:update
      { roleId: 2, permissionId: 5, createdAt: new Date(), updatedAt: new Date() },   // projects:read
      { roleId: 2, permissionId: 7, createdAt: new Date(), updatedAt: new Date() },   // projects:update
      { roleId: 2, permissionId: 9, createdAt: new Date(), updatedAt: new Date() },   // roles:read
      { roleId: 2, permissionId: 13, createdAt: new Date(), updatedAt: new Date() },  // tasks:read
      { roleId: 2, permissionId: 14, createdAt: new Date(), updatedAt: new Date() },  // tasks:create
      { roleId: 2, permissionId: 15, createdAt: new Date(), updatedAt: new Date() },  // tasks:update
      { roleId: 2, permissionId: 16, createdAt: new Date(), updatedAt: new Date() },  // tasks:delete
      { roleId: 2, permissionId: 17, createdAt: new Date(), updatedAt: new Date() },  // groups:read
      { roleId: 2, permissionId: 18, createdAt: new Date(), updatedAt: new Date() },  // groups:create
      { roleId: 2, permissionId: 19, createdAt: new Date(), updatedAt: new Date() },  // groups:update
      { roleId: 2, permissionId: 21, createdAt: new Date(), updatedAt: new Date() },  // reports:read
      { roleId: 2, permissionId: 22, createdAt: new Date(), updatedAt: new Date() },  // dashboard:access
      
      // User - Quyền cơ bản
      { roleId: 3, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },   // users:read
      { roleId: 3, permissionId: 5, createdAt: new Date(), updatedAt: new Date() },   // projects:read
      { roleId: 3, permissionId: 13, createdAt: new Date(), updatedAt: new Date() },  // tasks:read
      { roleId: 3, permissionId: 14, createdAt: new Date(), updatedAt: new Date() },  // tasks:create
      { roleId: 3, permissionId: 15, createdAt: new Date(), updatedAt: new Date() },  // tasks:update
      { roleId: 3, permissionId: 17, createdAt: new Date(), updatedAt: new Date() },  // groups:read
      { roleId: 3, permissionId: 22, createdAt: new Date(), updatedAt: new Date() }   // dashboard:access
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Xóa RolePermissions trước
    await queryInterface.bulkDelete('RolePermissions', null, {});
    
    // Xóa Permissions
    await queryInterface.bulkDelete('Permissions', null, {});
    
    // Xóa Roles
    await queryInterface.bulkDelete('Roles', null, {});
  }
};