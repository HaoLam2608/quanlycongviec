'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Comments');

    // Only add column if it doesn't exist
    if (!table.mentions) {
      await queryInterface.addColumn('Comments', 'mentions', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of mentioned user IDs: [userId1, userId2, ...]'
      });
    } else {
      console.log('Column mentions already exists, skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Comments');

    if (table.mentions) {
      await queryInterface.removeColumn('Comments', 'mentions');
    }
  }
};
