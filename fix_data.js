const { Sequelize } = require('sequelize');

async function fixDataIssues() {
  try {
    const sequelize = new Sequelize('qlcv', 'root', '123456', {
      host: '127.0.0.1',
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Kết nối MySQL thành công!\n');

    // 1. Kiểm tra và sửa permissions
    console.log('🔐 Kiểm tra Permissions...');
    const [permCount] = await sequelize.query("SELECT COUNT(*) as count FROM Permissions");
    console.log(`Số lượng permissions hiện tại: ${permCount[0].count}`);

    if (permCount[0].count <= 1) {
      console.log('Tạo lại permissions...');

      // Xóa permissions cũ
      await sequelize.query("DELETE FROM RolePermissions");
      await sequelize.query("DELETE FROM Permissions");

      // Tạo permissions mới
      const permissions = [
        { name: 'users-create', resource: 'users', action: 'create', description: 'Tạo user mới' },
        { name: 'users-read', resource: 'users', action: 'read', description: 'Xem danh sách user' },
        { name: 'users-update', resource: 'users', action: 'update', description: 'Cập nhật user' },
        { name: 'users-delete', resource: 'users', action: 'delete', description: 'Xóa user' },
        { name: 'projects-create', resource: 'projects', action: 'create', description: 'Tạo dự án mới' },
        { name: 'projects-read', resource: 'projects', action: 'read', description: 'Xem danh sách dự án' },
        { name: 'projects-update', resource: 'projects', action: 'update', description: 'Cập nhật dự án' },
        { name: 'projects-delete', resource: 'projects', action: 'delete', description: 'Xóa dự án' },
        { name: 'dashboard-view', resource: 'dashboard', action: 'view', description: 'Xem dashboard' },
        { name: 'reports-generate', resource: 'reports', action: 'generate', description: 'Tạo báo cáo' },
        { name: 'reports-export', resource: 'reports', action: 'export', description: 'Xuất báo cáo' },
        { name: 'settings-update', resource: 'settings', action: 'update', description: 'Cập nhật cài đặt' },
        { name: 'roles-create', resource: 'roles', action: 'create', description: 'Tạo role mới' },
        { name: 'roles-read', resource: 'roles', action: 'read', description: 'Xem danh sách role' },
        { name: 'roles-update', resource: 'roles', action: 'update', description: 'Cập nhật role' },
        { name: 'roles-delete', resource: 'roles', action: 'delete', description: 'Xóa role' },
        // groups permissions
        { name: 'groups-create', resource: 'groups', action: 'create', description: 'Tạo nhóm' },
        { name: 'groups-read', resource: 'groups', action: 'read', description: 'Xem nhóm' },
        { name: 'groups-update', resource: 'groups', action: 'update', description: 'Cập nhật nhóm' },
        { name: 'groups-delete', resource: 'groups', action: 'delete', description: 'Xóa nhóm' }
      ];

      for (const perm of permissions) {
        await sequelize.query(
          `INSERT INTO Permissions (name, resource, action, description, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          { replacements: [perm.name, perm.resource, perm.action, perm.description] }
        );
      }

      // Gán tất cả quyền cho admin (roleId = 1)
      const [allPermissions] = await sequelize.query("SELECT id FROM Permissions");
      for (const perm of allPermissions) {
        await sequelize.query(
          `INSERT INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) 
           VALUES (1, ?, NOW(), NOW())`,
          { replacements: [perm.id] }
        );
      }

      // Gán quyền cho manager (roleId = 2)
      const managerPerms = ['projects', 'users-read', 'dashboard-view', 'reports-generate', 'groups'];
      for (const permResource of managerPerms) {
        const [perms] = await sequelize.query(
          `SELECT id FROM Permissions WHERE resource = ? OR resource LIKE ?`,
          { replacements: [permResource, `${permResource}%`] }
        );
        for (const perm of perms) {
          await sequelize.query(
            `INSERT IGNORE INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) 
             VALUES (2, ?, NOW(), NOW())`,
            { replacements: [perm.id] }
          );
        }
      }

      // Gán quyền cho employee (roleId = 3)
      const [basicPerms] = await sequelize.query(
        `SELECT id FROM Permissions WHERE 
   (resource = 'projects' AND action = 'read') OR
   (resource = 'users' AND action = 'read') OR
   (resource = 'dashboard' AND action = 'view') OR
   (resource = 'groups' AND action = 'read')`
      );
      for (const perm of basicPerms) {
        await sequelize.query(
          `INSERT IGNORE INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) 
           VALUES (3, ?, NOW(), NOW())`,
          { replacements: [perm.id] }
        );
      }
    }

    // 2. Sửa status của projects
    console.log('\n📋 Sửa status của Projects...');
    await sequelize.query("UPDATE DuAns SET status = 'dang_chay' WHERE status = '' OR status IS NULL");

    // Cập nhật status cụ thể cho từng project
    const projectUpdates = [
      { tenduan: 'Hệ thống CRM', status: 'da_hoan_thanh' },
      { tenduan: 'Thiết kế logo và brand identity', status: 'da_hoan_thanh' },
      { tenduan: 'Website thương mại điện tử', status: 'chua_bat_dau' },
      { tenduan: 'Ứng dụng mobile quản lý kho', status: 'chua_bat_dau' }
    ];

    for (const update of projectUpdates) {
      await sequelize.query(
        "UPDATE DuAns SET status = ? WHERE tenduan = ?",
        { replacements: [update.status, update.tenduan] }
      );
    }

    // 3. Thống kê cuối cùng
    console.log('\n📊 Thống kê dữ liệu sau khi sửa:');

    const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM Users");
    const [projectCount] = await sequelize.query("SELECT COUNT(*) as count FROM DuAns");
    const [roleCount] = await sequelize.query("SELECT COUNT(*) as count FROM Roles");
    const [permissionCount] = await sequelize.query("SELECT COUNT(*) as count FROM Permissions");
    const [rolePermCount] = await sequelize.query("SELECT COUNT(*) as count FROM RolePermissions");

    console.log(`👥 Users: ${userCount[0].count}`);
    console.log(`📋 Projects: ${projectCount[0].count}`);
    console.log(`👑 Roles: ${roleCount[0].count}`);
    console.log(`🔐 Permissions: ${permissionCount[0].count}`);
    console.log(`🔗 Role-Permission mappings: ${rolePermCount[0].count}`);

    // 4. Hiển thị projects với status
    console.log('\n📋 Projects với status:');
    const [projects] = await sequelize.query(`
      SELECT d.tenduan, d.status, u.hoten as manager, 
             DATE_FORMAT(d.ngaybatdau, '%Y-%m-%d') as start_date,
             DATE_FORMAT(d.ngayketthuc, '%Y-%m-%d') as end_date
      FROM DuAns d
      LEFT JOIN Users u ON d.userId = u.id
      ORDER BY d.id
    `);
    console.table(projects);

    // 5. Hiển thị permissions theo role
    console.log('\n🔐 Permissions theo role:');
    const [adminPerms] = await sequelize.query(`
      SELECT COUNT(*) as count FROM RolePermissions WHERE roleId = 1
    `);
    const [managerPerms] = await sequelize.query(`
      SELECT COUNT(*) as count FROM RolePermissions WHERE roleId = 2
    `);
    const [employeePerms] = await sequelize.query(`
      SELECT COUNT(*) as count FROM RolePermissions WHERE roleId = 3
    `);

    console.log(`Admin permissions: ${adminPerms[0].count}`);
    console.log(`Manager permissions: ${managerPerms[0].count}`);
    console.log(`Employee permissions: ${employeePerms[0].count}`);

    await sequelize.close();

    console.log('\n🎉 Đã sửa lỗi và hoàn thiện dữ liệu!');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

fixDataIssues();