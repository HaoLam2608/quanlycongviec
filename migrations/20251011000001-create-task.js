'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tentask: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tên nhiệm vụ'
      },
      mota: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả nhiệm vụ'
      },
      duanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'DuAns',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID dự án'
      },
      nguoiDuocGiaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID người được giao nhiệm vụ chính'
      },
      nguoiGiaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID người giao nhiệm vụ'
      },
      ngayBatDau: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Ngày bắt đầu'
      },
      ngayKetThuc: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ngày kết thúc dự kiến (hạn chót)'
      },
      ngayHoanThanh: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Ngày hoàn thành thực tế'
      },
      trangThai: {
        type: Sequelize.ENUM('Chưa bắt đầu', 'Đang chạy', 'Hoàn thành'),
        defaultValue: 'Chưa bắt đầu',
        comment: 'Trạng thái nhiệm vụ'
      },
      mucDoUuTien: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
        comment: 'Mức độ ưu tiên'
      },
      tienDo: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        },
        comment: 'Tiến độ hoàn thành (%)'
      },
      ghiChu: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú thêm'
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
    await queryInterface.dropTable('Tasks');
  }
};