"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Worklogs', 'subtask_id', {
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
        await queryInterface.removeColumn('Worklogs', 'subtask_id');
    }
};
