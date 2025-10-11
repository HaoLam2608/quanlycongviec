'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Thêm thành viên vào các nhóm
    await queryInterface.bulkInsert('GroupMembers', [
      // Frontend Development Team (groupId: 13)
      { groupId: 13, userId: 3, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // Lê Thị Hoài Thu
      { groupId: 13, userId: 4, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV001
      { groupId: 13, userId: 8, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DES001
      
      // Backend Development Team (groupId: 14)
      { groupId: 14, userId: 2, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // Trần Thành Đạt
      { groupId: 14, userId: 5, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV002
      { groupId: 14, userId: 6, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV003
      
      // UI/UX Design Team (groupId: 15)
      { groupId: 15, userId: 8, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // DES001
      { groupId: 15, userId: 4, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // DEV001
      
      // DevOps & Infrastructure (groupId: 16)  
      { groupId: 16, userId: 6, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // DEV003
      { groupId: 16, userId: 9, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // SUP001
      
      // Quality Assurance Team (groupId: 17)
      { groupId: 17, userId: 7, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // QA001
      { groupId: 17, userId: 10, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // BA001
      
      // Product Management (groupId: 18)
      { groupId: 18, userId: 10, roleInGroup: 'Leader', createdAt: new Date(), updatedAt: new Date() }, // BA001
      { groupId: 18, userId: 3, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }, // Lê Thị Hoài Thu
      { groupId: 18, userId: 2, roleInGroup: 'Member', createdAt: new Date(), updatedAt: new Date() }  // Trần Thành Đạt
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GroupMembers', null, {});
  }
};