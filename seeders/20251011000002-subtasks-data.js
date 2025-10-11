'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy dữ liệu tasks và users để tham chiếu
    const tasks = await queryInterface.sequelize.query(
      'SELECT id, tentask FROM Tasks',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const users = await queryInterface.sequelize.query(
      'SELECT id, hoten FROM Users',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (tasks.length === 0 || users.length === 0) {
      console.log('Cần có tasks và users để tạo subtasks');
      return;
    }
    
    // Tìm task "Phân tích yêu cầu"
    const phanTichTask = tasks.find(t => t.tentask === 'Phân tích yêu cầu');
    
    // Tìm task "Thiết kế Database" 
    const thietKeDBTask = tasks.find(t => t.tentask === 'Thiết kế Database');
    
    // Tìm task "Xây dựng API"
    const xayDungAPITask = tasks.find(t => t.tentask === 'Xây dựng API');
    
    // Tìm task "Thiết kế UI/UX"
    const thietKeUITask = tasks.find(t => t.tentask === 'Thiết kế UI/UX');
    
    const subtasks = [];
    
    // Subtasks cho "Phân tích yêu cầu"
    if (phanTichTask) {
      subtasks.push(
        {
          tenSubtask: 'Họp với khách hàng',
          mota: 'Tổ chức cuộc họp để thu thập yêu cầu chi tiết từ khách hàng',
          taskId: phanTichTask.id,
          nguoiThucHienId: users[0].id,
          trangThai: 'Hoàn thành',
          ngayBatDau: '2025-01-10',
          ngayKetThuc: '2025-01-11',
          ngayHoanThanh: '2025-01-11',
          thuTu: 1,
          ghiChu: 'Đã có biên bản họp',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'Viết tài liệu yêu cầu',
          mota: 'Soạn thảo tài liệu đặc tả yêu cầu hệ thống',
          taskId: phanTichTask.id,
          nguoiThucHienId: users[1]?.id || users[0].id,
          trangThai: 'Hoàn thành',
          ngayBatDau: '2025-01-11',
          ngayKetThuc: '2025-01-13',
          ngayHoanThanh: '2025-01-13',
          thuTu: 2,
          ghiChu: 'Đã review và phê duyệt',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'Review và phê duyệt',
          mota: 'Xem xét và phê duyệt tài liệu yêu cầu',
          taskId: phanTichTask.id,
          nguoiThucHienId: users[0].id,
          trangThai: 'Hoàn thành',
          ngayBatDau: '2025-01-13',
          ngayKetThuc: '2025-01-14',
          ngayHoanThanh: '2025-01-14',
          thuTu: 3,
          ghiChu: 'Đã có chữ ký phê duyệt',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }
    
    // Subtasks cho "Thiết kế Database"
    if (thietKeDBTask) {
      subtasks.push(
        {
          tenSubtask: 'Vẽ ERD diagram',
          mota: 'Thiết kế sơ đồ thực thể quan hệ',
          taskId: thietKeDBTask.id,
          nguoiThucHienId: users[2]?.id || users[0].id,
          trangThai: 'Hoàn thành',
          ngayBatDau: '2025-01-15',
          ngayKetThuc: '2025-01-16',
          ngayHoanThanh: '2025-01-16',
          thuTu: 1,
          ghiChu: 'Đã có ERD chi tiết',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'Tạo migration scripts',
          mota: 'Viết các script migration để tạo cấu trúc database',
          taskId: thietKeDBTask.id,
          nguoiThucHienId: users[3]?.id || users[0].id,
          trangThai: 'Đang chạy',
          ngayBatDau: '2025-01-16',
          ngayKetThuc: '2025-01-18',
          ngayHoanThanh: null,
          thuTu: 2,
          ghiChu: 'Đã hoàn thành 70%',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'Seed dữ liệu mẫu',
          mota: 'Tạo dữ liệu mẫu cho việc phát triển và test',
          taskId: thietKeDBTask.id,
          nguoiThucHienId: users[3]?.id || users[0].id,
          trangThai: 'Chưa bắt đầu',
          ngayBatDau: '2025-01-18',
          ngayKetThuc: '2025-01-19',
          ngayHoanThanh: null,
          thuTu: 3,
          ghiChu: 'Chờ hoàn thành migration',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }
    
    // Subtasks cho "Xây dựng API"
    if (xayDungAPITask) {
      subtasks.push(
        {
          tenSubtask: 'API Authentication',
          mota: 'Phát triển API đăng nhập, đăng ký và xác thực',
          taskId: xayDungAPITask.id,
          nguoiThucHienId: users[3]?.id || users[0].id,
          trangThai: 'Đang chạy',
          ngayBatDau: '2025-01-20',
          ngayKetThuc: '2025-01-22',
          ngayHoanThanh: null,
          thuTu: 1,
          ghiChu: 'Đã hoàn thành JWT implementation',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'API User Management',
          mota: 'Phát triển API quản lý người dùng',
          taskId: xayDungAPITask.id,
          nguoiThucHienId: users[2]?.id || users[0].id,
          trangThai: 'Chưa bắt đầu',
          ngayBatDau: '2025-01-23',
          ngayKetThuc: '2025-01-25',
          ngayHoanThanh: null,
          thuTu: 2,
          ghiChu: 'Chờ hoàn thành Authentication API',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'API Project Management',
          mota: 'Phát triển API quản lý dự án và nhiệm vụ',
          taskId: xayDungAPITask.id,
          nguoiThucHienId: users[3]?.id || users[0].id,
          trangThai: 'Chưa bắt đầu',
          ngayBatDau: '2025-01-25',
          ngayKetThuc: '2025-01-28',
          ngayHoanThanh: null,
          thuTu: 3,
          ghiChu: 'Phụ thuộc vào User Management API',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }
    
    // Subtasks cho "Thiết kế UI/UX"
    if (thietKeUITask) {
      subtasks.push(
        {
          tenSubtask: 'Wireframe các màn hình',
          mota: 'Vẽ wireframe cho tất cả các màn hình trong hệ thống',
          taskId: thietKeUITask.id,
          nguoiThucHienId: users[4]?.id || users[0].id,
          trangThai: 'Chưa bắt đầu',
          ngayBatDau: '2025-01-18',
          ngayKetThuc: '2025-01-20',
          ngayHoanThanh: null,
          thuTu: 1,
          ghiChu: 'Cần xác nhận yêu cầu từ khách hàng',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'Design system',
          mota: 'Xây dựng hệ thống thiết kế với component library',
          taskId: thietKeUITask.id,
          nguoiThucHienId: users[5]?.id || users[0].id,
          trangThai: 'Chưa bắt đầu',
          ngayBatDau: '2025-01-20',
          ngayKetThuc: '2025-01-22',
          ngayHoanThanh: null,
          thuTu: 2,
          ghiChu: 'Sẽ sử dụng Figma Design Tokens',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenSubtask: 'Prototype tương tác',
          mota: 'Tạo prototype có thể tương tác cho việc demo',
          taskId: thietKeUITask.id,
          nguoiThucHienId: users[4]?.id || users[0].id,
          trangThai: 'Chưa bắt đầu',
          ngayBatDau: '2025-01-23',
          ngayKetThuc: '2025-01-25',
          ngayHoanThanh: null,
          thuTu: 3,
          ghiChu: 'Sử dụng Figma hoặc Framer',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }
    
    if (subtasks.length > 0) {
      await queryInterface.bulkInsert('Subtasks', subtasks);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Subtasks', null, {});
  }
};