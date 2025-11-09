'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Users', 'email', {
            type: Sequelize.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'email');
    }
};