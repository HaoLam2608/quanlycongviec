"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Users', 'avatarData', {
            type: Sequelize.BLOB('long'),
            allowNull: true,
        });
        await queryInterface.addColumn('Users', 'avatarMime', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'avatarData');
        await queryInterface.removeColumn('Users', 'avatarMime');
    }
};
