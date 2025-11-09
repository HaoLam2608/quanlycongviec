'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Reports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID nhóm (nếu báo cáo theo nhóm)'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Tiêu đề báo cáo'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Nội dung báo cáo'
      },
      reportType: {
        type: Sequelize.ENUM('tien_do', 'van_de', 'hoan_thanh', 'tong_ket', 'khac'),
        allowNull: false,
        defaultValue: 'tien_do',
        comment: 'Loại báo cáo'
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'reviewed', 'approved'),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Trạng thái báo cáo'
      },
      reportDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Ngày báo cáo'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Người tạo báo cáo'
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Danh sách file đính kèm'
      },
      statistics: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Thống kê số liệu'
      },
      reviewedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Người xem xét'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian xem xét'
      },
      reviewNote: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú từ người xem xét'
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

    // Add indexes
    await queryInterface.addIndex('Reports', ['duanId']);
    await queryInterface.addIndex('Reports', ['groupId']);
    await queryInterface.addIndex('Reports', ['createdBy']);
    await queryInterface.addIndex('Reports', ['reportDate']);
    await queryInterface.addIndex('Reports', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Reports');
  }
};
