'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DuAn extends Model {
    static associate(models) {
      DuAn.belongsTo(models.User, { foreignKey: 'userId', as: 'nguoiDamNhan' });
    }
  }
  DuAn.init(
    {
      tenduan: DataTypes.STRING,
      mota: DataTypes.TEXT,
      ngaybatdau: DataTypes.DATE,
      ngayketthuc: DataTypes.DATE,
      userId: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM("chua_bat_dau", "dang_chay", "da_hoan_thanh", "da_dong"),
        defaultValue: "chua_bat_dau",
      },
    },
    {
      sequelize,
      modelName: "DuAn",
    }
  );

  return DuAn;
};
