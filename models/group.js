'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Group extends Model {
        static associate(models) {
            Group.belongsTo(models.DuAn, { foreignKey: 'duanId', as: 'duan' });
            Group.belongsTo(models.User, { foreignKey: 'leaderId', as: 'leader' });
            Group.belongsToMany(models.User, {
                through: models.GroupMember,
                foreignKey: 'groupId',
                otherKey: 'userId',
                as: 'members'
            });
            Group.hasMany(models.GroupProjectHistory, {
                foreignKey: 'groupId',
                as: 'projectHistories'
            });
        }
    }

    Group.init({
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        duanId: { type: DataTypes.INTEGER, allowNull: true },
        leaderId: { type: DataTypes.INTEGER }
    }, {
        sequelize,
        modelName: 'Group',
    });

    return Group;
};
