"use strict";
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class GroupProject extends Model {
        static associate(models) {
            GroupProject.belongsTo(models.Group, {
                foreignKey: 'groupId',
                as: 'group'
            });
            GroupProject.belongsTo(models.DuAn, {
                foreignKey: 'projectId',
                as: 'project'
            });
        }
    }

    GroupProject.init({
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: "active",
        },
    }, {
        sequelize,
        modelName: 'GroupProject',
        tableName: "group_projects",
    });

    return GroupProject;
};
