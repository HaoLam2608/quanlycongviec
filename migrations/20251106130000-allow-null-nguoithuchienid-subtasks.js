'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('Subtasks', 'nguoiThucHienId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('Subtasks', 'nguoiThucHienId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' }
        });
    }
};