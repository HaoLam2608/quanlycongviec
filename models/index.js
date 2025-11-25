// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const process = require('process');
// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env];
// const db = {};

// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js' &&
//       file.indexOf('.test.js') === -1
//     );
//   })
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//   });


// // Thêm GroupProject vào db
// const GroupProject = require("./groupproject")(sequelize, Sequelize.DataTypes);
// db.GroupProject = GroupProject;

// // Thêm Worklog vào db
// const Worklog = require("./worklog")(sequelize, Sequelize.DataTypes);
// db.Worklog = Worklog;

// // Thêm Assignment vào db
// const Assignment = require("./assignment")(sequelize, Sequelize.DataTypes);
// db.Assignment = Assignment;

// // Thêm UserNotification vào db
// const UserNotification = require("./usernotification")(sequelize, Sequelize.DataTypes);
// db.UserNotification = UserNotification;

// // Thiết lập association nhiều-nhiều giữa Group và DuAn qua GroupProject
// if (db.Group && db.DuAn) {
//   db.Group.belongsToMany(db.DuAn, {
//     through: db.GroupProject,
//     foreignKey: "groupId",
//     otherKey: "projectId",
//     as: "projects"
//   });
//   db.DuAn.belongsToMany(db.Group, {
//     through: db.GroupProject,
//     foreignKey: "projectId",
//     otherKey: "groupId",
//     as: "groups"
//   });
// }


// // Đảm bảo Group trả về groupProjects (1-n)
// if (db.Group && db.GroupProject) {
//   db.Group.hasMany(db.GroupProject, { foreignKey: 'groupId', as: 'groupProjects' });
//   db.GroupProject.belongsTo(db.Group, { foreignKey: 'groupId' });
// }

// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

// db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// module.exports = db;
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
// Giữ lại dòng này để chạy local nếu cần, nhưng cẩn thận nếu file config không tồn tại
let config;
try {
  config = require(__dirname + '/../config/config.json')[env];
} catch (error) {
  console.log('⚠️ Không tìm thấy config.json hoặc lỗi đọc file, sẽ dùng biến môi trường.');
  config = {};
}

const db = {};

let sequelize;

// --- SỬA ĐOẠN NÀY ---
// Ưu tiên kiểm tra biến môi trường DB_HOST từ Docker trước
if (process.env.DB_HOST) {
  console.log(`🔌 Kết nối Database qua Docker Env: ${process.env.DB_HOST}`);
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST, // Sẽ là 'mysql' hoặc 'qlcv-mysql'
      dialect: 'mysql',
      port: process.env.DB_PORT || 3306,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        // Thêm tùy chọn này nếu MySQL 8 có vấn đề xác thực cũ
        authPlugins: {
          mysql_clear_password: true,
        }
      }
    }
  );
}
// Nếu không có biến môi trường thì mới dùng config cũ (cho trường hợp chạy local)
else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
// --------------------

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

// Thêm Assignment vào db
const Assignment = require("./assignment")(sequelize, Sequelize.DataTypes);
db.Assignment = Assignment;

// Thêm UserNotification vào db
const UserNotification = require("./usernotification")(sequelize, Sequelize.DataTypes);
db.UserNotification = UserNotification;

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