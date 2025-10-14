"use strict";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("group_projects", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            groupId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "groups", key: "id" },
                onDelete: "CASCADE"
            },
            projectId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "duans", key: "id" },
                onDelete: "CASCADE"
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "active"
            },
            createdAt: { type: Sequelize.DATE, allowNull: false },
            updatedAt: { type: Sequelize.DATE, allowNull: false }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("group_projects");
    }
};
