'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy danh sách dự án, groups và users
        const duans = await queryInterface.sequelize.query(
            "SELECT id, tenduan FROM DuAns",
            { type: QueryTypes.SELECT }
        );
        const groups = await queryInterface.sequelize.query(
            "SELECT id, name FROM `Groups`",
            { type: QueryTypes.SELECT }
        );
        const users = await queryInterface.sequelize.query(
            "SELECT id, manv, hoten FROM Users",
            { type: QueryTypes.SELECT }
        );

        const findDuanIdByName = (name) => {
            const d = duans.find(x => x.tenduan === name);
            return d ? d.id : null;
        };

        const findGroupIdByName = (name) => {
            const g = groups.find(x => x.name === name);
            return g ? g.id : null;
        };

        const findUserIdByManv = (manv) => {
            const u = users.find(x => x.manv === manv);
            return u ? u.id : null;
        };

        const now = new Date();
        const reports = [
            {
                duanId: findDuanIdByName('Hệ thống quản lý nhân sự HRM'),
                groupId: findGroupIdByName('Frontend Development Team'),
                title: 'Báo cáo tiến độ tuần 1 - Module Frontend',
                content: 'Trong tuần qua, nhóm Frontend đã hoàn thành:\n- Thiết kế và implement giao diện dashboard\n- Xây dựng component quản lý nhân viên\n- Tích hợp API authentication\n- Hoàn thành 80% module quản lý chấm công\n\nVấn đề gặp phải:\n- Cần tối ưu performance khi load danh sách nhân viên lớn\n- Một số API endpoint chưa sẵn sàng\n\nKế hoạch tuần tới:\n- Hoàn thành module chấm công\n- Bắt đầu module tính lương\n- Tối ưu performance',
                reportType: 'tien_do',
                status: 'approved',
                reportDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
                createdBy: findUserIdByManv('QLY002'),
                reviewedBy: findUserIdByManv('QLY001'),
                reviewedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
                reviewNote: 'Tiến độ tốt, tiếp tục phát triển theo kế hoạch',
                statistics: JSON.stringify({
                    tasksCompleted: 12,
                    tasksInProgress: 5,
                    tasksPending: 3,
                    hoursSpent: 120,
                    issuesFound: 2,
                    issuesResolved: 1
                }),
                attachments: JSON.stringify([
                    { filename: 'screenshot-dashboard.png', type: 'image' },
                    { filename: 'progress-chart.xlsx', type: 'document' }
                ]),
                createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
            },
            {
                duanId: findDuanIdByName('Website bán hàng trực tuyến'),
                groupId: findGroupIdByName('UI/UX Design Team'),
                title: 'Báo cáo thiết kế UI/UX - Giai đoạn 1',
                content: 'Nhóm UI/UX đã hoàn thành:\n- Thiết kế wireframe cho toàn bộ website\n- Xây dựng design system với color palette và typography\n- Hoàn thành mockup cho trang chủ và trang sản phẩm\n- Tạo prototype tương tác cho flow mua hàng\n\nPhản hồi từ khách hàng:\n- Đồng ý với hướng thiết kế tổng thể\n- Yêu cầu điều chỉnh màu sắc theo brand guideline\n- Cần thêm animation cho các tương tác\n\nKế hoạch tiếp theo:\n- Điều chỉnh design theo feedback\n- Hoàn thành mockup các trang còn lại\n- Chuẩn bị assets cho development',
                reportType: 'tien_do',
                status: 'submitted',
                reportDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 ngày trước
                createdBy: findUserIdByManv('DES001'),
                reviewedBy: null,
                reviewedAt: null,
                reviewNote: null,
                statistics: JSON.stringify({
                    pagesDesigned: 8,
                    componentsCreated: 45,
                    revisions: 3,
                    hoursSpent: 80
                }),
                attachments: JSON.stringify([
                    { filename: 'design-system.pdf', type: 'document' },
                    { filename: 'wireframes.fig', type: 'design' }
                ]),
                createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                duanId: findDuanIdByName('Ứng dụng mobile quản lý công việc'),
                groupId: findGroupIdByName('DevOps & Infrastructure'),
                title: 'Báo cáo vấn đề - Lỗi deployment',
                content: 'Vấn đề phát sinh:\n- Lỗi khi deploy ứng dụng lên production server\n- Database connection timeout khi có nhiều request đồng thời\n- Memory leak trong background service\n\nNguyên nhân:\n- Cấu hình database connection pool chưa tối ưu\n- Background service không giải phóng memory sau khi xử lý\n- Server không đủ tài nguyên khi có traffic cao\n\nGiải pháp đã áp dụng:\n- Tăng connection pool size và timeout\n- Fix memory leak trong background service\n- Scale up server resources\n\nKết quả:\n- Đã giải quyết được vấn đề connection timeout\n- Memory usage đã ổn định\n- Cần monitor thêm trong 24h tiếp theo',
                reportType: 'van_de',
                status: 'reviewed',
                reportDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
                createdBy: findUserIdByManv('DEV003'),
                reviewedBy: findUserIdByManv('QLY001'),
                reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                reviewNote: 'Đã xác nhận vấn đề đã được giải quyết. Tiếp tục monitor hệ thống.',
                statistics: JSON.stringify({
                    issuesReported: 3,
                    issuesResolved: 3,
                    downtime: 2, // hours
                    affectedUsers: 150
                }),
                attachments: JSON.stringify([
                    { filename: 'error-logs.txt', type: 'log' },
                    { filename: 'server-metrics.png', type: 'image' }
                ]),
                createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                duanId: findDuanIdByName('Hệ thống Business Intelligence'),
                groupId: findGroupIdByName('Quality Assurance Team'),
                title: 'Báo cáo hoàn thành - Module Testing',
                content: 'Nhóm QA đã hoàn thành:\n- Viết và thực thi 150 test cases\n- Phát hiện và báo cáo 25 bugs\n- Đã verify fix cho 20 bugs\n- Còn 5 bugs đang chờ fix từ development team\n\nKết quả test:\n- Unit tests: 95% pass rate\n- Integration tests: 88% pass rate\n- E2E tests: 82% pass rate\n\nĐánh giá chất lượng:\n- Code coverage đạt 85%\n- Performance test đạt yêu cầu\n- Security scan không phát hiện lỗ hổng nghiêm trọng\n\nKhuyến nghị:\n- Cần fix 5 bugs còn lại trước khi release\n- Cải thiện E2E test coverage\n- Bổ sung performance test cho các module quan trọng',
                reportType: 'hoan_thanh',
                status: 'approved',
                reportDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 ngày trước
                createdBy: findUserIdByManv('QA001'),
                reviewedBy: findUserIdByManv('QLY002'),
                reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                reviewNote: 'Chất lượng test tốt. Yêu cầu development team fix các bugs còn lại.',
                statistics: JSON.stringify({
                    testCasesTotal: 150,
                    testCasesPassed: 135,
                    testCasesFailed: 15,
                    bugsFound: 25,
                    bugsFixed: 20,
                    bugsPending: 5,
                    codeCoverage: 85
                }),
                attachments: JSON.stringify([
                    { filename: 'test-report.pdf', type: 'document' },
                    { filename: 'bug-list.xlsx', type: 'document' }
                ]),
                createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                duanId: findDuanIdByName('Nâng cấp hệ thống bảo mật'),
                groupId: null, // Báo cáo cấp dự án, không theo nhóm
                title: 'Báo cáo tổng kết - Giai đoạn 1',
                content: 'Tổng kết giai đoạn 1 của dự án nâng cấp bảo mật:\n\nĐã hoàn thành:\n- Audit toàn bộ hệ thống hiện tại\n- Phát hiện 10 lỗ hổng bảo mật (3 critical, 4 high, 3 medium)\n- Đã patch 7 lỗ hổng (3 critical, 4 high)\n- Triển khai multi-factor authentication\n- Cập nhật encryption cho dữ liệu nhạy cảm\n\nTiến độ:\n- Hoàn thành 70% giai đoạn 1\n- Đúng tiến độ theo kế hoạch\n\nVấn đề:\n- 3 lỗ hổng medium cần thời gian để fix an toàn\n- Cần downtime để apply một số patches\n\nKế hoạch giai đoạn 2:\n- Hoàn thành fix các lỗ hổng còn lại\n- Triển khai security monitoring\n- Training cho team về security best practices',
                reportType: 'tong_ket',
                status: 'draft',
                reportDate: now,
                createdBy: findUserIdByManv('SUP001'),
                reviewedBy: null,
                reviewedAt: null,
                reviewNote: null,
                statistics: JSON.stringify({
                    vulnerabilitiesFound: 10,
                    vulnerabilitiesFixed: 7,
                    vulnerabilitiesPending: 3,
                    securityScoreBefore: 65,
                    securityScoreAfter: 85,
                    hoursSpent: 200
                }),
                attachments: JSON.stringify([
                    { filename: 'security-audit-report.pdf', type: 'document' },
                    { filename: 'vulnerability-list.xlsx', type: 'document' }
                ]),
                createdAt: now,
                updatedAt: now
            }
        ];

        // Lọc reports hợp lệ (có duanId và createdBy)
        const valid = reports.filter(r => r.duanId && r.createdBy);
        if (valid.length > 0) {
            await queryInterface.bulkInsert('Reports', valid);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Reports', null, {});
    }
};
