'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      // Task thuộc về một dự án
      Task.belongsTo(models.DuAn, {
        foreignKey: 'duanId',
        as: 'duan'
      });

      // Task được giao bởi một user
      Task.belongsTo(models.User, {
        foreignKey: 'nguoiGiaoId',
        as: 'nguoiGiao'
      });

      // Task được giao cho một user chính
      Task.belongsTo(models.User, {
        foreignKey: 'nguoiDuocGiaoId',
        as: 'nguoiDuocGiao'
      });

      // Task có nhiều subtasks
      Task.hasMany(models.Subtask, {
        foreignKey: 'taskId',
        as: 'subtasks'
      });
    }
  }

  Task.init({
    tentask: {
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
    duanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
        isInt: true
      }
    },
    nguoiDuocGiaoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true
      }
    },
    nguoiGiaoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
        isInt: true
      }
    },
    ngayBatDau: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ngayKetThuc: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: true,
        isDate: true
      }
    },
    ngayHoanThanh: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    trangThai: {
      type: DataTypes.ENUM('Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành'),
      defaultValue: 'Chưa bắt đầu',
      validate: {
        isIn: [['Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành']]
      }
    },
    mucDoUuTien: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high']]
      }
    },
    tienDo: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
        isInt: true
      }
    },
    ghiChu: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
    indexes: [
      {
        fields: ['duanId']
      },
      {
        fields: ['nguoiDuocGiaoId']
      },
      {
        fields: ['trangThai']
      },
      {
        fields: ['ngayKetThuc']
      }
    ]
  });

  // Define associations
  Task.associate = function (models) {
    // Task belongs to DuAn
    Task.belongsTo(models.DuAn, {
      foreignKey: 'duanId',
      as: 'duan'
    });

    // Task belongs to User (người giao)
    Task.belongsTo(models.User, {
      foreignKey: 'nguoiGiaoId',
      as: 'nguoiGiao'
    });

    // Task belongs to User (người được giao)
    Task.belongsTo(models.User, {
      foreignKey: 'nguoiDuocGiaoId',
      as: 'nguoiDuocGiao'
    });

    // Task belongs to User (người phê duyệt)
    Task.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });

    // Task has many Subtasks
    Task.hasMany(models.Subtask, {
      foreignKey: 'taskId',
      as: 'subtasks'
    });
  };

  const recalcProjectStatus = async (task, options) => {
    if (!task || !task.duanId) return;

    const TaskModel = task.constructor;
    const { DuAn } = TaskModel.sequelize.models;
    if (!DuAn) return;

    const transaction = options?.transaction;

    const project = await DuAn.findByPk(task.duanId, { transaction });
    if (!project) return;

    const totalTasks = await TaskModel.count({
      where: { duanId: task.duanId },
      transaction
    });

    if (totalTasks === 0) return;

    const incompleteCount = await TaskModel.count({
      where: {
        duanId: task.duanId,
        trangThai: { [Op.notIn]: ['Hoàn thành'] }
      },
      transaction
    });

    if (incompleteCount === 0) {
      if (!['da_hoan_thanh', 'da_dong'].includes(project.status)) {
        await project.update({ status: 'da_hoan_thanh' }, { transaction });
      }
    } else if (project.status === 'da_hoan_thanh') {
      await project.update({ status: 'dang_chay' }, { transaction });
    }
  };

  Task.addHook('afterCreate', recalcProjectStatus);
  Task.addHook('afterUpdate', recalcProjectStatus);
  Task.addHook('afterDestroy', recalcProjectStatus);

  return Task;
};