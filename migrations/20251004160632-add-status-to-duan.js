"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("DuAns", "status", {
      type: Sequelize.ENUM("chua_bat_dau", "dang_chay", "da_hoan_thanh", "da_dong"),
      allowNull: false,
      defaultValue: "chua_bat_dau",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DuAns", "status");
  },
};
