'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Tạo user mẫu
    await queryInterface.bulkInsert('Users', [
      {
        manv: 'ADMIN001',
        password: hashedPassword,
        chucvu: 'Quản trị viên',
        hoten: 'Administrator',
        sdt: '0901234567',
        roleId: 1, // admin role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'MGR001',
        password: hashedPassword,
        chucvu: 'Quản lý',
        hoten: 'Nguyễn Văn Manager',
        sdt: '0901234568',
        roleId: 2, // manager role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'EMP001',
        password: hashedPassword,
        chucvu: 'Nhân viên',
        hoten: 'Trần Thị Employee',
        sdt: '0901234569',
        roleId: 3, // employee role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'EMP002',
        password: hashedPassword,
        chucvu: 'Nhân viên',
        hoten: 'Lê Văn Công',
        sdt: '0901234570',
        roleId: 3, // employee role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'EMP003',
        password: hashedPassword,
        chucvu: 'Nhân viên',
        hoten: 'Phạm Thị Minh',
        sdt: '0901234571',
        roleId: 3, // employee role
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
