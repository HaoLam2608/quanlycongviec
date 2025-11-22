'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add approval fields to Tasks table
    await queryInterface.addColumn('Tasks', 'approvedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Tasks', 'approvedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Tasks', 'requestedCompletionAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add approval fields to Subtasks table
    await queryInterface.addColumn('Subtasks', 'approvedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Subtasks', 'approvedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Subtasks', 'requestedCompletionAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove approval fields from Tasks table
    await queryInterface.removeColumn('Tasks', 'approvedBy');
    await queryInterface.removeColumn('Tasks', 'approvedAt');
    await queryInterface.removeColumn('Tasks', 'requestedCompletionAt');

    // Remove approval fields from Subtasks table
    await queryInterface.removeColumn('Subtasks', 'approvedBy');
    await queryInterface.removeColumn('Subtasks', 'approvedAt');
    await queryInterface.removeColumn('Subtasks', 'requestedCompletionAt');
  }
};
