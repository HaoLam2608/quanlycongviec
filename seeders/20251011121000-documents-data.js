'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy dữ liệu users và projects để tham chiếu
    const users = await queryInterface.sequelize.query(
      'SELECT id, manv, hoten FROM Users',
      { type: QueryTypes.SELECT }
    );

    const duans = await queryInterface.sequelize.query(
      'SELECT id, tenduan FROM DuAns',
      { type: QueryTypes.SELECT }
    );

    if (users.length === 0 || duans.length === 0) {
      console.log('Cần có users và dự án để tạo documents');
      return;
    }

    const getUser = (manv) => {
      const u = users.find(u => u.manv === manv);
      return u ? u.id : users[0].id;
    };

    const getDuan = (tenduan) => {
      const d = duans.find(d => d.tenduan === tenduan);
      return d ? d.id : duans[0].id;
    };

    const now = new Date();

    const documents = [
      {
        filename: 'requirements-specification.pdf',
        originalname: 'Tài liệu đặc tả yêu cầu.pdf',
        mimetype: 'application/pdf',
        size: 2048576, // 2MB
        duanId: getDuan('Hệ thống quản lý nhân sự HRM'),
        userId: getUser('BA001'),
        description: 'Tài liệu đặc tả chi tiết các yêu cầu chức năng và phi chức năng của hệ thống HRM',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        filename: 'database-design.docx',
        originalname: 'Thiết kế cơ sở dữ liệu.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1536000, // 1.5MB
        duanId: getDuan('Hệ thống quản lý nhân sự HRM'),
        userId: getUser('DEV002'),
        description: 'Tài liệu mô tả cấu trúc database, ERD và các bảng dữ liệu',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        filename: 'api-documentation.pdf',
        originalname: 'Tài liệu API.pdf',
        mimetype: 'application/pdf',
        size: 3072000, // 3MB
        duanId: getDuan('Website bán hàng trực tuyến'),
        userId: getUser('DEV002'),
        description: 'Tài liệu mô tả các API endpoints, request/response format',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10')
      },
      {
        filename: 'ui-design-mockup.fig',
        originalname: 'Thiết kế giao diện.fig',
        mimetype: 'application/octet-stream',
        size: 5120000, // 5MB
        duanId: getDuan('Website bán hàng trực tuyến'),
        userId: getUser('DES001'),
        description: 'File thiết kế giao diện người dùng với Figma',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20')
      },
      {
        filename: 'test-plan.xlsx',
        originalname: 'Kế hoạch kiểm thử.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024000, // 1MB
        duanId: getDuan('Ứng dụng mobile quản lý công việc'),
        userId: getUser('QA001'),
        description: 'Kế hoạch kiểm thử chi tiết các test cases và test scenarios',
        createdAt: new Date('2024-09-15'),
        updatedAt: new Date('2024-09-15')
      },
      {
        filename: 'project-proposal.pptx',
        originalname: 'Đề xuất dự án.pptx',
        mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 4096000, // 4MB
        duanId: getDuan('Hệ thống Business Intelligence'),
        userId: getUser('QLY001'),
        description: 'Đề xuất dự án Business Intelligence với các tính năng và mục tiêu',
        createdAt: new Date('2024-09-25'),
        updatedAt: new Date('2024-09-25')
      },
      {
        filename: 'security-audit-report.pdf',
        originalname: 'Báo cáo kiểm tra bảo mật.pdf',
        mimetype: 'application/pdf',
        size: 2560000, // 2.5MB
        duanId: getDuan('Nâng cấp hệ thống bảo mật'),
        userId: getUser('SUP001'),
        description: 'Báo cáo đánh giá bảo mật hệ thống và các khuyến nghị',
        createdAt: new Date('2024-11-10'),
        updatedAt: new Date('2024-11-10')
      },
      {
        filename: 'deployment-guide.md',
        originalname: 'Hướng dẫn triển khai.md',
        mimetype: 'text/markdown',
        size: 51200, // 50KB
        duanId: getDuan('Ứng dụng mobile quản lý công việc'),
        userId: getUser('DEV003'),
        description: 'Hướng dẫn chi tiết quy trình deploy ứng dụng lên production',
        createdAt: new Date('2024-10-05'),
        updatedAt: new Date('2024-10-05')
      },
      {
        filename: 'user-manual.pdf',
        originalname: 'Hướng dẫn sử dụng.pdf',
        mimetype: 'application/pdf',
        size: 3584000, // 3.5MB
        duanId: getDuan('Hệ thống quản lý nhân sự HRM'),
        userId: getUser('BA001'),
        description: 'Tài liệu hướng dẫn người dùng cuối sử dụng hệ thống',
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15')
      },
      {
        filename: 'meeting-notes-2024-11-15.docx',
        originalname: 'Biên bản họp 15-11-2024.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 76800, // 75KB
        duanId: null, // Document không thuộc dự án cụ thể
        userId: getUser('QLY002'),
        description: 'Biên bản cuộc họp đánh giá tiến độ dự án tháng 11/2024',
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-11-15')
      }
    ];

    // Lọc documents hợp lệ
    const validDocs = documents.filter(d => d.userId);

    if (validDocs.length > 0) {
      await queryInterface.bulkInsert('Documents', validDocs);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Documents', null, {});
  }
};



