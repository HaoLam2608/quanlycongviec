'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy danh sách dự án và users
        const duans = await queryInterface.sequelize.query(
            "SELECT id, tenduan FROM DuAns",
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

        const findUserIdByManv = (manv) => {
            const u = users.find(x => x.manv === manv);
            return u ? u.id : null;
        };

        const now = new Date();
        const documents = [
            {
                filename: 'spec-hrm-system.pdf',
                originalname: 'Đặc tả yêu cầu hệ thống HRM.pdf',
                mimetype: 'application/pdf',
                size: 2048576, // 2MB
                duanId: findDuanIdByName('Hệ thống quản lý nhân sự HRM'),
                userId: findUserIdByManv('BA001'),
                description: 'Tài liệu đặc tả yêu cầu chi tiết cho hệ thống quản lý nhân sự',
                createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 ngày trước
                updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            },
            {
                filename: 'database-design-hrm.sql',
                originalname: 'Thiết kế database HRM.sql',
                mimetype: 'application/sql',
                size: 512000, // 500KB
                duanId: findDuanIdByName('Hệ thống quản lý nhân sự HRM'),
                userId: findUserIdByManv('DEV002'),
                description: 'File SQL chứa schema database cho hệ thống HRM',
                createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 ngày trước
                updatedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)
            },
            {
                filename: 'ui-mockup-ecommerce.fig',
                originalname: 'Mockup UI Website bán hàng.fig',
                mimetype: 'application/octet-stream',
                size: 5242880, // 5MB
                duanId: findDuanIdByName('Website bán hàng trực tuyến'),
                userId: findUserIdByManv('DES001'),
                description: 'File Figma chứa mockup giao diện cho website bán hàng',
                createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 ngày trước
                updatedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000)
            },
            {
                filename: 'api-documentation-mobile-app.json',
                originalname: 'Tài liệu API ứng dụng mobile.json',
                mimetype: 'application/json',
                size: 1024000, // 1MB
                duanId: findDuanIdByName('Ứng dụng mobile quản lý công việc'),
                userId: findUserIdByManv('DEV003'),
                description: 'Tài liệu API endpoints cho ứng dụng mobile quản lý công việc',
                createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 ngày trước
                updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                filename: 'bi-system-requirements.docx',
                originalname: 'Yêu cầu hệ thống Business Intelligence.docx',
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 1536000, // 1.5MB
                duanId: findDuanIdByName('Hệ thống Business Intelligence'),
                userId: findUserIdByManv('BA001'),
                description: 'Tài liệu yêu cầu chi tiết cho hệ thống BI',
                createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 ngày trước
                updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                filename: 'security-audit-report.pdf',
                originalname: 'Báo cáo kiểm tra bảo mật.pdf',
                mimetype: 'application/pdf',
                size: 3072000, // 3MB
                duanId: findDuanIdByName('Nâng cấp hệ thống bảo mật'),
                userId: findUserIdByManv('SUP001'),
                description: 'Báo cáo kết quả kiểm tra bảo mật hệ thống',
                createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 ngày trước
                updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                filename: 'test-plan-qa.xlsx',
                originalname: 'Kế hoạch kiểm thử QA.xlsx',
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                size: 768000, // 750KB
                duanId: findDuanIdByName('Hệ thống quản lý nhân sự HRM'),
                userId: findUserIdByManv('QA001'),
                description: 'Kế hoạch chi tiết các test cases cho hệ thống HRM',
                createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 ngày trước
                updatedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000)
            }
        ];

        // Lọc documents hợp lệ (có duanId và userId)
        const valid = documents.filter(d => d.duanId && d.userId);
        if (valid.length > 0) {
            await queryInterface.bulkInsert('Documents', valid);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Documents', null, {});
    }
};


