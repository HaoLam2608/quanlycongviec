'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      manv: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      token: {
        type: Sequelize.STRING,
        allowNull: true

      },
      password: {
        type: Sequelize.STRING,
        allowNull: false

      },
      chucvu: {
        type: Sequelize.STRING
      },
      hoten: {
        type: Sequelize.STRING
      },
      sdt: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt : {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};