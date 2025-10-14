"use strict";
module.exports = (sequelize, DataTypes) => {
    const GroupProject = sequelize.define(
        "GroupProject",
        {
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
        },
        {
            tableName: "group_projects",
        }
    );
    // Không cần associate ở đây!
    return GroupProject;
};
