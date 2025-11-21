'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('DeviceTokens', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            expoPushToken: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            },
            deviceId: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            platform: {
                type: Sequelize.STRING(50),
                allowNull: true,
                comment: 'ios, android, web'
            },
            deviceModel: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            },
            lastActive: {
                type: Sequelize.DATE,
                allowNull: true
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Add index for faster queries
        await queryInterface.addIndex('DeviceTokens', ['userId']);
        await queryInterface.addIndex('DeviceTokens', ['expoPushToken']);
        await queryInterface.addIndex('DeviceTokens', ['isActive']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('DeviceTokens');
    }
};
