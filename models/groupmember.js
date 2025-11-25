'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class GroupMember extends Model {
        static associate(models) {
            GroupMember.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group' });
            GroupMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }

    GroupMember.init({
        groupId: { type: DataTypes.INTEGER, allowNull: false },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        roleInGroup: { type: DataTypes.STRING },
        joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        sequelize,
        modelName: 'GroupMember',
        tableName: 'groupmembers',
    });

    return GroupMember;
};
