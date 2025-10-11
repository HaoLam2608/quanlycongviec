'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('GroupProjectHistories', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            groupId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Groups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            duanId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'DuAns',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            status: {
                type: Sequelize.ENUM('dang_tham_gia', 'hoan_thanh', 'da_dung'),
                allowNull: false,
                defaultValue: 'dang_tham_gia'
            },
            joinedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            completedAt: {
                allowNull: true,
                type: Sequelize.DATE
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });

        // Tạo index để tăng performance
        await queryInterface.addIndex('GroupProjectHistories', ['groupId']);
        await queryInterface.addIndex('GroupProjectHistories', ['duanId']);
        await queryInterface.addIndex('GroupProjectHistories', ['status']);

        // Unique constraint để tránh trùng lặp
        await queryInterface.addIndex('GroupProjectHistories', ['groupId', 'duanId'], {
            unique: true,
            name: 'unique_group_project'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('GroupProjectHistories');
    }
};