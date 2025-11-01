/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        // Lấy id user, task, subtask mẫu
        const [users] = await queryInterface.sequelize.query("SELECT id, manv FROM Users");
        const [tasks] = await queryInterface.sequelize.query("SELECT id, tendangnhap FROM Tasks");
        const [subtasks] = await queryInterface.sequelize.query("SELECT id, ten FROM Subtasks");
        const getUser = manv => users.find(u => u.manv === manv)?.id;
        const getTask = () => tasks.length > 0 ? tasks[0].id : null;
        const getSubtask = () => subtasks.length > 0 ? subtasks[0].id : null;

        const now = new Date();
        const worklogs = [
            {
                userId: getUser('DEV001'),
                taskId: getTask(),
                subtaskId: null,
                content: 'Hoàn thành giao diện dashboard',
                timeSpent: 3.5,
                createdAt: now,
                updatedAt: now
            },
            {
                userId: getUser('DEV002'),
                taskId: getTask(),
                subtaskId: getSubtask(),
                content: 'Fix bug chức năng lọc dữ liệu',
                timeSpent: 2,
                createdAt: now,
                updatedAt: now
            },
            {
                userId: getUser('QA001'),
                taskId: getTask(),
                subtaskId: getSubtask(),
                content: 'Test tính năng xuất báo cáo',
                timeSpent: 1.5,
                createdAt: now,
                updatedAt: now
            }
        ];
        // Lọc worklog hợp lệ (có userId và taskId hoặc subtaskId)
        const valid = worklogs.filter(w => w.userId && (w.taskId || w.subtaskId));
        await queryInterface.bulkInsert('Worklogs', valid);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Worklogs', null, {});
    }
};
