'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConversationParticipant extends Model {
    static associate(models) {
      ConversationParticipant.belongsTo(models.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation'
      });

      ConversationParticipant.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  ConversationParticipant.init({
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('member', 'admin'),
      allowNull: false,
      defaultValue: 'member'
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ConversationParticipant',
    tableName: 'conversationparticipants',
    timestamps: true
  });

  return ConversationParticipant;
};
