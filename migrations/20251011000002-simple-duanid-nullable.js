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
        // Set giá trị mặc định cho các dòng NULL trước khi đặt NOT NULL
        await queryInterface.sequelize.query(
            'UPDATE `Groups` SET duanId = 0 WHERE duanId IS NULL'
        );
        // Cập nhật column thành not null
        await queryInterface.changeColumn('Groups', 'duanId', {
            type: Sequelize.INTEGER,
            allowNull: false
        });
    }
};