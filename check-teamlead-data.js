const { Task, Subtask, User } = require('./models');
const { Op } = require('sequelize');

(async () => {
    try {
        // Kiểm tra tasks của user 4 (DEV001)
        console.log('\n=== Kiểm tra tasks của DEV001 (id=4) ===');
        const tasks = await Task.findAll({
            where: { nguoiDuocGiaoId: 4 },
            attributes: ['id', 'tentask'],
            raw: true
        });
        console.log('Tasks:', JSON.stringify(tasks, null, 2));

        if (tasks.length > 0) {
            const taskIds = tasks.map(t => t.id);

            // Kiểm tra subtasks hoàn thành
            console.log('\n=== Kiểm tra subtasks hoàn thành ===');
            const completedSubtasks = await Subtask.findAll({
                where: {
                    taskId: taskIds,
                    trangThai: 'Hoàn thành'
                },
                attributes: ['id', 'tenSubtask', 'taskId', 'approvedBy', 'approvedAt'],
                raw: true
            });
            console.log('Completed subtasks:', JSON.stringify(completedSubtasks, null, 2));

            // Kiểm tra subtasks đã phê duyệt
            console.log('\n=== Kiểm tra subtasks đã phê duyệt ===');
            const approvedSubtasks = await Subtask.findAll({
                where: {
                    taskId: taskIds,
                    trangThai: 'Hoàn thành',
                    approvedBy: { [Op.not]: null }
                },
                attributes: ['id', 'tenSubtask', 'taskId', 'approvedBy', 'approvedAt'],
                raw: true
            });
            console.log('Approved subtasks:', JSON.stringify(approvedSubtasks, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
