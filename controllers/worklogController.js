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

    // Lấy worklog của user hiện tại
    async getMyWorklogs(req, res) {
        try {
            const userId = req.user.id;
            const { date, limit = 50 } = req.query; // Optional: filter by date, limit results

            const whereClause = { userId };
            if (date) {
                whereClause.date = date;
            }

            const queryOptions = {
                where: whereClause,
                limit: parseInt(limit),
                include: [
                    {
                        model: User,
                        attributes: ["id", "hoten", "manv"]
                    },
                    {
                        model: Task,
                        attributes: ["id", "tentask"],
                        include: [
                            {
                                model: DuAn,
                                as: 'duan',
                                attributes: ["id", "tenduan"]
                            }
                        ]
                    },
                    {
                        model: Subtask,
                        attributes: ["id", "tenSubtask"],
                        include: [
                            {
                                model: Task,
                                as: 'task',
                                attributes: ["id", "tentask"],
                                include: [
                                    {
                                        model: DuAn,
                                        as: 'duan',
                                        attributes: ["id", "tenduan"]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                order: [["date", "DESC"], ["createdAt", "DESC"]],
            };

            const worklogs = await Worklog.findAll(queryOptions);

            // Format data để dễ sử dụng cho frontend
            const formattedWorklogs = worklogs.map(worklog => {
                let taskName = '';
                let projectName = '';

                if (worklog.Subtask) {
                    // Worklog từ subtask
                    taskName = worklog.Subtask.tenSubtask;
                    projectName = worklog.Subtask.task?.duan?.tenduan || 'Không có dự án';
                } else if (worklog.Task) {
                    // Worklog trực tiếp từ task
                    taskName = worklog.Task.tentask;
                    projectName = worklog.Task.duan?.tenduan || 'Không có dự án';
                }

                return {
                    id: worklog.id,
                    date: worklog.date,
                    taskName,
                    project: projectName,
                    hours: worklog.hours,
                    description: worklog.note || '',
                    taskId: worklog.taskId,
                    subtaskId: worklog.subtaskId,
                    createdAt: worklog.createdAt,
                    updatedAt: worklog.updatedAt
                };
            });

            res.json({
                message: 'Lấy danh sách worklog thành công',
                worklogs: formattedWorklogs
            });
        } catch (err) {
            console.error('Get my worklogs error:', err);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách worklog' });
        }
    },

    // Cập nhật worklog
    async update(req, res) {
        try {
            const id = req.params.id;
            const { userId, taskId, subtaskId, hours, note, date } = req.body;

            // Basic validation
            if (!userId || (!taskId && !subtaskId) || !hours || !date) {
                return res.status(400).json({ error: 'Thiếu các trường bắt buộc' });
            }

            const worklog = await Worklog.findByPk(id);
            if (!worklog) return res.status(404).json({ error: 'Worklog không tồn tại' });

            await worklog.update({ userId, taskId: taskId || null, subtaskId: subtaskId || null, hours, note, date });
            res.json({ message: 'Cập nhật worklog thành công', worklog });
        } catch (err) {
            console.error('Update worklog error:', err);
            res.status(500).json({ error: err.message });
        }
    },

    // Xóa worklog
    async destroy(req, res) {
        try {
            const id = req.params.id;
            const worklog = await Worklog.findByPk(id);
            if (!worklog) return res.status(404).json({ error: 'Worklog không tồn tại' });

            await worklog.destroy();
            res.json({ message: 'Xóa worklog thành công' });
        } catch (err) {
            console.error('Delete worklog error:', err);
            res.status(500).json({ error: err.message });
        }
    },
};

module.exports = WorklogController;
