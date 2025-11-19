const { Task, Subtask, User, DuAn, Assignment } = require('../models');
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
                    include: [
                        {
                            model: User,
                            as: 'nguoiThucHien',
                            attributes: ['id', 'hoten', 'manv', 'email'],
                            required: false
                        },
                        {
                            model: Assignment,
                            as: 'assignments',
                            where: { status: 'pending' },
                            required: false,
                            include: [
                                {
                                    model: User,
                                    as: 'assignee',
                                    attributes: ['id', 'hoten', 'manv']
                                }
                            ]
                        }
                    ]
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
        console.log('🔍 Backend: getTasksByProject called for projectId:', projectId);
        
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
                    include: [
                        {
                            model: User,
                            as: 'nguoiThucHien',
                            attributes: ['id', 'hoten', 'manv'],
                            required: false
                        },
                        {
                            model: Assignment,
                            as: 'assignments',
                            where: { status: 'pending' },
                            required: false,
                            include: [
                                {
                                    model: User,
                                    as: 'assignee',
                                    attributes: ['id', 'hoten', 'manv']
                                }
                            ]
                        }
                    ]
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
        
        console.log(`✅ Backend: Returned ${tasksWithProgress.length} tasks for project ${projectId}`);
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

        const task = await Task.findByPk(id, {
            include: [{
                model: DuAn,
                as: 'duan',
                attributes: ['id', 'userId'] // userId là manager của dự án
            }]
        });
        
        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc' });
        }

        console.log('🔍 [updateTask] Checking permissions:', {
            taskId: id,
            userId: req.user.id,
            userRole: req.user.role?.name,
            nguoiGiaoId: task.nguoiGiaoId,
            nguoiDuocGiaoId: task.nguoiDuocGiaoId,
            projectManagerId: task.duan?.userId
        });

        // Kiểm tra quyền cập nhật:
        // 1. Người tạo task (nguoiGiaoId)
        // 2. Người được giao task (nguoiDuocGiaoId)
        // 3. Manager của dự án chứa task này
        // 4. Admin (đã được kiểm tra ở middleware checkPermission)
        const isTaskCreator = task.nguoiGiaoId === req.user.id;
        const isTaskAssignee = task.nguoiDuocGiaoId === req.user.id;
        const isProjectManager = task.duan && task.duan.userId === req.user.id;
        
        if (!isTaskCreator && !isTaskAssignee && !isProjectManager) {
            console.log('❌ [updateTask] Permission denied');
            return res.status(403).json({ error: 'Không có quyền cập nhật công việc này' });
        }

        console.log('✅ [updateTask] Permission granted');

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

        console.log('✅ [updateTask] Task updated successfully');
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

// Lấy danh sách tasks của nhóm (teamleader)
exports.getGroupTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Group } = require('../models');

        const group = await Group.findOne({
            where: { leaderId: userId, status: 'active' },
            include: [{
                model: User,
                as: 'members',
                attributes: ['id', 'hoten', 'manv'],
                through: { attributes: [] }
            }]
        });

        if (!group) {
            return res.status(404).json({
                message: 'Bạn chưa được gán làm trưởng nhóm nào'
            });
        }

        const memberIds = group.members.map(member => member.id);

        if (memberIds.length === 0) {
            return res.json({
                message: 'Nhóm của bạn chưa có thành viên',
                group: {
                    id: group.id,
                    name: group.name
                },
                members: [],
                tasks: []
            });
        }

        const tasks = await Task.findAll({
            where: { nguoiDuocGiaoId: memberIds },
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
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                },
                {
                    model: Subtask,
                    as: 'subtasks',
                    attributes: ['id', 'tenSubtask', 'trangThai', 'nguoiThucHienId'],
                    include: [{
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'hoten', 'manv'],
                        required: false
                    }]
                }
            ],
            order: [
                ['ngayKetThuc', 'ASC'],
                ['createdAt', 'DESC']
            ]
        });

        const formattedTasks = tasks.map(task => {
            const taskData = task.toJSON();
            const subtaskStats = {
                total: 0,
                completed: 0,
                inProgress: 0,
                pending: 0
            };

            if (Array.isArray(taskData.subtasks)) {
                subtaskStats.total = taskData.subtasks.length;
                taskData.subtasks.forEach(subtask => {
                    switch (subtask.trangThai) {
                        case 'Hoàn thành':
                            subtaskStats.completed += 1;
                            break;
                        case 'Đang chạy':
                            subtaskStats.inProgress += 1;
                            break;
                        default:
                            subtaskStats.pending += 1;
                            break;
                    }
                });
            }

            const progress = subtaskStats.total > 0
                ? Math.round((subtaskStats.completed / subtaskStats.total) * 100)
                : (taskData.tienDo || 0);

            return {
                ...taskData,
                progress,
                subtaskStats
            };
        });

        res.json({
            message: 'Lấy danh sách công việc của nhóm thành công',
            group: {
                id: group.id,
                name: group.name
            },
            members: group.members,
            tasks: formattedTasks
        });
    } catch (error) {
        console.error('getGroupTasks error:', error);
        res.status(500).json({
            error: 'Lỗi khi lấy danh sách công việc của nhóm',
            message: error.message
        });
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
        const userId = req.user.id;
        const userRole = req.user.role?.name || req.user.chucvu;

        // Validate trạng thái
        const validStatuses = ['Chưa bắt đầu', 'Đang chạy', 'Hoàn thành', 'Chờ xác nhận hoàn thành'];
        if (!validStatuses.includes(trangThai)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
        }

        const task = await Task.findByPk(id, {
            include: [
                { model: User, as: 'nguoiGiao', attributes: ['id', 'hoten', 'manv'] }
            ]
        });
        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc' });
        }

        // Logic xử lý theo role và trạng thái
        let finalStatus = trangThai;
        const updateData = { trangThai: finalStatus };

        // Nếu là member/employee và muốn đánh dấu "Hoàn thành"
        if (trangThai === 'Hoàn thành' && userRole === 'employee' && task.nguoiDuocGiaoId === userId) {
            // Chuyển thành "Chờ xác nhận hoàn thành" thay vì "Hoàn thành" ngay
            finalStatus = 'Chờ xác nhận hoàn thành';
            updateData.trangThai = finalStatus;
            
            // Tạo thông báo cho người giao (wrapped in try/catch to avoid breaking status update)
            try {
                const { Notification, UserNotification } = require('../models');
                // targetAudience must be one of allowed values (model validates), use 'manager' here
                const notification = await Notification.create({
                    title: `Yêu cầu phê duyệt hoàn thành: "${task.tentask}"`,
                    content: `${req.user.hoten || req.user.manv} đã đánh dấu công việc "${task.tentask}" là hoàn thành và yêu cầu phê duyệt.`,
                    type: 'task',
                    priority: 'medium',
                    status: 'published',
                    targetAudience: 'manager',
                    authorId: userId,
                    publishedAt: new Date()
                });

                // Create a per-user notification for the task owner
                await UserNotification.create({
                    userId: task.nguoiGiaoId,
                    notificationId: notification.id,
                    isRead: false
                });
            } catch (notifErr) {
                console.error('Failed to create notification for task completion request:', notifErr && notifErr.message ? notifErr.message : notifErr);
                // continue without failing the whole status update
            }

        } else {
            // Admin/Manager có thể đặt trạng thái trực tiếp
            // Tự động cập nhật các trường liên quan
            if (trangThai === 'Đang chạy' && !task.ngayBatDau) {
                updateData.ngayBatDau = new Date();
            }
            
            if (trangThai === 'Hoàn thành') {
                updateData.ngayHoanThanh = new Date();
                updateData.tienDo = 100;
                // Do not set approval audit fields here unless the Task model/migration defines them.
                // If approval tracking is required, add columns to Task model and migrations,
                // or use the dedicated approval endpoints to record approver metadata.
            }
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

        const message = finalStatus === 'Chờ xác nhận hoàn thành' 
            ? 'Đã gửi yêu cầu xác nhận hoàn thành'
            : 'Cập nhật trạng thái thành công';

        res.json({
            message,
            task: updatedTask
        });
    } catch (error) {
        console.error('Update task status error:', error);
        console.error(error.stack);
        // Return the actual error message to client for easier debugging during development.
        res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái công việc', details: error.message });
    }
};