'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Notifications', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
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
                allowNull: false,
                comment: 'Comma-separated list: all, admin, manager, member'
            },
            authorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
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

        // Add indexes
        await queryInterface.addIndex('Notifications', ['status']);
        await queryInterface.addIndex('Notifications', ['type']);
        await queryInterface.addIndex('Notifications', ['priority']);
        await queryInterface.addIndex('Notifications', ['authorId']);
        await queryInterface.addIndex('Notifications', ['createdAt']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Notifications');
    }
};