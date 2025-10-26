"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Worklogs', { force: true }).catch(() => { });
        await queryInterface.createTable('Worklogs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            task_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Tasks',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            work_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            hours_spent: {
                type: Sequelize.FLOAT,
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            issues: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected'),
                allowNull: true,
                defaultValue: 'draft'
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Worklogs');
    }
};
