"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('Worklogs', 'task_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Tasks',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
        await queryInterface.changeColumn('Worklogs', 'subtask_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Subtasks',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('Worklogs', 'task_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'Tasks',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
        await queryInterface.changeColumn('Worklogs', 'subtask_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Subtasks',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    }
};
