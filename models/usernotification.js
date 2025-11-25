'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserNotification extends Model {
        static associate(models) {
            UserNotification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            UserNotification.belongsTo(models.Notification, { foreignKey: 'notificationId', as: 'notification' });
        }
    }

    UserNotification.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        notificationId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        meta: {
            type: DataTypes.JSON,
            allowNull: true
        },
        processed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        processedBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'UserNotification',
        tableName: 'usernotifications',
        timestamps: true
    });

    return UserNotification;
};
