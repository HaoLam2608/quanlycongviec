'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subtasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenSubtask: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tên công việc nhỏ'
      },
      mota: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả công việc nhỏ'
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID task cha'
      },
      nguoiThucHienId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID người thực hiện subtask'
      },
      trangThai: {
        type: Sequelize.ENUM('Chưa bắt đầu', 'Đang chạy', 'Hoàn thành'),
        defaultValue: 'Chưa bắt đầu',
        comment: 'Trạng thái subtask'
      },
      ngayBatDau: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Ngày bắt đầu'
      },
      ngayKetThuc: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Ngày kết thúc dự kiến'
      },
      ngayHoanThanh: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Ngày hoàn thành thực tế'
      },
      thuTu: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Thứ tự thực hiện trong task'
      },
      ghiChu: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Subtasks');
  }
};