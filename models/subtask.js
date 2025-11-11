'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subtask extends Model {
    static associate(models) {
      // Subtask thuộc về một task
      Subtask.belongsTo(models.Task, {
        foreignKey: 'taskId',
        as: 'task'
      });

      // Subtask được thực hiện bởi một user
      Subtask.belongsTo(models.User, {
        foreignKey: 'nguoiThucHienId',
        as: 'nguoiThucHien'
      });

      // Subtask có thể có assignment đang chờ
      Subtask.hasMany(models.Assignment, {
        foreignKey: 'subtaskId',
        as: 'assignments'
      });
    }
  }

  Subtask.init({
    tenSubtask: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    mota: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
        isInt: true
      }
    },
    nguoiThucHienId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true
      }
    },
    trangThai: {
      type: DataTypes.ENUM('Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành'),
      defaultValue: 'Chưa bắt đầu',
      validate: {
        isIn: [['Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành']]
      }
    },
    ngayBatDau: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ngayKetThuc: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ngayHoanThanh: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    thuTu: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        isInt: true,
        min: 1
      }
    },
    ghiChu: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Subtask',
    tableName: 'Subtasks',
    timestamps: true,
    indexes: [
      {
        fields: ['taskId']
      },
      {
        fields: ['nguoiThucHienId']
      },
      {
        fields: ['trangThai']
      },
      {
        fields: ['thuTu']
      }
    ]
  });

  return Subtask;
};