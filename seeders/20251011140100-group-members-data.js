'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Thêm thành viên vào các nhóm
    await queryInterface.bulkInsert('GroupMembers', [
      // Frontend Development Team (groupId: 1)
      { groupId: 1, userId: 4, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // DEV001
      { groupId: 1, userId: 5, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV002
      { groupId: 1, userId: 6, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV003
      
      // Backend Development Team (groupId: 2)
      { groupId: 2, userId: 2, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // Trần Thành Đạt
      { groupId: 2, userId: 4, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV001
      { groupId: 2, userId: 5, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV002
      
      // UI/UX Design Team (groupId: 3)
      { groupId: 3, userId: 10, role: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // DEV007
      { groupId: 3, userId: 13, role: 'Member', createdAt: new Date(), updatedAt: new Date() }, // Bùi Thành Long
      { groupId: 3, userId: 14, role: 'Member', createdAt: new Date(), updatedAt: new Date() }, // Phan Văn Khôi
      
      // DevOps & Infrastructure (groupId: 4)  
      { groupId: 4, userId: 7, role: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // DEV004 (Backend lead kiêm DevOps)
      { groupId: 4, userId: 15, role: 'Member', createdAt: new Date(), updatedAt: new Date() }, // Võ Thị Thanh Hương
      
      // Quality Assurance Team (groupId: 5)
      { groupId: 5, userId: 16, role: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // Đỗ Minh Quân
      { groupId: 5, userId: 17, role: 'Member', createdAt: new Date(), updatedAt: new Date() }, // Nguyễn Thị Lan Anh
      { groupId: 5, userId: 5, role: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV002 (kiêm testing)
      
      // Product Management (groupId: 6)
      { groupId: 6, userId: 2, role: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // QLY001
      { groupId: 6, userId: 3, role: 'Member', createdAt: new Date(), updatedAt: new Date() }, // QLY002
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GroupMembers', null, {});
  }
};