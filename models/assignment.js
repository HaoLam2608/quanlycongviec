'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Assignment extends Model {
        static associate(models) {
            Assignment.belongsTo(models.User, { foreignKey: 'managerId', as: 'manager' });
            Assignment.belongsTo(models.User, { foreignKey: 'assigneeId', as: 'assignee' });
            Assignment.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
            Assignment.belongsTo(models.Subtask, { foreignKey: 'subtaskId', as: 'subtask' });
        }
    }

    Assignment.init({
        taskId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        subtaskId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        managerId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        assigneeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'declined'),
            allowNull: false,
            defaultValue: 'pending'
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Assignment',
        tableName: 'Assignments',
        timestamps: true
    });

    return Assignment;
};
