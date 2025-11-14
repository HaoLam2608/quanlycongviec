'use strict';

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    subtaskId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    mentions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Array of mentioned user IDs'
    }
  }, {
    tableName: 'Comments',
    timestamps: true,
    validate: {
      eitherTaskOrSubtask() {
        if (!this.taskId && !this.subtaskId) {
          throw new Error('Either taskId or subtaskId must be provided');
        }
      }
    }
  });

  Comment.associate = function(models) {
    Comment.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
    Comment.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    Comment.belongsTo(models.Subtask, { foreignKey: 'subtaskId', as: 'subtask' });
  };

  return Comment;
};
