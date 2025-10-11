'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Tạo các nhóm làm việc mẫu
    await queryInterface.bulkInsert('Groups', [
      {
        name: 'Frontend Development Team',
        description: 'Nhóm phát triển giao diện người dùng, chuyên về React, Vue.js, Angular',
        duanId: 12, // Dự án Hệ thống quản lý nhân sự HRM
        leaderId: 3, // Lê Thị Hoài Thu (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Backend Development Team', 
        description: 'Nhóm phát triển backend, API, database và server-side logic',
        duanId: 12, // Dự án Hệ thống quản lý nhân sự HRM
        leaderId: 2, // Trần Thành Đạt (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'UI/UX Design Team',
        description: 'Nhóm thiết kế giao diện và trải nghiệm người dùng',
        duanId: 13, // Website bán hàng trực tuyến
        leaderId: 8, // Bùi Thanh Long (Designer)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'DevOps & Infrastructure',
        description: 'Nhóm quản lý hạ tầng, deployment và CI/CD',
        duanId: 14, // Ứng dụng mobile quản lý công việc
        leaderId: 6, // Đỗ Minh Quân (DevOps Lead)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Quality Assurance Team',
        description: 'Nhóm kiểm tra chất lượng phần mềm và testing',
        duanId: 15, // Hệ thống Business Intelligence
        leaderId: 7, // Nguyễn Thị Lan Anh (QA Lead)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Product Management',
        description: 'Nhóm quản lý sản phẩm và phân tích yêu cầu',
        duanId: 16, // Nâng cấp hệ thống bảo mật
        leaderId: 10, // Phạm Thị Mỹ Linh (Business Analyst)
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Groups', null, {});
  }
};