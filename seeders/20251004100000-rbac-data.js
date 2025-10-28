'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Đã seed Roles, Permissions, RolePermissions ở file khác. Không seed lại ở đây để tránh trùng lặp.
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
  }
};