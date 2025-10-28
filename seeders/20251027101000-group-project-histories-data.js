const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy danh sách group và dự án (duan)
        const groups = await queryInterface.sequelize.query(
            "SELECT id FROM `Groups`",
            { type: QueryTypes.SELECT }
        );
        const duans = await queryInterface.sequelize.query(
            "SELECT id FROM `DuAns`",
            { type: QueryTypes.SELECT }
        );
        const now = new Date();
        // Tạo lịch sử cho mỗi group tham gia 1 dự án
        const histories = [];
        for (let i = 0; i < Math.min(groups.length, duans.length); i++) {
            histories.push({
                groupId: groups[i].id,
                duanId: duans[i].id,
                status: 'dang_tham_gia',
                joinedAt: now,
                completedAt: null,
                createdAt: now,
                updatedAt: now
            });
        }
        if (histories.length > 0) {
            await queryInterface.bulkInsert('GroupProjectHistories', histories);
        }
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('GroupProjectHistories', null, {});
    }
};
