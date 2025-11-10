'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Assignments', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            taskId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'Tasks', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            subtaskId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'Subtasks', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            managerId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Users', key: 'id' }
            },
            assigneeId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Users', key: 'id' }
            },
            status: {
                type: Sequelize.ENUM('pending', 'accepted', 'declined'),
                allowNull: false,
                defaultValue: 'pending'
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Assignments');
    // Dòng dưới chỉ dùng cho PostgreSQL, MySQL không cần:
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Assignments_status";');
    }
};
