const { Worklog, User, Task, Subtask, DuAn } = require('../models');

const WorklogController = {
    // Thêm worklog mới
    async create(req, res) {
        try {
            const { userId, taskId, subtaskId, hours, note, date } = req.body;
            if (!userId || (!taskId && !subtaskId) || !hours || !date) {
                return res.status(400).json({ error: "Thiếu các trường bắt buộc" });
            }
            const worklog = await Worklog.create({ userId, taskId, subtaskId, hours, note, date });
            res.status(201).json(worklog);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Lấy worklog theo task hoặc subtask
    async getByTaskOrSubtask(req, res) {
        try {
            const { taskId, subtaskId } = req.query;

            if (!taskId && !subtaskId) {
                return res.status(400).json({ error: 'Cần cung cấp taskId hoặc subtaskId' });
            }

            const whereClause = {};
            if (subtaskId) {
                whereClause.subtaskId = subtaskId;
            } else if (taskId) {
                // Nếu có taskId, tìm tất cả subtaskIds của task đó để lấy worklog của chúng
                const subtasks = await Subtask.findAll({
                    where: { taskId: taskId },
                    attributes: ['id']
                });
                const subtaskIds = subtasks.map(st => st.id);

                // Kết hợp điều kiện: lấy worklog có subtaskId nằm trong danh sách subtaskIds
                // HOẶC worklog được ghi trực tiếp cho taskId này
                whereClause[require('sequelize').Op.or] = [
                    { subtaskId: { [require('sequelize').Op.in]: subtaskIds } },
                    { taskId: taskId }
                ];
            }

            const worklogs = await Worklog.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        attributes: ["id", "hoten", "manv"]
                    },
                    { // Thêm dòng này để lấy thông tin subtask
                        model: Subtask,
                        attributes: ["id", "tenSubtask"]
                    }
                ],
                order: [["date", "DESC"]],
            });
            res.json(worklogs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Lấy worklog theo user
    async getByUser(req, res) {
        try {
            const { userId } = req.params;
            const worklogs = await Worklog.findAll({
                where: { userId },
                order: [["date", "DESC"]],
            });
            res.json(worklogs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};

module.exports = WorklogController;
