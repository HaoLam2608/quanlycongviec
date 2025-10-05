'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User thuộc về một Role
      User.hasMany(models.DuAn, { foreignKey: 'userId', as: 'duans' });
      User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
    }

    // Method để kiểm tra quyền
    async hasPermission(resource, action) {
      if (!this.role) {
        await this.reload({ include: [{ model: sequelize.models.Role, as: 'role', include: [{ model: sequelize.models.Permission, as: 'permissions' }] }] });
      }
      
      if (!this.role || !this.role.permissions) return false;
      
      return this.role.permissions.some(permission => 
        permission.resource === resource && permission.action === action
      );
    }

    // Method để lấy tất cả permissions
    async getPermissions() {
      if (!this.role) {
        await this.reload({ include: [{ model: sequelize.models.Role, as: 'role', include: [{ model: sequelize.models.Permission, as: 'permissions' }] }] });
      }
      
      return this.role?.permissions || [];
    }

    }
  
  User.init({
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
    chucvu: {
      type: DataTypes.STRING
    },
    hoten: {
      type: DataTypes.STRING
    },
    sdt: {
      type: DataTypes.STRING
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};