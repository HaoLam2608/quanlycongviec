'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy dữ liệu users và projects để tham chiếu
    const users = await queryInterface.sequelize.query(
      'SELECT id, manv FROM Users',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const projects = await queryInterface.sequelize.query(
      'SELECT id FROM DuAns LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (projects.length === 0 || users.length === 0) {
      console.log('Cần có ít nhất 1 dự án và users để tạo tasks');
      return;
    }
    
    const adminUser = users.find(u => u.manv === 'ADMIN001') || users[0];
    const managerUser = users.find(u => u.manv === 'QLY001') || users[1] || users[0];
    const projectId = projects[0].id;
    
    await queryInterface.bulkInsert('Tasks', [
      {
        tentask: 'Phân tích yêu cầu',
        mota: 'Thu thập và phân tích yêu cầu từ khách hàng, xác định phạm vi dự án',
        duanId: projectId,
        nguoiDuocGiaoId: managerUser.id,
        nguoiGiaoId: adminUser.id,
        ngayBatDau: '2025-01-10',
        ngayKetThuc: '2025-01-15',
        ngayHoanThanh: '2025-01-14',
        trangThai: 'Hoàn thành',
        mucDoUuTien: 'high',
        tienDo: 100,
        ghiChu: 'Hoàn thành đúng tiến độ',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tentask: 'Thiết kế Database',
        mota: 'Thiết kế cấu trúc cơ sở dữ liệu, quan hệ giữa các bảng',
        duanId: projectId,
        nguoiDuocGiaoId: users[2]?.id || users[0].id,
        nguoiGiaoId: adminUser.id,
        ngayBatDau: '2025-01-15',
        ngayKetThuc: '2025-01-20',
        ngayHoanThanh: null,
        trangThai: 'Đang chạy',
        mucDoUuTien: 'high',
        tienDo: 65,
        ghiChu: 'Đang trong giai đoạn tối ưu hóa',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tentask: 'Xây dựng API',
        mota: 'Phát triển các API endpoints cho hệ thống',
        duanId: projectId,
        nguoiDuocGiaoId: users[3]?.id || users[0].id,
        nguoiGiaoId: managerUser.id,
        ngayBatDau: '2025-01-20',
        ngayKetThuc: '2025-01-30',
        ngayHoanThanh: null,
        trangThai: 'Đang chạy',
        mucDoUuTien: 'medium',
        tienDo: 40,
        ghiChu: 'Đã hoàn thành Authentication API',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tentask: 'Thiết kế UI/UX',
        mota: 'Thiết kế giao diện người dùng và trải nghiệm sử dụng',
        duanId: projectId,
        nguoiDuocGiaoId: users[4]?.id || users[0].id,
        nguoiGiaoId: managerUser.id,
        ngayBatDau: '2025-01-18',
        ngayKetThuc: '2025-01-25',
        ngayHoanThanh: null,
        trangThai: 'Chưa bắt đầu',
        mucDoUuTien: 'medium',
        tienDo: 0,
        ghiChu: 'Chờ hoàn thành phân tích yêu cầu',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tentask: 'Phát triển Frontend',
        mota: 'Xây dựng giao diện người dùng với React/Next.js',
        duanId: projectId,
        nguoiDuocGiaoId: users[5]?.id || users[0].id,
        nguoiGiaoId: managerUser.id,
        ngayBatDau: '2025-01-25',
        ngayKetThuc: '2025-02-10',
        ngayHoanThanh: null,
        trangThai: 'Chưa bắt đầu',
        mucDoUuTien: 'high',
        tienDo: 0,
        ghiChu: 'Chờ hoàn thành UI/UX design',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tentask: 'Testing và QA',
        mota: 'Kiểm thử chất lượng và sửa lỗi hệ thống',
        duanId: projectId,
        nguoiDuocGiaoId: users[6]?.id || users[0].id,
        nguoiGiaoId: adminUser.id,
        ngayBatDau: '2025-02-05',
        ngayKetThuc: '2025-02-15',
        ngayHoanThanh: null,
        trangThai: 'Chưa bắt đầu',
        mucDoUuTien: 'high',
        tienDo: 0,
        ghiChu: 'Chuẩn bị test cases',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tasks', null, {});
  }
};