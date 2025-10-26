"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Groups", {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            name: { type: Sequelize.STRING, allowNull: false },
            description: { type: Sequelize.TEXT },
            duanId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "DuAns", key: "id" }, onDelete: "CASCADE" },
            leaderId: { type: Sequelize.INTEGER, allowNull: true, references: { model: "Users", key: "id" }, onDelete: "SET NULL" },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("Groups");
    }
};
