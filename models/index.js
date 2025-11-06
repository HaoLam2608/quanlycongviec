'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });


// Thêm GroupProject vào db
const GroupProject = require("./groupproject")(sequelize, Sequelize.DataTypes);
db.GroupProject = GroupProject;

// Thêm Worklog vào db
const Worklog = require("./worklog")(sequelize, Sequelize.DataTypes);
db.Worklog = Worklog;

// Report đã được auto-load bởi fs.readdirSync ở trên, không cần load thủ công

// Thiết lập association nhiều-nhiều giữa Group và DuAn qua GroupProject
if (db.Group && db.DuAn) {
  db.Group.belongsToMany(db.DuAn, {
    through: db.GroupProject,
    foreignKey: "groupId",
    otherKey: "projectId",
    as: "projects"
  });
  db.DuAn.belongsToMany(db.Group, {
    through: db.GroupProject,
    foreignKey: "projectId",
    otherKey: "groupId",
    as: "groups"
  });
}


// Đảm bảo Group trả về groupProjects (1-n)
if (db.Group && db.GroupProject) {
  db.Group.hasMany(db.GroupProject, { foreignKey: 'groupId', as: 'groupProjects' });
  db.GroupProject.belongsTo(db.Group, { foreignKey: 'groupId' });
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
