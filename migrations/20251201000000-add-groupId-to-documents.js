'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Documents', 'groupId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Groups',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Documents', 'groupId');
    }
    // Migration đã được loại bỏ vì không cần cột groupId nữa.
    // Nếu cần giữ lịch sử, hãy để file này rỗng hoặc chỉ xuất ra thông báo.
    };
