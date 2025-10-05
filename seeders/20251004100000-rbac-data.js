'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tạo Roles
    await queryInterface.bulkInsert('Roles', [
      { name: 'admin', description: 'Administrator - Full access', createdAt: new Date(), updatedAt: new Date() },
      { name: 'manager', description: 'Manager - Limited admin access', createdAt: new Date(), updatedAt: new Date() },
      { name: 'employee', description: 'Employee - Basic access', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Tạo Permissions
    await queryInterface.bulkInsert('Permissions', [
      // User permissions
      { name: 'users:read', resource: 'users', action: 'read', description: 'View users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'users:create', resource: 'users', action: 'create', description: 'Create users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'users:update', resource: 'users', action: 'update', description: 'Update users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users', createdAt: new Date(), updatedAt: new Date() },
      
      // Project permissions
      { name: 'projects:read', resource: 'projects', action: 'read', description: 'View projects', createdAt: new Date(), updatedAt: new Date() },
      { name: 'projects:create', resource: 'projects', action: 'create', description: 'Create projects', createdAt: new Date(), updatedAt: new Date() },
      { name: 'projects:update', resource: 'projects', action: 'update', description: 'Update projects', createdAt: new Date(), updatedAt: new Date() },
      { name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Delete projects', createdAt: new Date(), updatedAt: new Date() },
      
      // Role permissions
      { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles', createdAt: new Date(), updatedAt: new Date() },
      { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles', createdAt: new Date(), updatedAt: new Date() },
      { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles', createdAt: new Date(), updatedAt: new Date() },
      { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Gán permissions cho roles
    // Admin - Full access
    await queryInterface.bulkInsert('RolePermissions', [
      { roleId: 1, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 2, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 3, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 4, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 5, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 6, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 7, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 8, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 9, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 10, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 11, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 1, permissionId: 12, createdAt: new Date(), updatedAt: new Date() },
      
      // Manager - Limited access
      { roleId: 2, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 2, permissionId: 3, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 2, permissionId: 5, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 2, permissionId: 6, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 2, permissionId: 7, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 2, permissionId: 9, createdAt: new Date(), updatedAt: new Date() },
      
      // Employee - Basic access
      { roleId: 3, permissionId: 1, createdAt: new Date(), updatedAt: new Date() },
      { roleId: 3, permissionId: 5, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
  }
};