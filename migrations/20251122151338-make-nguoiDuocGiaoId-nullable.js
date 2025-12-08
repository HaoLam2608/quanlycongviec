'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Make nguoiDuocGiaoId nullable on table `tasks` and (re)create FK to `users.id`
        // Note: table names are lowercase as defined in model `Task` (tableName: 'tasks') and `User` (tableName: 'users')
        // Some MySQL setups require dropping the old FK constraint before changing column nullability

        // Attempt to drop existing FK constraint if present
        // The constraint name can vary; try a few common names safely (errors will be ignored)
        const constraintNames = [
            'tasks_nguoiDuocGiaoId_fkey',
            'tasks_nguoiDuocGiaoId_fk',
            'tasks_nguoiDuocGiaoId_foreign',
            'tasks_nguoiDuocGiaoId_users_fk'
        ];
        for (const name of constraintNames) {
            try {
                await queryInterface.removeConstraint('tasks', name);
            } catch (_) {
                // ignore if constraint name doesn't exist
            }
        }

        // Change column to allow NULL (without FK for now)
        await queryInterface.changeColumn('tasks', 'nguoiDuocGiaoId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'ID người được giao nhiệm vụ chính (tùy chọn - để null nếu để member tự nhận)'
        });

        // Re-add proper foreign key constraint referencing `users(id)` with SET NULL on delete
        await queryInterface.addConstraint('tasks', {
            fields: ['nguoiDuocGiaoId'],
            type: 'foreign key',
            name: 'tasks_nguoiDuocGiaoId_users_fk',
            references: {
                table: 'users',
                field: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert: drop FK, make column NOT NULL, then re-add FK with CASCADE delete
        try {
            await queryInterface.removeConstraint('tasks', 'tasks_nguoiDuocGiaoId_users_fk');
        } catch (_) {}

        await queryInterface.changeColumn('tasks', 'nguoiDuocGiaoId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'ID người được giao nhiệm vụ chính'
        });

        await queryInterface.addConstraint('tasks', {
            fields: ['nguoiDuocGiaoId'],
            type: 'foreign key',
            name: 'tasks_nguoiDuocGiaoId_users_fk',
            references: {
                table: 'users',
                field: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    }
};
