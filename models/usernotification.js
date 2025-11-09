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
        }
    }, {
        sequelize,
        modelName: 'UserNotification',
        tableName: 'UserNotifications',
        timestamps: true
    });

    return UserNotification;
};
