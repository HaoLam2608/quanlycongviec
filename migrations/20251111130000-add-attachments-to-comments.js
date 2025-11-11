'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Comments', 'attachments', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Array of attachment objects: [{filename, originalname, mimetype, size, path}]'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Comments', 'attachments');
  }
};
