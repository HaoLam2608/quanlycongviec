"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("GroupMembers", {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            groupId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Groups", key: "id" }, onDelete: "CASCADE" },
            userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "Users", key: "id" }, onDelete: "CASCADE" },
            roleInGroup: { type: Sequelize.STRING, allowNull: true },
            joinedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });
        await queryInterface.addConstraint('GroupMembers', { fields: ['groupId', 'userId'], type: 'unique', name: 'uniq_group_user' });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("GroupMembers");
    }
};
