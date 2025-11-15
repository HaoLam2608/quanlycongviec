"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Notifications', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('system', 'project', 'task', 'announcement'),
                allowNull: false,
                defaultValue: 'announcement'
            },
            priority: {
                type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
                allowNull: false,
                defaultValue: 'medium'
            },
            status: {
                type: Sequelize.ENUM('draft', 'published'),
                allowNull: false,
                defaultValue: 'draft'
            },
            targetAudience: {
                type: Sequelize.STRING,
                allowNull: false
            },
            authorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            publishedAt: {
                type: Sequelize.DATE,
                allowNull: true
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

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Notifications');
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_Notifications_type\";");
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_Notifications_priority\";");
        await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_Notifications_status\";");
    }
};
