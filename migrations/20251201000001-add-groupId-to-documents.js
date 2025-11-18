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
};
