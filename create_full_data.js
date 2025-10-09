const { Sequelize } = require('sequelize');

async function createFullSampleData() {
  try {
    const sequelize = new Sequelize('qlcv', 'root', '123456', {
      host: '127.0.0.1',
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Kết nối MySQL thành công!\n');

    // 1. Tạo thêm Users
    console.log('👥 Tạo thêm dữ liệu Users...');

    const additionalUsers = [
      {
        manv: 'NV006',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // bcrypt hash of "123456"
        hoten: 'Đỗ Thị Lan',
        chucvu: 'Kế toán',
        sdt: '0956789012',
        roleId: 3 // employee
      },
      {
        manv: 'NV007',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        hoten: 'Vũ Văn Hùng',
        chucvu: 'Marketing',
        sdt: '0967890123',
        roleId: 3 // employee
      },
      {
        manv: 'NV008',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        hoten: 'Ngô Thị Hoa',
        chucvu: 'Phó phòng HR',
        sdt: '0978901234',
        roleId: 2 // manager
      },
      {
        manv: 'NV009',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        hoten: 'Trần Văn Khoa',
        chucvu: 'Senior Developer',
        sdt: '0989012345',
        roleId: 3 // employee
      },
      {
        manv: 'NV010',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        hoten: 'Lý Thị Mai',
        chucvu: 'Designer',
        sdt: '0990123456',
        roleId: 3 // employee
      }
    ];

    for (const user of additionalUsers) {
      await sequelize.query(
        `INSERT IGNORE INTO Users (manv, password, hoten, chucvu, sdt, roleId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        { replacements: [user.manv, user.password, user.hoten, user.chucvu, user.sdt, user.roleId] }
      );
    }

    // 2. Tạo dự án mẫu
    console.log('📋 Tạo dữ liệu Dự án...');

    const projects = [
      {
        tenduan: 'Hệ thống quản lý nhân sự',
        mota: 'Xây dựng hệ thống quản lý nhân sự cho công ty',
        ngaybatdau: '2025-01-15',
        ngayketthuc: '2025-06-30',
        status: 'dang_chay',
        userId: 1 // NV001 - admin
      },
      {
        tenduan: 'Website thương mại điện tử',
        mota: 'Phát triển website bán hàng online',
        ngaybatdau: '2025-02-01',
        ngayketthuc: '2025-08-15',
        status: 'chua_bat_dau',
        userId: 3 // NV003 - manager
      },
      {
        tenduan: 'Ứng dụng mobile quản lý kho',
        mota: 'Ứng dụng di động để quản lý kho hàng',
        ngaybatdau: '2025-03-01',
        ngayketthuc: '2025-09-30',
        status: 'chua_bat_dau',
        userId: 8 // NV008 - manager
      },
      {
        tenduan: 'Hệ thống CRM',
        mota: 'Customer Relationship Management System',
        ngaybatdau: '2024-10-01',
        ngayketthuc: '2025-03-31',
        status: 'da_hoan_thanh',
        userId: 1 // NV001 - admin
      },
      {
        tenduan: 'Tối ưu hóa SEO website',
        mota: 'Cải thiện thứ hạng website trên công cụ tìm kiếm',
        ngaybatdau: '2025-01-01',
        ngayketthuc: '2025-04-30',
        status: 'dang_chay',
        userId: 7 // NV007 - marketing
      },
      {
        tenduan: 'Thiết kế logo và brand identity',
        mota: 'Thiết kế nhận diện thương hiệu mới cho công ty',
        ngaybatdau: '2024-12-01',
        ngayketthuc: '2025-02-28',
        status: 'da_hoan_thanh',
        userId: 10 // NV010 - designer
      }
    ];

    for (const project of projects) {
      await sequelize.query(
        `INSERT IGNORE INTO DuAns (tenduan, mota, ngaybatdau, ngayketthuc, status, userId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            project.tenduan,
            project.mota,
            project.ngaybatdau,
            project.ngayketthuc,
            project.status,
            project.userId
          ]
        }
      );
    }

    // 3. Tạo thêm Permissions
    console.log('🔐 Tạo thêm Permissions...');

    const additionalPermissions = [
      { resource: 'dashboard', action: 'view' },
      { resource: 'reports', action: 'generate' },
      { resource: 'reports', action: 'export' },
      { resource: 'settings', action: 'update' },
      { resource: 'roles', action: 'create' },
      { resource: 'roles', action: 'read' },
      { resource: 'roles', action: 'update' },
      { resource: 'roles', action: 'delete' },
      { resource: 'permissions', action: 'manage' }
    ];

    for (const perm of additionalPermissions) {
      await sequelize.query(
        `INSERT IGNORE INTO Permissions (resource, action, createdAt, updatedAt) 
         VALUES (?, ?, NOW(), NOW())`,
        { replacements: [perm.resource, perm.action] }
      );
    }

    // 4. Gán quyền cho các roles
    console.log('🔗 Gán quyền cho các roles...');

    // Lấy tất cả permissions
    const [allPermissions] = await sequelize.query("SELECT id FROM Permissions");

    // Admin có tất cả quyền (roleId = 1)
    for (const perm of allPermissions) {
      await sequelize.query(
        `INSERT IGNORE INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) 
         VALUES (1, ?, NOW(), NOW())`,
        { replacements: [perm.id] }
      );
    }

    // Manager có quyền quản lý dự án và một số quyền khác (roleId = 2)
    const managerPermissions = [
      'projects-create', 'projects-read', 'projects-update', 'projects-delete',
      'users-read', 'dashboard-view', 'reports-generate'
    ];

    for (const permName of managerPermissions) {
      const [perm] = await sequelize.query(
        `SELECT id FROM Permissions WHERE CONCAT(resource, '-', action) = ?`,
        { replacements: [permName] }
      );
      if (perm.length > 0) {
        await sequelize.query(
          `INSERT IGNORE INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) 
           VALUES (2, ?, NOW(), NOW())`,
          { replacements: [perm[0].id] }
        );
      }
    }

    // Employee có quyền cơ bản (roleId = 3)
    const employeePermissions = ['projects-read', 'users-read', 'dashboard-view'];

    for (const permName of employeePermissions) {
      const [perm] = await sequelize.query(
        `SELECT id FROM Permissions WHERE CONCAT(resource, '-', action) = ?`,
        { replacements: [permName] }
      );
      if (perm.length > 0) {
        await sequelize.query(
          `INSERT IGNORE INTO RolePermissions (roleId, permissionId, createdAt, updatedAt) 
           VALUES (3, ?, NOW(), NOW())`,
          { replacements: [perm[0].id] }
        );
      }
    }

    // 5. Hiển thị thống kê cuối cùng
    console.log('\n📊 Thống kê dữ liệu đã tạo:');

    const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM Users");
    const [projectCount] = await sequelize.query("SELECT COUNT(*) as count FROM DuAns");
    const [roleCount] = await sequelize.query("SELECT COUNT(*) as count FROM Roles");
    const [permissionCount] = await sequelize.query("SELECT COUNT(*) as count FROM Permissions");

    console.log(`👥 Users: ${userCount[0].count}`);
    console.log(`📋 Projects: ${projectCount[0].count}`);
    console.log(`👑 Roles: ${roleCount[0].count}`);
    console.log(`🔐 Permissions: ${permissionCount[0].count}`);

    // 6. Hiển thị danh sách users
    console.log('\n👥 Danh sách tất cả Users:');
    const [allUsers] = await sequelize.query(`
      SELECT u.manv, u.hoten, u.chucvu, r.name as role_name, u.sdt
      FROM Users u 
      LEFT JOIN Roles r ON u.roleId = r.id
      ORDER BY u.id
    `);
    console.table(allUsers);

    // 7. Hiển thị danh sách projects
    console.log('\n📋 Danh sách tất cả Projects:');
    const [allProjects] = await sequelize.query(`
      SELECT d.tenduan, d.status, u.hoten as manager, d.ngaybatdau, d.ngayketthuc
      FROM DuAns d
      LEFT JOIN Users u ON d.userId = u.id
      ORDER BY d.id
    `);
    console.table(allProjects);

    await sequelize.close();

    console.log('\n🎉 Đã tạo thành công dữ liệu mẫu cho tất cả các bảng!');
    console.log('\n📝 Thông tin đăng nhập:');
    console.log('   Username: NV001-NV010');
    console.log('   Password: 123456');
    console.log('   Roles: admin (NV001), manager (NV003, NV008), employee (others)');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

createFullSampleData();