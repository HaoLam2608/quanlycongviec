'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Cập nhật column thành nullable
        await queryInterface.changeColumn('Groups', 'duanId', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        // Cập nhật column thành not null
        await queryInterface.changeColumn('Groups', 'duanId', {
            type: Sequelize.INTEGER,
            allowNull: false
        });
    }
};