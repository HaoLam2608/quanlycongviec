'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm trạng thái "Chờ xác nhận hoàn thành" vào ENUM của Tasks
    await queryInterface.sequelize.query(`
      ALTER TABLE Tasks 
      MODIFY COLUMN trangThai ENUM(
        'Chưa bắt đầu', 
        'Đang chạy', 
        'Chờ xác nhận hoàn thành',
        'Hoàn thành'
      ) DEFAULT 'Chưa bắt đầu'
    `);

    // Thêm trạng thái "Chờ xác nhận hoàn thành" vào ENUM của Subtasks
    await queryInterface.sequelize.query(`
      ALTER TABLE Subtasks 
      MODIFY COLUMN trangThai ENUM(
        'Chưa bắt đầu', 
        'Đang chạy', 
        'Chờ xác nhận hoàn thành',
        'Hoàn thành'
      ) DEFAULT 'Chưa bắt đầu'
    `);

    console.log('✅ Added "Chờ xác nhận hoàn thành" status to Tasks and Subtasks');
  },

  async down(queryInterface, Sequelize) {
    // Xóa trạng thái "Chờ xác nhận hoàn thành" khỏi ENUM của Tasks
    await queryInterface.sequelize.query(`
      ALTER TABLE Tasks 
      MODIFY COLUMN trangThai ENUM(
        'Chưa bắt đầu', 
        'Đang chạy', 
        'Hoàn thành'
      ) DEFAULT 'Chưa bắt đầu'
    `);

    // Xóa trạng thái "Chờ xác nhận hoàn thành" khỏi ENUM của Subtasks
    await queryInterface.sequelize.query(`
      ALTER TABLE Subtasks 
      MODIFY COLUMN trangThai ENUM(
        'Chưa bắt đầu', 
        'Đang chạy', 
        'Hoàn thành'
      ) DEFAULT 'Chưa bắt đầu'
    `);

    console.log('✅ Removed "Chờ xác nhận hoàn thành" status from Tasks and Subtasks');
  }
};
