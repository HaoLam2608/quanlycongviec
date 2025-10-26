"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('worklogs', 'task_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'tasks', // ✅ dùng chữ thường
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });

        await queryInterface.changeColumn('worklogs', 'subtask_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'subtasks', // ✅ chữ thường
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('worklogs', 'task_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'tasks',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        await queryInterface.changeColumn('worklogs', 'subtask_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'subtasks',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
    },
};
