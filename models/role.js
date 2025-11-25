'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // Role có nhiều Users
      Role.hasMany(models.User, { foreignKey: 'roleId', as: 'users' });

      // Role có nhiều Permissions thông qua RolePermission
      Role.belongsToMany(models.Permission, {
        through: models.RolePermission,
        foreignKey: 'roleId',
        otherKey: 'permissionId',
        as: 'permissions'
      });
    }
  }

  Role.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
  });

  return Role;
};