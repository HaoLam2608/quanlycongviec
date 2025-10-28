const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy danh sách group và dự án (duan)
        const groups = await queryInterface.sequelize.query(
            "SELECT id, name FROM `Groups`",
            { type: QueryTypes.SELECT }
        );
        const duans = await queryInterface.sequelize.query(
            "SELECT id, tenduan FROM `DuAns`",
            { type: QueryTypes.SELECT }
        );
        // Ghép từng group với một dự án khác nhau (nếu có)
        const now = new Date();
        const groupProjects = [];
        for (let i = 0; i < Math.min(groups.length, duans.length); i++) {
            groupProjects.push({
                groupId: groups[i].id,
                projectId: duans[i].id,
                status: 'active',
                createdAt: now,
                updatedAt: now
            });
        }
        // Nếu còn group hoặc duan dư, ghép ngẫu nhiên
        if (groups.length > duans.length) {
            for (let i = duans.length; i < groups.length; i++) {
                groupProjects.push({
                    groupId: groups[i].id,
                    projectId: duans[Math.floor(Math.random() * duans.length)].id,
                    status: 'active',
                    createdAt: now,
                    updatedAt: now
                });
            }
        } else if (duans.length > groups.length) {
            for (let i = groups.length; i < duans.length; i++) {
                groupProjects.push({
                    groupId: groups[Math.floor(Math.random() * groups.length)].id,
                    projectId: duans[i].id,
                    status: 'active',
                    createdAt: now,
                    updatedAt: now
                });
            }
        }
        if (groupProjects.length > 0) {
            await queryInterface.bulkInsert('group_projects', groupProjects);
        }
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('group_projects', null, {});
    }
};
