'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });

      Conversation.belongsTo(models.Message, {
        foreignKey: 'lastMessageId',
        as: 'lastMessage'
      });

      Conversation.hasMany(models.ConversationParticipant, {
        foreignKey: 'conversationId',
        as: 'participants'
      });

      Conversation.hasMany(models.Message, {
        foreignKey: 'conversationId',
        as: 'messages'
      });

      // Many-to-many through ConversationParticipants
      Conversation.belongsToMany(models.User, {
        through: models.ConversationParticipant,
        foreignKey: 'conversationId',
        otherKey: 'userId',
        as: 'users'
      });
    }
  }

  Conversation.init({
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      defaultValue: 'direct'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatarData: {
      type: DataTypes.BLOB('long'),
      allowNull: true
    },
    avatarMime: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lastMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'Conversations',
    timestamps: true
  });

  return Conversation;
};
