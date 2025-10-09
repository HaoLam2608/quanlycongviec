const { Sequelize } = require('sequelize');

async function setupRolesAndUsers() {
  try {
    const sequelize = new Sequelize('qlcv', 'root', '123456', {
      host: '127.0.0.1',
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Kết nối MySQL thành công!');

    // Tạo các roles mẫu
    console.log('\n🔧 Tạo roles mẫu...');

    const roles = [
      { name: 'admin', description: 'Quản trị viên hệ thống' },
      { name: 'manager', description: 'Quản lý dự án' },
      { name: 'employee', description: 'Nhân viên' }
    ];

    for (const role of roles) {
      await sequelize.query(
        `INSERT IGNORE INTO Roles (name, description, createdAt, updatedAt) 
         VALUES (?, ?, NOW(), NOW())`,
        { replacements: [role.name, role.description] }
      );
    }

    // Lấy role IDs
    const [adminRole] = await sequelize.query("SELECT id FROM Roles WHERE name = 'admin'");
    const [managerRole] = await sequelize.query("SELECT id FROM Roles WHERE name = 'manager'");
    const [employeeRole] = await sequelize.query("SELECT id FROM Roles WHERE name = 'employee'");

    const adminRoleId = adminRole[0].id;
    const managerRoleId = managerRole[0].id;
    const employeeRoleId = employeeRole[0].id;

    console.log(`Admin Role ID: ${adminRoleId}`);
    console.log(`Manager Role ID: ${managerRoleId}`);
    console.log(`Employee Role ID: ${employeeRoleId}`);

    // Cập nhật users với roles
    console.log('\n👥 Cập nhật roles cho users...');

    await sequelize.query(
      "UPDATE Users SET roleId = ? WHERE manv = 'NV001'",
      { replacements: [adminRoleId] }
    );

    await sequelize.query(
      "UPDATE Users SET roleId = ? WHERE manv = 'NV003'",
      { replacements: [managerRoleId] }
    );

    // Các user còn lại là employee
    await sequelize.query(
      "UPDATE Users SET roleId = ? WHERE manv IN ('NV002', 'NV004', 'NV005')",
      { replacements: [employeeRoleId] }
    );

    // Kiểm tra kết quả
    console.log('\n📊 Kết quả sau khi cập nhật:');

    const [users] = await sequelize.query(`
      SELECT u.id, u.manv, u.hoten, u.chucvu, r.name as role_name 
      FROM Users u 
      LEFT JOIN Roles r ON u.roleId = r.id
      ORDER BY u.id
    `);

    console.table(users);

    // Tạo một vài permissions mẫu
    console.log('\n🔐 Tạo permissions mẫu...');

    const permissions = [
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'projects', action: 'create' },
      { resource: 'projects', action: 'read' },
      { resource: 'projects', action: 'update' },
      { resource: 'projects', action: 'delete' }
    ];

    for (const perm of permissions) {
      await sequelize.query(
        `INSERT IGNORE INTO Permissions (resource, action, createdAt, updatedAt) 
         VALUES (?, ?, NOW(), NOW())`,
        { replacements: [perm.resource, perm.action] }
      );
    }

    // Gán quyền cho admin (tất cả quyền)
    const [allPermissions] = await sequelize.query("SELECT id FROM Permissions");
    for (const perm of allPermissions) {
      await sequelize.query(
        `INSERT IGNORE INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) 
         VALUES (?, ?, NOW(), NOW())`,
        { replacements: [adminRoleId, perm.id] }
      );
    }

    console.log('✅ Đã setup roles, permissions và cập nhật users thành công!');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

setupRolesAndUsers();