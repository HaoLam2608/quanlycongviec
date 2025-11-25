'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class GroupProjectHistory extends Model {
        static associate(models) {
            // Associations
            GroupProjectHistory.belongsTo(models.Group, {
                foreignKey: 'groupId',
                as: 'group'
            });

            GroupProjectHistory.belongsTo(models.DuAn, {
                foreignKey: 'duanId',
                as: 'duan'
            });
        }
    }

    GroupProjectHistory.init({
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        duanId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('dang_tham_gia', 'hoan_thanh', 'da_dung'),
            allowNull: false,
            defaultValue: 'dang_tham_gia'
        },
        joinedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'GroupProjectHistory',
        tableName: 'groupprojecthistories'
    });

    return GroupProjectHistory;
};