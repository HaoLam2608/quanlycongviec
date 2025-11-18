"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Document extends Model {
        static associate(models) {
            Document.belongsTo(models.DuAn, { foreignKey: 'duanId', as: 'duan' });
            Document.belongsTo(models.User, { foreignKey: 'userId', as: 'uploader' });
            Document.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group' });
        }
    }
    Document.init(
        {
            filename: DataTypes.STRING,
            originalname: DataTypes.STRING,
            mimetype: DataTypes.STRING,
            size: DataTypes.INTEGER,
            data: DataTypes.BLOB('long'),
            duanId: DataTypes.INTEGER,
            userId: DataTypes.INTEGER,
            groupId: DataTypes.INTEGER,
            description: DataTypes.TEXT,
        },
        {
            sequelize,
            modelName: "Document",
        }
    );

    return Document;
};
