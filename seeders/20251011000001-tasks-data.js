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
      'SELECT id, tenduan FROM DuAns',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (projects.length === 0 || users.length === 0) {
      console.log('Cần có ít nhất 1 dự án và users để tạo tasks');
      return;
    }
    
    const adminUser = users.find(u => u.manv === 'ADMIN001') || users[0];
    const managerUser1 = users.find(u => u.manv === 'QLY001') || users[1] || users[0];
    const managerUser2 = users.find(u => u.manv === 'QLY002') || users[2] || users[0];
    
    const findProjectIdByName = (name) => {
      const p = projects.find(x => x.tenduan === name);
      return p ? p.id : null;
    };
    
    const findUserIdByManv = (manv) => {
      const u = users.find(x => x.manv === manv);
      return u ? u.id : null;
    };
    
    const hrmProjectId = findProjectIdByName('Hệ thống quản lý nhân sự HRM');
    const ecommerceProjectId = findProjectIdByName('Website bán hàng trực tuyến');
    const mobileProjectId = findProjectIdByName('Ứng dụng mobile quản lý công việc');
    const biProjectId = findProjectIdByName('Hệ thống Business Intelligence');
    
    const tasks = [];
    
    // Tasks cho dự án đầu tiên (để Subtasks seeder có thể tham chiếu)
    const firstProjectId = projects[0]?.id;
    if (firstProjectId) {
      tasks.push(
        {
          tentask: 'Phân tích yêu cầu',
          mota: 'Thu thập và phân tích yêu cầu từ khách hàng, xác định phạm vi dự án',
          duanId: firstProjectId,
          nguoiDuocGiaoId: managerUser1.id,
          nguoiGiaoId: adminUser.id,
          ngayBatDau: '2025-01-10',
          ngayKetThuc: '2025-01-15',
          ngayHoanThanh: '2025-01-14',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Hoàn thành đúng tiến độ',
          createdAt: new Date('2025-01-10'),
          updatedAt: new Date('2025-01-14')
        },
        {
          tentask: 'Thiết kế Database',
          mota: 'Thiết kế cấu trúc cơ sở dữ liệu, quan hệ giữa các bảng',
          duanId: firstProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV002') || users[2]?.id || users[0].id,
          nguoiGiaoId: adminUser.id,
          ngayBatDau: '2025-01-15',
          ngayKetThuc: '2025-01-20',
          ngayHoanThanh: null,
          trangThai: 'Đang chạy',
          mucDoUuTien: 'high',
          tienDo: 65,
          ghiChu: 'Đang trong giai đoạn tối ưu hóa',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date()
        },
        {
          tentask: 'Xây dựng API',
          mota: 'Phát triển các API endpoints cho hệ thống',
          duanId: firstProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV002') || users[3]?.id || users[0].id,
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2025-01-20',
          ngayKetThuc: '2025-01-30',
          ngayHoanThanh: null,
          trangThai: 'Đang chạy',
          mucDoUuTien: 'medium',
          tienDo: 40,
          ghiChu: 'Đã hoàn thành Authentication API',
          createdAt: new Date('2025-01-20'),
          updatedAt: new Date()
        },
        {
          tentask: 'Thiết kế UI/UX',
          mota: 'Thiết kế giao diện người dùng và trải nghiệm sử dụng',
          duanId: firstProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DES001') || users[4]?.id || users[0].id,
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2025-01-18',
          ngayKetThuc: '2025-01-25',
          ngayHoanThanh: null,
          trangThai: 'Chưa bắt đầu',
          mucDoUuTien: 'medium',
          tienDo: 0,
          ghiChu: 'Chờ hoàn thành phân tích yêu cầu',
          createdAt: new Date('2025-01-18'),
          updatedAt: new Date('2025-01-18')
        },
        {
          tentask: 'Phát triển Frontend',
          mota: 'Xây dựng giao diện người dùng với React/Next.js',
          duanId: firstProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV001') || users[5]?.id || users[0].id,
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2025-01-25',
          ngayKetThuc: '2025-02-10',
          ngayHoanThanh: null,
          trangThai: 'Chưa bắt đầu',
          mucDoUuTien: 'high',
          tienDo: 0,
          ghiChu: 'Chờ hoàn thành UI/UX design',
          createdAt: new Date('2025-01-25'),
          updatedAt: new Date('2025-01-25')
        },
        {
          tentask: 'Testing và QA',
          mota: 'Kiểm thử chất lượng và sửa lỗi hệ thống',
          duanId: firstProjectId,
          nguoiDuocGiaoId: findUserIdByManv('QA001') || users[6]?.id || users[0].id,
          nguoiGiaoId: adminUser.id,
          ngayBatDau: '2025-02-05',
          ngayKetThuc: '2025-02-15',
          ngayHoanThanh: null,
          trangThai: 'Chưa bắt đầu',
          mucDoUuTien: 'high',
          tienDo: 0,
          ghiChu: 'Chuẩn bị test cases',
          createdAt: new Date('2025-02-05'),
          updatedAt: new Date('2025-02-05')
        }
      );
    }
    
    // Tasks cho dự án HRM
    if (hrmProjectId) {
      tasks.push(
        {
          tentask: 'Phân tích yêu cầu hệ thống HRM',
          mota: 'Thu thập và phân tích yêu cầu từ khách hàng, xác định phạm vi dự án HRM',
          duanId: hrmProjectId,
          nguoiDuocGiaoId: managerUser1.id,
          nguoiGiaoId: adminUser.id,
          ngayBatDau: '2024-01-20',
          ngayKetThuc: '2024-01-25',
          ngayHoanThanh: '2024-01-24',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Hoàn thành đúng tiến độ',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-24')
        },
        {
          tentask: 'Thiết kế Database HRM',
          mota: 'Thiết kế cấu trúc cơ sở dữ liệu cho hệ thống quản lý nhân sự',
          duanId: hrmProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV002'),
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2024-01-25',
          ngayKetThuc: '2024-02-05',
          ngayHoanThanh: '2024-02-04',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Đã hoàn thành ERD và migration scripts',
          createdAt: new Date('2024-01-25'),
          updatedAt: new Date('2024-02-04')
        },
        {
          tentask: 'Xây dựng API Backend HRM',
          mota: 'Phát triển các API endpoints cho hệ thống HRM',
          duanId: hrmProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV002'),
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2024-02-05',
          ngayKetThuc: '2024-03-15',
          ngayHoanThanh: '2024-03-14',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Đã hoàn thành tất cả API endpoints',
          createdAt: new Date('2024-02-05'),
          updatedAt: new Date('2024-03-14')
        },
        {
          tentask: 'Phát triển Frontend HRM',
          mota: 'Xây dựng giao diện người dùng với React/Next.js cho hệ thống HRM',
          duanId: hrmProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV001'),
          nguoiGiaoId: managerUser2.id,
          ngayBatDau: '2024-02-20',
          ngayKetThuc: '2024-04-10',
          ngayHoanThanh: '2024-04-08',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Đã hoàn thành tất cả modules frontend',
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-04-08')
        }
      );
    }
    
    // Tasks cho dự án E-commerce
    if (ecommerceProjectId) {
      tasks.push(
        {
          tentask: 'Thiết kế UI/UX Website bán hàng',
          mota: 'Thiết kế giao diện người dùng và trải nghiệm sử dụng cho website bán hàng',
          duanId: ecommerceProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DES001'),
          nguoiGiaoId: managerUser2.id,
          ngayBatDau: '2024-02-15',
          ngayKetThuc: '2024-03-15',
          ngayHoanThanh: '2024-03-12',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Đã hoàn thành mockup và prototype',
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-03-12')
        },
        {
          tentask: 'Phát triển Frontend E-commerce',
          mota: 'Xây dựng giao diện website bán hàng với React/Next.js',
          duanId: ecommerceProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV001'),
          nguoiGiaoId: managerUser2.id,
          ngayBatDau: '2024-03-15',
          ngayKetThuc: '2024-06-30',
          ngayHoanThanh: '2024-06-28',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Đã hoàn thành và deploy production',
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-06-28')
        }
      );
    }
    
    // Tasks cho dự án Mobile App
    if (mobileProjectId) {
      tasks.push(
        {
          tentask: 'Thiết kế Database cho Mobile App',
          mota: 'Thiết kế cấu trúc database và API cho ứng dụng mobile',
          duanId: mobileProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV002'),
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2024-09-05',
          ngayKetThuc: '2024-09-20',
          ngayHoanThanh: null,
          trangThai: 'Đang chạy',
          mucDoUuTien: 'high',
          tienDo: 70,
          ghiChu: 'Đang trong giai đoạn tối ưu hóa',
          createdAt: new Date('2024-09-05'),
          updatedAt: new Date()
        },
        {
          tentask: 'Phát triển Backend API Mobile',
          mota: 'Phát triển các API endpoints cho ứng dụng mobile',
          duanId: mobileProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV003'),
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2024-09-20',
          ngayKetThuc: '2024-11-15',
          ngayHoanThanh: null,
          trangThai: 'Đang chạy',
          mucDoUuTien: 'high',
          tienDo: 45,
          ghiChu: 'Đã hoàn thành Authentication và User Management API',
          createdAt: new Date('2024-09-20'),
          updatedAt: new Date()
        },
        {
          tentask: 'Phát triển Mobile App (React Native)',
          mota: 'Xây dựng ứng dụng mobile với React Native',
          duanId: mobileProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV001'),
          nguoiGiaoId: managerUser1.id,
          ngayBatDau: '2024-10-01',
          ngayKetThuc: '2025-01-31',
          ngayHoanThanh: null,
          trangThai: 'Đang chạy',
          mucDoUuTien: 'high',
          tienDo: 30,
          ghiChu: 'Đã hoàn thành UI components và navigation',
          createdAt: new Date('2024-10-01'),
          updatedAt: new Date()
        }
      );
    }
    
    // Tasks cho dự án BI
    if (biProjectId) {
      tasks.push(
        {
          tentask: 'Phân tích yêu cầu hệ thống BI',
          mota: 'Thu thập và phân tích yêu cầu cho hệ thống Business Intelligence',
          duanId: biProjectId,
          nguoiDuocGiaoId: findUserIdByManv('BA001'),
          nguoiGiaoId: managerUser2.id,
          ngayBatDau: '2024-10-05',
          ngayKetThuc: '2024-10-20',
          ngayHoanThanh: '2024-10-18',
          trangThai: 'Hoàn thành',
          mucDoUuTien: 'high',
          tienDo: 100,
          ghiChu: 'Đã hoàn thành tài liệu yêu cầu',
          createdAt: new Date('2024-10-05'),
          updatedAt: new Date('2024-10-18')
        },
        {
          tentask: 'Xây dựng Data Warehouse',
          mota: 'Thiết kế và xây dựng data warehouse cho hệ thống BI',
          duanId: biProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV002'),
          nguoiGiaoId: managerUser2.id,
          ngayBatDau: '2024-10-20',
          ngayKetThuc: '2024-12-15',
          ngayHoanThanh: null,
          trangThai: 'Đang chạy',
          mucDoUuTien: 'high',
          tienDo: 55,
          ghiChu: 'Đang trong giai đoạn ETL development',
          createdAt: new Date('2024-10-20'),
          updatedAt: new Date()
        },
        {
          tentask: 'Phát triển Dashboard BI',
          mota: 'Xây dựng dashboard trực quan cho hệ thống BI',
          duanId: biProjectId,
          nguoiDuocGiaoId: findUserIdByManv('DEV001'),
          nguoiGiaoId: managerUser2.id,
          ngayBatDau: '2024-11-01',
          ngayKetThuc: '2025-02-28',
          ngayHoanThanh: null,
          trangThai: 'Đang chạy',
          mucDoUuTien: 'medium',
          tienDo: 25,
          ghiChu: 'Đã hoàn thành layout và một số charts cơ bản',
          createdAt: new Date('2024-11-01'),
          updatedAt: new Date()
        },
        {
          tentask: 'Testing và QA hệ thống BI',
          mota: 'Kiểm thử chất lượng và sửa lỗi hệ thống BI',
          duanId: biProjectId,
          nguoiDuocGiaoId: findUserIdByManv('QA001'),
          nguoiGiaoId: managerUser2.id,
          ngayBatDau: '2025-01-15',
          ngayKetThuc: '2025-03-15',
          ngayHoanThanh: null,
          trangThai: 'Chưa bắt đầu',
          mucDoUuTien: 'high',
          tienDo: 0,
          ghiChu: 'Chuẩn bị test cases và test data',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15')
        }
      );
    }
    
    if (tasks.length > 0) {
      await queryInterface.bulkInsert('Tasks', tasks);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tasks', null, {});
  }
};