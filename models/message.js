'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation'
      });

      Message.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });

      Message.belongsTo(models.Message, {
        foreignKey: 'replyTo',
        as: 'repliedMessage'
      });

      Message.hasMany(models.Message, {
        foreignKey: 'replyTo',
        as: 'replies'
      });
    }
  }

  Message.init({
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      allowNull: false,
      defaultValue: 'text'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    replyTo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    timestamps: true,
    paranoid: false // We handle soft delete manually with deletedAt
  });

  return Message;
};
