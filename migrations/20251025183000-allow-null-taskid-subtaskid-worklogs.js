"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop foreign key constraints
    await queryInterface.removeConstraint('worklogs', 'worklogs_task_id_foreign_idx').catch(() => { });
    await queryInterface.removeConstraint('worklogs', 'worklogs_task_id_fkey').catch(() => { });
    await queryInterface.removeConstraint('worklogs', 'worklogs_ibfk_3').catch(() => { });
    await queryInterface.removeConstraint('worklogs', 'worklogs_subtask_id_foreign_idx').catch(() => { });
    await queryInterface.removeConstraint('worklogs', 'worklogs_subtask_id_fkey').catch(() => { });
    await queryInterface.removeConstraint('worklogs', 'worklogs_ibfk_4').catch(() => { });

    // 2. Alter columns to allow NULL
    await queryInterface.changeColumn('worklogs', 'task_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('worklogs', 'subtask_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // 3. Add foreign key constraints back with ON DELETE SET NULL
    await queryInterface.addConstraint('worklogs', {
      fields: ['task_id'],
      type: 'foreign key',
      name: 'fk_worklogs_task_id',
      references: {
        table: 'tasks',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint('worklogs', {
      fields: ['subtask_id'],
      type: 'foreign key',
      name: 'fk_worklogs_subtask_id',
      references: {
        table: 'subtasks',
        field: 'id',
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
