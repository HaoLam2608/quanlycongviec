'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Make nguoiDuocGiaoId nullable to allow tasks without immediate assignment
        // Tasks can be created without assigning to anyone, allowing team members to self-accept via Assignment
        await queryInterface.changeColumn('Tasks', 'nguoiDuocGiaoId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'ID người được giao nhiệm vụ chính (tùy chọn - để null nếu để member tự nhận)'
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert back to not null
        await queryInterface.changeColumn('Tasks', 'nguoiDuocGiaoId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'ID người được giao nhiệm vụ chính'
        });
    }
};
