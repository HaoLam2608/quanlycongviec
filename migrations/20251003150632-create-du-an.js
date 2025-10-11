'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DuAns', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenduan: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mota: {
        type: Sequelize.TEXT
      },
      ngaybatdau: {
        type: Sequelize.DATE
      },
      ngayketthuc: {
        type: Sequelize.DATE
      },
      status :{
        type: Sequelize.ENUM("chua_bat_dau", "dang_chay", "da_hoan_thanh", "da_dong"),
        defaultValue: "chua_bat_dau",
        comment: 'Trạng thái dự án: chưa bắt đầu, đang chạy, đã hoàn thành, đã đóng, tạm dừng'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', // liên kết tới bảng Users
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('DuAns');
  }
};
