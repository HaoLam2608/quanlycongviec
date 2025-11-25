"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User belongs to Role
      User.belongsTo(models.Role, { foreignKey: "roleId", as: "role" });

      // Projects created / owned by this user
      if (models.DuAn) {
        User.hasMany(models.DuAn, { foreignKey: "userId", as: "duans" });
      }

      // Tasks relation (two roles: creator and assignee)
      if (models.Task) {
        User.hasMany(models.Task, { foreignKey: "nguoiGiaoId", as: "tasksGiao" });
        User.hasMany(models.Task, { foreignKey: "nguoiDuocGiaoId", as: "tasksNhan" });
      }

      // Assignments where user is manager or assignee
      if (models.Assignment) {
        User.hasMany(models.Assignment, { foreignKey: "managerId", as: "managedAssignments" });
        User.hasMany(models.Assignment, { foreignKey: "assigneeId", as: "assignments" });
      }
    }
  }

  User.init(
    {
      manv: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      chucvu: {
        type: DataTypes.STRING,
        allowNull: true
      },
      hoten: {
        type: DataTypes.STRING,
        allowNull: true
      },
      sdt: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatarData: {
        type: DataTypes.BLOB('long'),
        allowNull: true
      },
      avatarMime: {
        type: DataTypes.STRING,
        allowNull: true
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true
    }
  );

  return User;
};
