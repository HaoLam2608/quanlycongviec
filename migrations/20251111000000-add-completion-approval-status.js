'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // This migration ensures the completion approval status exists in Task and Subtask tables
    // The status 'Chờ xác nhận hoàn thành' is already defined in the model
    // No database changes needed as the ENUM values are already in place
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // No changes to revert
    return Promise.resolve();
  }
};
