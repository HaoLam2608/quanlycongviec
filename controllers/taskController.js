const { Task, Subtask, User, DuAn } = require('../models');
const { Op } = require('sequelize');

// Lấy tasks theo Kanban view (nhóm theo trạng thái)
exports.getKanbanTasks = async (req, res) => {
    try {
        const { projectId } = req.params;

        console.log('🔍 Backend: getKanbanTasks called for projectId:', projectId);

        // Lấy tất cả tasks của dự án
        const tasks = await Task.findAll({
            where: { duanId: projectId },
            include: [
                {
                    model: User,
                    as: 'nguoiDuocGiao',
                    attributes: ['id', 'hoten', 'manv', 'email']
                },
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv', 'email']
                },
                {
                    model: Subtask,
                    as: 'subtasks',
                    include: [{
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'hoten', 'manv', 'email']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        console.log('📊 Total tasks found:', tasks.length);

        // Nhóm tasks theo trạng thái
        const kanbanData = {
            'Chưa bắt đầu': [],
            'Đang chạy': [],
            'Hoàn thành': []
        };

        // Tính progress cho mỗi task
        tasks.forEach(task => {
            const taskData = task.toJSON();
            
            // Tính progress dựa vào subtasks
            if (taskData.subtasks && taskData.subtasks.length > 0) {
                const completedCount = taskData.subtasks.filter(st => st.trangThai === 'Hoàn thành').length;
                taskData.progress = Math.round((completedCount / taskData.subtasks.length) * 100);
            } else {
                taskData.progress = 0;
            }

            // Nhóm theo trạng thái
            const status = taskData.trangThai;
            if (kanbanData[status]) {
                kanbanData[status].push(taskData);
            }
        });

        // Tính thống kê
        const stats = {
            total: tasks.length,
            notStarted: kanbanData['Chưa bắt đầu'].length,
            inProgress: kanbanData['Đang chạy'].length,
            completed: kanbanData['Hoàn thành'].length
        };

        console.log('📈 Stats:', stats);

        res.json({
            kanban: kanbanData,
            stats: stats
        });
    } catch (error) {
        console.error('❌ Kanban fetch error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu Kanban', details: error.message });
    }
};

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

        // Validate dates: if both provided, start must be <= end
        if (ngayBatDau && ngayKetThuc) {
            const start = new Date(ngayBatDau);
            const end = new Date(ngayKetThuc);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                return res.status(400).json({ error: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc' });
            }
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

        // Validate dates on update
        if (updateData.ngayBatDau && updateData.ngayKetThuc) {
            const start = new Date(updateData.ngayBatDau);
            const end = new Date(updateData.ngayKetThuc);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                return res.status(400).json({ error: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc' });
            }
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

// Lấy tasks theo Kanban view (grouped by status)
exports.getKanbanTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log('=== KANBAN DEBUG ===');
        console.log('Project ID:', projectId);

        // Lấy tất cả tasks của dự án
        const tasks = await Task.findAll({
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
            order: [
                ['mucDoUuTien', 'DESC'], // High priority first
                ['ngayKetThuc', 'ASC'],  // Then by deadline
                ['createdAt', 'DESC']
            ]
        });

        console.log('Total tasks found:', tasks.length);
        console.log('Tasks data:', tasks.map(t => ({ id: t.id, tentask: t.tentask, trangThai: t.trangThai })));

        // Group tasks by status và tính progress
        const kanbanData = {
            'Chưa bắt đầu': [],
            'Đang chạy': [],
            'Hoàn thành': []
        };

        tasks.forEach(task => {
            const taskData = task.toJSON();
            
            // Tính progress từ subtasks
            if (taskData.subtasks && taskData.subtasks.length > 0) {
                const completedCount = taskData.subtasks.filter(st => st.trangThai === 'Hoàn thành').length;
                taskData.progress = Math.round((completedCount / taskData.subtasks.length) * 100);
            } else {
                taskData.progress = taskData.tienDo || 0;
            }

            // Add task vào column tương ứng
            if (kanbanData[taskData.trangThai]) {
                kanbanData[taskData.trangThai].push(taskData);
            }
        });

        console.log('Kanban data:', {
            todo: kanbanData['Chưa bắt đầu'].length,
            inProgress: kanbanData['Đang chạy'].length,
            completed: kanbanData['Hoàn thành'].length
        });

        res.json({
            kanban: kanbanData,
            stats: {
                total: tasks.length,
                todo: kanbanData['Chưa bắt đầu'].length,
                inProgress: kanbanData['Đang chạy'].length,
                completed: kanbanData['Hoàn thành'].length
            }
        });
    } catch (error) {
        console.error('Get kanban tasks error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu Kanban' });
    }
};

// Cập nhật trạng thái task (dùng cho drag & drop trong Kanban)
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai } = req.body;

        // Validate trạng thái
        const validStatuses = ['Chưa bắt đầu', 'Đang chạy', 'Hoàn thành'];
        if (!validStatuses.includes(trangThai)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
        }

        const task = await Task.findByPk(id);
        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc' });
        }

        // Cập nhật trạng thái
        const updateData = { trangThai };
        
        // Tự động cập nhật các trường liên quan
        if (trangThai === 'Đang chạy' && !task.ngayBatDau) {
            updateData.ngayBatDau = new Date();
        }
        
        if (trangThai === 'Hoàn thành') {
            updateData.ngayHoanThanh = new Date();
            updateData.tienDo = 100;
        }

        await task.update(updateData);

        // Lấy task với thông tin đầy đủ
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
            message: 'Cập nhật trạng thái thành công',
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái công việc' });
    }
};