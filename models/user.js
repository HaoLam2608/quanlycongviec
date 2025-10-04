'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.DuAn, { foreignKey: 'userId', as: 'duans' });
    }
  }
  User.init({
    manv: DataTypes.STRING,
    token: DataTypes.STRING,
    password: DataTypes.STRING,
    chucvu: DataTypes.STRING,
    hoten: DataTypes.STRING,
    sdt: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};