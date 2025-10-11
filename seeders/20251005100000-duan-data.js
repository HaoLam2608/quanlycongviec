'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tạo dữ liệu dự án mẫu
    await queryInterface.bulkInsert('DuAns', [
      // Dự án đã hoàn thành
      {
        tenduan: 'Hệ thống quản lý nhân sự HRM',
        mota: 'Phát triển hệ thống quản lý nhân sự toàn diện bao gồm: chấm công, tính lương, quản lý nghỉ phép, đánh giá nhân viên và báo cáo nhân sự.',
        ngaybatdau: new Date('2024-01-15'),
        ngayketthuc: new Date('2024-06-30'),
        status: 'da_hoan_thanh',
        userId: 2, // Trần Thành Đạt (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenduan: 'Website bán hàng trực tuyến',
        mota: 'Xây dựng website thương mại điện tử với đầy đủ tính năng: quản lý sản phẩm, giỏ hàng, thanh toán online, quản lý đơn hàng và hệ thống CRM.',
        ngaybatdau: new Date('2024-02-01'),
        ngayketthuc: new Date('2024-08-15'),
        status: 'da_hoan_thanh',
        userId: 3, // Lê Thị Hoài Thu (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dự án đang thực hiện
      {
        tenduan: 'Ứng dụng mobile quản lý công việc',
        mota: 'Phát triển ứng dụng di động cho việc quản lý công việc cá nhân và nhóm, tích hợp với các công cụ collaboration như Slack, Teams.',
        ngaybatdau: new Date('2024-09-01'),
        ngayketthuc: new Date('2025-02-28'),
        status: 'dang_chay',
        userId: 2, // Trần Thành Đạt (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenduan: 'Hệ thống Business Intelligence',
        mota: 'Xây dựng hệ thống phân tích dữ liệu kinh doanh với dashboard trực quan, báo cáo tự động và công cụ dự đoán xu hướng.',
        ngaybatdau: new Date('2024-10-01'),
        ngayketthuc: new Date('2025-04-30'),
        status: 'dang_chay',
        userId: 3, // Lê Thị Hoài Thu (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenduan: 'Nâng cấp hệ thống bảo mật',
        mota: 'Triển khai các biện pháp bảo mật nâng cao: multi-factor authentication, mã hóa dữ liệu, monitoring và logging hệ thống.',
        ngaybatdau: new Date('2024-11-01'),
        ngayketthuc: new Date('2025-01-31'),
        status: 'dang_chay',
        userId: 2, // Trần Thành Đạt (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dự án sắp bắt đầu
      {
        tenduan: 'Hệ thống ERP tích hợp',
        mota: 'Phát triển hệ thống hoạch định tài nguyên doanh nghiệp tích hợp các module: kế toán, kho vận, bán hàng, mua hàng và sản xuất.',
        ngaybatdau: new Date('2025-01-15'),
        ngayketthuc: new Date('2025-10-31'),
        status: 'chua_bat_dau',
        userId: 3, // Lê Thị Hoài Thu (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenduan: 'Ứng dụng IoT giám sát nhà máy',
        mota: 'Xây dựng hệ thống IoT để giám sát các thông số vận hành nhà máy: nhiệt độ, độ ẩm, năng lượng tiêu thụ và cảnh báo sự cố.',
        ngaybatdau: new Date('2025-02-01'),
        ngayketthuc: new Date('2025-07-31'),
        status: 'chua_bat_dau',
        userId: 2, // Trần Thành Đạt (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenduan: 'Chatbot AI hỗ trợ khách hàng',
        mota: 'Phát triển chatbot thông minh sử dụng AI/ML để hỗ trợ khách hàng 24/7, tích hợp với website và các kênh social media.',
        ngaybatdau: new Date('2025-03-01'),
        ngayketthuc: new Date('2025-06-30'),
        status: 'chua_bat_dau',
        userId: 3, // Lê Thị Hoài Thu (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dự án nghiên cứu
      {
        tenduan: 'Nghiên cứu Blockchain trong logistics',
        mota: 'Nghiên cứu và triển khai thí điểm công nghệ Blockchain để theo dõi chuỗi cung ứng và đảm bảo tính minh bạch trong logistics.',
        ngaybatdau: new Date('2025-04-01'),
        ngayketthuc: new Date('2025-12-31'),
        status: 'chua_bat_dau',
        userId: 2, // Trần Thành Đạt (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenduan: 'Platform học tập trực tuyến',
        mota: 'Xây dựng nền tảng e-learning với các tính năng: quản lý khóa học, video streaming, quiz tương tác, forum thảo luận và chứng chỉ số.',
        ngaybatdau: new Date('2025-05-01'),
        ngayketthuc: new Date('2025-11-30'),
        status: 'chua_bat_dau',
        userId: 3, // Lê Thị Hoài Thu (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Dự án tạm dừng
      {
        tenduan: 'Hệ thống quản lý tài liệu điện tử',
        mota: 'Phát triển hệ thống quản lý tài liệu với tính năng scan, OCR, workflow phê duyệt và lưu trữ cloud. Tạm dừng do thay đổi yêu cầu.',
        ngaybatdau: new Date('2024-07-01'),
        ngayketthuc: new Date('2025-03-31'),
        status: 'tam_dung',
        userId: 2, // Trần Thành Đạt (Manager)
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('DuAns', null, {});
  }
};