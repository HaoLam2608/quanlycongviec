const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy id user, task, subtask mẫu
        const users = await queryInterface.sequelize.query("SELECT id, manv FROM `Users`", { type: QueryTypes.SELECT });
        const tasks = await queryInterface.sequelize.query("SELECT id, tentask FROM `Tasks`", { type: QueryTypes.SELECT });
        const subtasks = await queryInterface.sequelize.query("SELECT id, tenSubtask FROM `Subtasks`", { type: QueryTypes.SELECT });
        const getUser = manv => { const u = users.find(u => u.manv === manv); return u ? u.id : null; };
        const getTask = () => tasks.length > 0 ? tasks[0].id : null;
        const getSubtask = () => subtasks.length > 0 ? subtasks[0].id : null;
        const now = new Date();
        const worklogs = [
            {
                user_id: getUser('DEV001'),
                task_id: getTask(),
                subtask_id: null,
                description: 'Hoàn thành giao diện dashboard',
                hours_spent: 3.5,
                work_date: now,
                created_at: now,
                updated_at: now
            },
            {
                user_id: getUser('DEV002'),
                task_id: getTask(),
                subtask_id: getSubtask(),
                description: 'Fix bug chức năng lọc dữ liệu',
                hours_spent: 2,
                work_date: now,
                created_at: now,
                updated_at: now
            },
            {
                user_id: getUser('QA001'),
                task_id: getTask(),
                subtask_id: getSubtask(),
                description: 'Test tính năng xuất báo cáo',
                hours_spent: 1.5,
                work_date: now,
                created_at: now,
                updated_at: now
            }
        ];
        // Lọc worklog hợp lệ (có user_id và task_id hoặc subtask_id)
        const valid = worklogs.filter(w => w.user_id && (w.task_id || w.subtask_id));
        if (valid.length === 0) return;
        await queryInterface.bulkInsert('Worklogs', valid);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Worklogs', null, {});
    }
};
