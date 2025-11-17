"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {

        // If the Worklogs table doesn't exist (e.g. migrations run in a different order),
        // skip this migration instead of failing. This makes the migration idempotent
        // and safer to run against databases in various states.
        try {
            await queryInterface.describeTable('Worklogs');
        } catch (err) {
            // Table missing - nothing to alter
            // eslint-disable-next-line no-console
            console.warn('Worklogs table not found, skipping allow-null-taskid-subtaskid-worklogs migration');
            return;
        }

        // Drop existing foreign keys on task_id and subtask_id to avoid constraint conflicts
        const [existingTaskFks] = await queryInterface.sequelize.query(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Worklogs' AND COLUMN_NAME = 'task_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
        );
        if (existingTaskFks && existingTaskFks.length) {
            for (const fk of existingTaskFks) {
                await queryInterface.sequelize.query(`ALTER TABLE \`Worklogs\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            }
        }

        const [existingSubFks] = await queryInterface.sequelize.query(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Worklogs' AND COLUMN_NAME = 'subtask_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
        );
        if (existingSubFks && existingSubFks.length) {
            for (const fk of existingSubFks) {
                await queryInterface.sequelize.query(`ALTER TABLE \`Worklogs\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            }
        }

        // Alter columns to allow NULL where desired
        await queryInterface.changeColumn('Worklogs', 'task_id', {
            type: Sequelize.INTEGER,
            allowNull: true
        });

        await queryInterface.changeColumn('Worklogs', 'subtask_id', {
            type: Sequelize.INTEGER,
            allowNull: true
        });

        // Recreate foreign key constraints with desired ON DELETE behaviour
        await queryInterface.addConstraint('Worklogs', {
            fields: ['task_id'],
            type: 'foreign key',
            name: 'fk_worklogs_task_id',
            references: {
                table: 'Tasks',
                field: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        }).catch(() => { });

        await queryInterface.addConstraint('Worklogs', {
            fields: ['subtask_id'],
            type: 'foreign key',
            name: 'fk_worklogs_subtask_id',
            references: {
                table: 'Subtasks',
                field: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        }).catch(() => { });
    },

    down: async (queryInterface, Sequelize) => {
        try {
            await queryInterface.describeTable('Worklogs');
        } catch (err) {
            // Table missing - nothing to revert
            // eslint-disable-next-line no-console
            console.warn('Worklogs table not found, skipping down migration for allow-null-taskid-subtaskid-worklogs');
            return;
        }

        // For reverting, remove foreign keys that may conflict, then change columns back
        // Drop FK on task_id if it exists
        const [taskFks] = await queryInterface.sequelize.query(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Worklogs' AND COLUMN_NAME = 'task_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
        );
        if (taskFks && taskFks.length) {
            for (const fk of taskFks) {
                await queryInterface.sequelize.query(`ALTER TABLE \`Worklogs\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            }
        }

        await queryInterface.changeColumn('Worklogs', 'task_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'tasks',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        // Drop FK on subtask_id if exists
        const [subFks] = await queryInterface.sequelize.query(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Worklogs' AND COLUMN_NAME = 'subtask_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
        );
        if (subFks && subFks.length) {
            for (const fk of subFks) {
                await queryInterface.sequelize.query(`ALTER TABLE \`Worklogs\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            }
        }

        await queryInterface.changeColumn('Worklogs', 'subtask_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'subtasks',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        });
    },
};
