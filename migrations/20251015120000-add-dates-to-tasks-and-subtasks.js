'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add columns to Tasks
        const tableTasks = await queryInterface.describeTable('Tasks').catch(() => null);
        if (tableTasks) {
            if (!tableTasks.ngayBatDau) {
                await queryInterface.addColumn('Tasks', 'ngayBatDau', {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: 'Ngày bắt đầu dự án'
                });
            }
            if (!tableTasks.ngayKetThuc) {
                await queryInterface.addColumn('Tasks', 'ngayKetThuc', {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: 'Ngày kết thúc dự kiến'
                });
            }
        }

        // Add columns to Subtasks
        const tableSubtasks = await queryInterface.describeTable('Subtasks').catch(() => null);
        if (tableSubtasks) {
            if (!tableSubtasks.ngayBatDau) {
                await queryInterface.addColumn('Subtasks', 'ngayBatDau', {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: 'Ngày bắt đầu công việc nhỏ'
                });
            }
            if (!tableSubtasks.ngayKetThuc) {
                await queryInterface.addColumn('Subtasks', 'ngayKetThuc', {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: 'Ngày kết thúc dự kiến công việc nhỏ'
                });
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove columns from Subtasks
        const tableSubtasks = await queryInterface.describeTable('Subtasks').catch(() => null);
        if (tableSubtasks) {
            if (tableSubtasks.ngayBatDau) {
                await queryInterface.removeColumn('Subtasks', 'ngayBatDau');
            }
            if (tableSubtasks.ngayKetThuc) {
                await queryInterface.removeColumn('Subtasks', 'ngayKetThuc');
            }
        }

        // Remove columns from Tasks
        const tableTasks = await queryInterface.describeTable('Tasks').catch(() => null);
        if (tableTasks) {
            if (tableTasks.ngayBatDau) {
                await queryInterface.removeColumn('Tasks', 'ngayBatDau');
            }
            if (tableTasks.ngayKetThuc) {
                await queryInterface.removeColumn('Tasks', 'ngayKetThuc');
            }
        }
    }
};
