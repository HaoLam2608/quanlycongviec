const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        const duans = await queryInterface.sequelize.query(
            "SELECT id, tenduan FROM DuAns",
            { type: QueryTypes.SELECT }
        );
        const users = await queryInterface.sequelize.query(
            "SELECT id, manv, hoten FROM Users",
            { type: QueryTypes.SELECT }
        );
        function findDuanIdByName(name) {
            const d = duans.find(x => x.tenduan === name);
            return d ? d.id : null;
        }
        function findUserIdByManv(manv) {
            const u = users.find(x => x.manv === manv);
            return u ? u.id : null;
        }
        const groups = [
            { name: 'Frontend Development Team', description: 'Nhóm phát triển giao diện người dùng, chuyên về React, Vue.js, Angular', duanId: findDuanIdByName('Hệ thống quản lý nhân sự HRM'), leaderId: findUserIdByManv('QLY002'), createdAt: new Date(), updatedAt: new Date() },
            { name: 'Backend Development Team', description: 'Nhóm phát triển backend, API, database và server-side logic', duanId: findDuanIdByName('Hệ thống quản lý nhân sự HRM'), leaderId: findUserIdByManv('QLY001'), createdAt: new Date(), updatedAt: new Date() },
            { name: 'UI/UX Design Team', description: 'Nhóm thiết kế giao diện và trải nghiệm người dùng', duanId: findDuanIdByName('Website bán hàng trực tuyến'), leaderId: findUserIdByManv('DES001'), createdAt: new Date(), updatedAt: new Date() },
            { name: 'DevOps & Infrastructure', description: 'Nhóm quản lý hạ tầng, deployment và CI/CD', duanId: findDuanIdByName('Ứng dụng mobile quản lý công việc'), leaderId: findUserIdByManv('DEV003'), createdAt: new Date(), updatedAt: new Date() },
            { name: 'Quality Assurance Team', description: 'Nhóm kiểm tra chất lượng phần mềm và testing', duanId: findDuanIdByName('Hệ thống Business Intelligence'), leaderId: findUserIdByManv('QA001'), createdAt: new Date(), updatedAt: new Date() },
            { name: 'Product Management', description: 'Nhóm quản lý sản phẩm và phân tích yêu cầu', duanId: findDuanIdByName('Nâng cấp hệ thống bảo mật'), leaderId: findUserIdByManv('BA001'), createdAt: new Date(), updatedAt: new Date() }
        ];
        const filtered = groups.filter(g => g.duanId && g.leaderId);
        await queryInterface.bulkInsert('Groups', filtered);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Groups', null, {});
    }
};
