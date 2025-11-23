'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Messages', {
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
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Message text content (null for attachment-only messages)'
      },
      type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'system'),
        allowNull: false,
        defaultValue: 'text'
      },
      attachments: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of attachment objects with {filename, url, size, mimetype}'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata like mentions, reactions, etc.'
      },
      replyTo: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Message ID being replied to'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp'
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

    await queryInterface.addIndex('Messages', ['conversationId', 'createdAt']);
    await queryInterface.addIndex('Messages', ['senderId']);
    await queryInterface.addIndex('Messages', ['type']);
    
    // Add FK for Conversations.lastMessageId (circular reference, created after Messages table exists)
    await queryInterface.addConstraint('Conversations', {
      fields: ['lastMessageId'],
      type: 'foreign key',
      name: 'fk_conversations_last_message',
      references: {
        table: 'Messages',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Conversations', 'fk_conversations_last_message');
    await queryInterface.dropTable('Messages');
  }
};
