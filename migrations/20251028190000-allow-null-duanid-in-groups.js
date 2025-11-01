"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // Đổi duanId thành cho phép null
        await queryInterface.changeColumn("Groups", "duanId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "DuAns", key: "id" },
            onDelete: "CASCADE"
        });
    },
    async down(queryInterface, Sequelize) {
        // Đổi lại về không cho null
        await queryInterface.changeColumn("Groups", "duanId", {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "DuAns", key: "id" },
            onDelete: "CASCADE"
        });
    }
};
