'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Conversations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Group name (null for direct chats)'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lastMessageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'FK to Messages table (nullable, circular)'
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata like avatar, description, etc.'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('Conversations', ['type']);
    await queryInterface.addIndex('Conversations', ['lastMessageAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Conversations');
  }
};
