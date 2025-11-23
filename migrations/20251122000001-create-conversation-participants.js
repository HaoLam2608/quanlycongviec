'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ConversationParticipants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      conversationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('member', 'admin'),
        allowNull: false,
        defaultValue: 'member',
        comment: 'Admin can add/remove members in group chats'
      },
      lastReadAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time user read messages in this conversation'
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      leftAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user left the conversation (soft delete)'
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

    // Unique constraint: one user per conversation
    await queryInterface.addConstraint('ConversationParticipants', {
      fields: ['conversationId', 'userId'],
      type: 'unique',
      name: 'unique_conversation_user'
    });

    await queryInterface.addIndex('ConversationParticipants', ['conversationId']);
    await queryInterface.addIndex('ConversationParticipants', ['userId']);
    await queryInterface.addIndex('ConversationParticipants', ['lastReadAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ConversationParticipants');
  }
};
