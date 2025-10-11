'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash mật khẩu mặc định: 123456
    // Tất cả user có mật khẩu mặc định là "123456" để test
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Tạo user mẫu với dữ liệu thực tế - Phù hợp với môi trường công ty IT Việt Nam
    await queryInterface.bulkInsert('Users', [
      // Quản trị viên hệ thống
      {
        manv: 'ADMIN001',
        password: hashedPassword,
        chucvu: 'Quản trị viên hệ thống',
        hoten: 'Nguyễn Minh An',
        sdt: '0901234567',
        roleId: 1, // admin role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Quản lý dự án
      {
        manv: 'QLY001',
        password: hashedPassword,
        chucvu: 'Quản lý dự án IT',
        hoten: 'Trần Thành Đạt',
        sdt: '0912345678',
        roleId: 2, // manager role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'QLY002', 
        password: hashedPassword,
        chucvu: 'Trưởng phòng Phát triển',
        hoten: 'Lê Thị Hoài Thu',
        sdt: '0923456789',
        roleId: 2, // manager role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Nhân viên phát triển
      {
        manv: 'DEV001',
        password: hashedPassword,
        chucvu: 'Lập trình viên Frontend',
        hoten: 'Phan Văn Khôi',
        sdt: '0934567890',
        roleId: 3, // user role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'DEV002',
        password: hashedPassword,
        chucvu: 'Lập trình viên Backend',
        hoten: 'Võ Thị Thanh Hương',
        sdt: '0945678901',
        roleId: 3, // user role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'DEV003',
        password: hashedPassword,
        chucvu: 'Lập trình viên Fullstack',
        hoten: 'Đỗ Minh Quân',
        sdt: '0956789012',
        roleId: 3, // user role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Nhân viên kiểm thử và thiết kế
      {
        manv: 'QA001',
        password: hashedPassword,
        chucvu: 'Chuyên viên Kiểm thử',
        hoten: 'Nguyễn Thị Lan Anh',
        sdt: '0967890123',
        roleId: 3, // user role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'DES001',
        password: hashedPassword,
        chucvu: 'Thiết kế UI/UX',
        hoten: 'Bùi Thanh Long',
        sdt: '0978901234',
        roleId: 3, // user role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Nhân viên hỗ trợ
      {
        manv: 'SUP001',
        password: hashedPassword,
        chucvu: 'Chuyên viên Hỗ trợ kỹ thuật',
        hoten: 'Hoàng Văn Tùng',
        sdt: '0989012345',
        roleId: 3, // user role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        manv: 'BA001',
        password: hashedPassword,
        chucvu: 'Business Analyst',
        hoten: 'Phạm Thị Mỹ Linh',
        sdt: '0990123456',
        roleId: 3, // user role
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
