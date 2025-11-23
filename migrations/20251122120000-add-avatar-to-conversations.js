'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Conversations', 'avatar', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Conversations', 'avatarData', {
      type: Sequelize.BLOB('long'),
      allowNull: true
    });
    
    await queryInterface.addColumn('Conversations', 'avatarMime', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Conversations', 'avatar');
    await queryInterface.removeColumn('Conversations', 'avatarData');
    await queryInterface.removeColumn('Conversations', 'avatarMime');
  }
};
