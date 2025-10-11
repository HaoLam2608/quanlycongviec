const { Task, Subtask, User, DuAn } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách tasks của một dự án
exports.getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const tasks = await Task.findAndCountAll({
            where: { duanId: projectId },
            include: [
                {
                    model: User,
                    as: 'nguoiDuocGiao',
                    attributes: ['id', 'hoten', 'manv']
                },
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv']
                },
                {
                    model: Subtask,
                    as: 'subtasks',
                    include: [{
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'hoten', 'manv']
                    }]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        // Tính toán progress cho mỗi task
        const tasksWithProgress = tasks.rows.map(task => {
            const taskData = task.toJSON();
            if (taskData.subtasks && taskData.subtasks.length > 0) {
                const completedCount = taskData.subtasks.filter(st => st.trangThai === 'Hoàn thành').length;
                taskData.progress = Math.round((completedCount / taskData.subtasks.length) * 100);
            } else {
                taskData.progress = 0;
            }
            return taskData;
        });

        res.json({
            tasks: tasksWithProgress,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: tasks.count,
                pages: Math.ceil(tasks.count / limit)
            }
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách công việc' });
    }
};

// Lấy chi tiết một task
exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'nguoiDuocGiao',
                    attributes: ['id', 'hoten', 'manv', 'chucvu']
                },
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv', 'chucvu']
                },
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                },
                {
                    model: Subtask,
                    as: 'subtasks',
                    include: [{
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'hoten', 'manv', 'chucvu']
                    }],
                    order: [['thuTu', 'ASC']]
                }
            ]
        });

        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc' });
        }

        // Tính toán progress
        const taskData = task.toJSON();
        if (taskData.subtasks && taskData.subtasks.length > 0) {
            const completedCount = taskData.subtasks.filter(st => st.trangThai === 'Hoàn thành').length;
            taskData.progress = Math.round((completedCount / taskData.subtasks.length) * 100);
        } else {
            taskData.progress = 0;
        }

        res.json(taskData);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy thông tin công việc' });
    }
};

// Tạo task mới
exports.createTask = async (req, res) => {
    try {
        const { tentask, mota, duanId, nguoiDuocGiaoId, ngayBatDau, ngayKetThuc, mucDoUuTien, ghiChu } = req.body;
        
        // Kiểm tra dự án có tồn tại không
        const project = await DuAn.findByPk(duanId);
        if (!project) {
            return res.status(404).json({ error: 'Không tìm thấy dự án' });
        }

        // Kiểm tra user được giao có tồn tại không
        const assignee = await User.findByPk(nguoiDuocGiaoId);
        if (!assignee) {
            return res.status(404).json({ error: 'Không tìm thấy người được giao' });
        }

        const newTask = await Task.create({
            tentask,
            mota,
            duanId,
            nguoiDuocGiaoId,
            nguoiGiaoId: req.user.id, // Người tạo task
            ngayBatDau,
            ngayKetThuc,
            mucDoUuTien: mucDoUuTien || 'medium',
            trangThai: 'Chưa bắt đầu',
            tienDo: 0,
            ghiChu
        });

        // Lấy thông tin đầy đủ của task vừa tạo
        const taskWithDetails = await Task.findByPk(newTask.id, {
            include: [
                {
                    model: User,
                    as: 'nguoiDuocGiao',
                    attributes: ['id', 'hoten', 'manv']
                },
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv']
                }
            ]
        });

        res.status(201).json({
            message: 'Tạo công việc thành công',
            task: taskWithDetails
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Lỗi khi tạo công việc' });
    }
};

// Cập nhật task
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const task = await Task.findByPk(id);
        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc' });
        }

        // Kiểm tra quyền cập nhật (chỉ người tạo hoặc người được giao mới được cập nhật)
        if (task.nguoiGiaoId !== req.user.id && task.nguoiDuocGiaoId !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền cập nhật công việc này' });
        }

        // Tự động cập nhật ngày hoàn thành khi trạng thái là "Hoàn thành"
        if (updateData.trangThai === 'Hoàn thành' && !updateData.ngayHoanThanh) {
            updateData.ngayHoanThanh = new Date();
            updateData.tienDo = 100;
        }

        await task.update(updateData);

        // Lấy thông tin đầy đủ sau khi cập nhật
        const updatedTask = await Task.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'nguoiDuocGiao',
                    attributes: ['id', 'hoten', 'manv']
                },
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv']
                },
                {
                    model: Subtask,
                    as: 'subtasks',
                    include: [{
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'hoten', 'manv']
                    }]
                }
            ]
        });

        res.json({
            message: 'Cập nhật công việc thành công',
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật công việc' });
    }
};

// Xóa task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findByPk(id);
        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc' });
        }

        // Kiểm tra quyền xóa (chỉ người tạo mới được xóa)
        if (task.nguoiGiaoId !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền xóa công việc này' });
        }

        await task.destroy();

        res.json({ message: 'Xóa công việc thành công' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Lỗi khi xóa công việc' });
    }
};

// Lấy tasks được giao cho user hiện tại
exports.getMyTasks = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { nguoiDuocGiaoId: req.user.id };
        if (status) {
            whereClause.trangThai = status;
        }

        const tasks = await Task.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv']
                },
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                },
                {
                    model: Subtask,
                    as: 'subtasks',
                    where: { nguoiThucHienId: req.user.id },
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['ngayKetThuc', 'ASC']]
        });

        res.json({
            tasks: tasks.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: tasks.count,
                pages: Math.ceil(tasks.count / limit)
            }
        });
    } catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách công việc của tôi' });
    }
};