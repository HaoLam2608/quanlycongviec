const { Task, Subtask, User, DuAn } = require('../models');
const { Op } = require('sequelize');

// Get pending approvals (tasks and subtasks waiting for approval)
const getPendingApprovals = async (req, res) => {
    try {
        const { type = 'all' } = req.query; // 'all', 'tasks', 'subtasks'
        const userId = req.user.id;
        const userRole = req.user.role?.name;

        console.log('🔍 getPendingApprovals - User:', userId, 'Role:', userRole);

        const pendingStatuses = ['Đang chờ duyệt', 'Chờ xác nhận hoàn thành'];

        let tasks = [];
        let subtasks = [];

        // Nếu là teamleader, chỉ lấy subtasks của nhóm mình quản lý
        if (userRole === 'teamleader') {
            const { Group } = require('../models');
            const group = await Group.findOne({
                where: { leaderId: userId, status: 'active' },
                include: [{
                    model: User,
                    as: 'members',
                    attributes: ['id'],
                    through: { attributes: [] }
                }]
            });

            if (!group) {
                return res.json({
                    success: true,
                    data: { tasks: [], subtasks: [], total: 0 },
                    message: 'Bạn chưa được gán làm trưởng nhóm'
                });
            }

            const memberIds = group.members.map(m => m.id);
            console.log('📋 TeamLeader group members:', memberIds);

            subtasks = await Subtask.findAll({
                where: {
                    trangThai: { [Op.in]: pendingStatuses },
                    nguoiThucHienId: memberIds
                },
                include: [
                    {
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'manv', 'hoten'],
                        required: false
                    },
                    {
                        model: Task,
                        as: 'task',
                        attributes: ['id', 'tentask'],
                        required: false,
                        include: [{
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan'],
                            required: false
                        }]
                    }
                ],
                order: [['updatedAt', 'DESC']]
            });

            console.log('✅ Found pending subtasks for teamleader:', subtasks.length);
            return res.json({
                success: true,
                data: { tasks: [], subtasks, total: subtasks.length }
            });
        }

        // Admin và Manager có thể xem tất cả
        if (type === 'all' || type === 'tasks') {
            try {
                tasks = await Task.findAll({
                    where: { trangThai: { [Op.in]: pendingStatuses } },
                    include: [
                        {
                            model: User,
                            as: 'nguoiGiao',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: User,
                            as: 'nguoiDuocGiao',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan'],
                            required: false
                        }
                    ],
                    order: [['updatedAt', 'DESC']]
                });
            } catch (taskError) {
                console.error('Error fetching tasks:', taskError.message);
            }
        }

        if (type === 'all' || type === 'subtasks') {
            try {
                subtasks = await Subtask.findAll({
                    where: { trangThai: { [Op.in]: pendingStatuses } },
                    include: [
                        {
                            model: User,
                            as: 'nguoiThucHien',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: Task,
                            as: 'task',
                            attributes: ['id', 'tentask'],
                            required: false,
                            include: [{
                                model: DuAn,
                                as: 'duan',
                                attributes: ['id', 'tenduan'],
                                required: false
                            }]
                        }
                    ],
                    order: [['updatedAt', 'DESC']]
                });
            } catch (subtaskError) {
                console.error('Error fetching subtasks:', subtaskError.message);
            }
        }

        res.json({
            success: true,
            data: {
                tasks,
                subtasks,
                total: tasks.length + subtasks.length
            }
        });
    } catch (error) {
        console.error('Get pending approvals error:', error);
        console.error('Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách phê duyệt',
            error: error.message
        });
    }
};

// Approve task completion
const approveTaskCompletion = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { note, approved, reason } = req.body;

        console.log('🔍 [approveTaskCompletion] Request:', { taskId, approved, note, reason });

        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy công việc' });
        }

        if (task.trangThai !== 'Chờ xác nhận hoàn thành') {
            return res.status(400).json({ message: 'Công việc không ở trạng thái chờ phê duyệt' });
        }

        // Check if this is a rejection (approved === false)
        if (approved === false) {
            console.log('❌ [approveTaskCompletion] Rejecting task completion');
            task.trangThai = 'Đang chạy'; // Return to in-progress
            task.rejectedBy = req.user.id;
            task.rejectedAt = new Date();
            task.rejectionReason = reason || note || null;
            task.requestedCompletionAt = null;
            await task.save();

            console.log('✅ [approveTaskCompletion] Task rejected, status:', task.trangThai);
            return res.json({
                message: 'Đã từ chối yêu cầu hoàn thành',
                task
            });
        }

        // Otherwise, approve the completion
        console.log('✅ [approveTaskCompletion] Approving task completion');
        task.trangThai = 'Hoàn thành';
        task.ngayKetThuc = new Date();
        task.approvedBy = req.user.id;
        task.approvedAt = new Date();
        task.approvalNote = note || null;
        await task.save();

        console.log('✅ [approveTaskCompletion] Task approved, status:', task.trangThai);
        res.json({
            message: 'Đã phê duyệt hoàn thành công việc',
            task
        });
    } catch (error) {
        console.error('Approve task error:', error);
        res.status(500).json({ message: 'Lỗi phê duyệt công việc' });
    }
};

// Reject task completion
const rejectTaskCompletion = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
        }

        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy công việc' });
        }

        if (task.trangThai !== 'Chờ xác nhận hoàn thành') {
            return res.status(400).json({ message: 'Công việc không ở trạng thái chờ phê duyệt' });
        }

        task.trangThai = 'Đang chạy'; // Return to in-progress
        task.rejectedBy = req.user.id;
        task.rejectedAt = new Date();
        task.rejectionReason = reason;
        task.requestedCompletionAt = null;
        await task.save();

        res.json({
            message: 'Đã từ chối yêu cầu hoàn thành',
            task
        });
    } catch (error) {
        console.error('Reject task error:', error);
        res.status(500).json({ message: 'Lỗi từ chối phê duyệt' });
    }
};

// Approve subtask completion
const approveSubtaskCompletion = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { note, approved, reason } = req.body;

        console.log('🔍 [approveSubtaskCompletion] Request:', { subtaskId, approved, note, reason });

        const subtask = await Subtask.findByPk(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: 'Không tìm thấy công việc con' });
        }

        if (subtask.trangThai !== 'Chờ xác nhận hoàn thành') {
            return res.status(400).json({ message: 'Công việc con không ở trạng thái chờ phê duyệt' });
        }

        // Check if this is a rejection (approved === false)
        if (approved === false) {
            console.log('❌ [approveSubtaskCompletion] Rejecting subtask completion');
            subtask.trangThai = 'Đang chạy'; // Return to in-progress
            subtask.rejectedBy = req.user.id;
            subtask.rejectedAt = new Date();
            subtask.rejectionReason = reason || note || null;
            subtask.requestedCompletionAt = null;
            await subtask.save();

            console.log('✅ [approveSubtaskCompletion] Subtask rejected, status:', subtask.trangThai);
            return res.json({
                message: 'Đã từ chối yêu cầu hoàn thành',
                subtask
            });
        }

        // Otherwise, approve the completion
        console.log('✅ [approveSubtaskCompletion] Approving subtask completion');
        subtask.trangThai = 'Hoàn thành';
        subtask.ngayKetThuc = new Date();
        subtask.approvedBy = req.user.id;
        subtask.approvedAt = new Date();
        subtask.approvalNote = note || null;
        await subtask.save();

        console.log('✅ [approveSubtaskCompletion] Subtask approved, status:', subtask.trangThai);
        res.json({
            message: 'Đã phê duyệt hoàn thành công việc con',
            subtask
        });
    } catch (error) {
        console.error('Approve subtask error:', error);
        res.status(500).json({ message: 'Lỗi phê duyệt công việc con' });
    }
};

// Reject subtask completion
const rejectSubtaskCompletion = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
        }

        const subtask = await Subtask.findByPk(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: 'Không tìm thấy công việc con' });
        }

        if (subtask.trangThai !== 'Chờ xác nhận hoàn thành') {
            return res.status(400).json({ message: 'Công việc con không ở trạng thái chờ phê duyệt' });
        }

        subtask.trangThai = 'Đang chạy'; // Return to in-progress
        subtask.rejectedBy = req.user.id;
        subtask.rejectedAt = new Date();
        subtask.rejectionReason = reason;
        subtask.requestedCompletionAt = null;
        await subtask.save();

        res.json({
            message: 'Đã từ chối yêu cầu hoàn thành',
            subtask
        });
    } catch (error) {
        console.error('Reject subtask error:', error);
        res.status(500).json({ message: 'Lỗi từ chối phê duyệt' });
    }
};

// Get approved history (tasks and subtasks already approved)
const getApprovedHistory = async (req, res) => {
    try {
        const { type = 'all', limit = 10, page = 1 } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role?.name;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        console.log('🔍 getApprovedHistory - User:', userId, 'Role:', userRole, 'Page:', page, 'Limit:', limit);

        let tasks = [];
        let subtasks = [];
        let assignments = [];
        let totalCount = 0;

        // Nếu là teamleader, chỉ lấy subtasks thuộc các task mà họ được giao (nguoiDuocGiaoId)
        if (userRole === 'teamleader') {
            console.log('🔍 Fetching tasks for teamleader:', userId);

            // Lấy danh sách các task mà teamlead được giao
            const teamleadTasks = await Task.findAll({
                where: { nguoiDuocGiaoId: userId },
                attributes: ['id'],
                raw: true
            });

            const taskIds = teamleadTasks.map(t => t.id);
            console.log('📋 TeamLeader tasks:', taskIds, 'Count:', taskIds.length);

            if (taskIds.length === 0) {
                console.log('⚠️ No tasks assigned to teamleader');
                return res.json({
                    success: true,
                    data: { tasks: [], subtasks: [], assignments: [], total: 0 },
                    message: 'Bạn chưa có công việc nào được giao'
                });
            }

            // Lấy subtasks đã phê duyệt thuộc các task của teamlead
            console.log('🔍 Fetching approved subtasks for tasks:', taskIds);
            const subtasksResult = await Subtask.findAndCountAll({
                where: {
                    trangThai: 'Hoàn thành',
                    taskId: taskIds,
                    approvedBy: userId
                },
                include: [
                    {
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'manv', 'hoten'],
                        required: false
                    },
                    {
                        model: User,
                        as: 'approver',
                        attributes: ['id', 'manv', 'hoten'],
                        required: false
                    },
                    {
                        model: Task,
                        as: 'task',
                        attributes: ['id', 'tentask', 'nguoiDuocGiaoId'],
                        required: false,
                        include: [{
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan'],
                            required: false
                        }]
                    }
                ],
                order: [['approvedAt', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });
            subtasks = subtasksResult.rows;
            totalCount += subtasksResult.count;

            // Lấy assignments đã chấp nhận
            const { Assignment } = require('../models');
            assignments = await Assignment.findAll({
                where: {
                    status: 'accepted',
                    acceptedBy: userId,
                    [Op.or]: [
                        { taskId: taskIds },
                        { subtaskId: { [Op.not]: null } }
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'assignee',
                        attributes: ['id', 'manv', 'hoten'],
                        required: false
                    },
                    {
                        model: User,
                        as: 'approver',
                        attributes: ['id', 'manv', 'hoten'],
                        required: false
                    },
                    {
                        model: Task,
                        as: 'task',
                        attributes: ['id', 'tentask'],
                        required: false,
                        include: [{
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan'],
                            required: false
                        }]
                    },
                    {
                        model: Subtask,
                        as: 'subtask',
                        attributes: ['id', 'tenSubtask', 'taskId'],
                        required: false,
                        include: [{
                            model: Task,
                            as: 'task',
                            attributes: ['id', 'tentask'],
                            required: false,
                            include: [{
                                model: DuAn,
                                as: 'duan',
                                attributes: ['id', 'tenduan'],
                                required: false
                            }]
                        }]
                    }
                ],
                order: [['acceptedAt', 'DESC']],
                limit: parseInt(limit)
            });

            console.log('✅ Found approved subtasks for teamleader:', subtasks.length);
            console.log('✅ Found accepted assignments for teamleader:', assignments.length);

            return res.json({
                success: true,
                data: { tasks: [], subtasks, assignments, total: subtasks.length + assignments.length },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                }
            });
        }

        // Manager: lấy tasks, subtasks và assignments thuộc dự án họ quản lý (dựa trên DuAn.userId)
        if (userRole === 'manager') {
            const managedProjects = await DuAn.findAll({
                where: { userId: userId },
                attributes: ['id'],
                raw: true
            });

            const projectIds = managedProjects.map(p => p.id);
            console.log('📋 Manager projects (DuAn.userId):', projectIds);

            if (projectIds.length === 0) {
                return res.json({
                    success: true,
                    data: { tasks: [], subtasks: [], total: 0 },
                    message: 'Bạn chưa quản lý dự án nào'
                });
            }

            // Lấy tasks đã phê duyệt thuộc các dự án manager quản lý
            if (type === 'all' || type === 'tasks') {
                try {
                    const tasksResult = await Task.findAndCountAll({
                        where: {
                            trangThai: 'Hoàn thành',
                            duanId: projectIds,
                            approvedBy: userId
                        },
                        include: [
                            {
                                model: User,
                                as: 'nguoiGiao',
                                attributes: ['id', 'manv', 'hoten'],
                                required: false
                            },
                            {
                                model: User,
                                as: 'nguoiDuocGiao',
                                attributes: ['id', 'manv', 'hoten'],
                                required: false
                            },
                            {
                                model: User,
                                as: 'approver',
                                attributes: ['id', 'manv', 'hoten'],
                                required: false
                            },
                            {
                                model: DuAn,
                                as: 'duan',
                                attributes: ['id', 'tenduan'],
                                required: false
                            }
                        ],
                        order: [['approvedAt', 'DESC']],
                        limit: parseInt(limit),
                        offset: offset
                    });
                    tasks = tasksResult.rows;
                    totalCount += tasksResult.count;
                    console.log('✅ Found approved tasks for manager:', tasks.length);
                } catch (taskError) {
                    console.error('Error fetching approved tasks:', taskError.message);
                }
            }

            // Lấy subtasks đã phê duyệt thuộc các task của dự án manager quản lý
            if (type === 'all' || type === 'subtasks') {
                try {
                    // Lấy tất cả tasks thuộc dự án
                    const projectTasks = await Task.findAll({
                        where: { duanId: projectIds },
                        attributes: ['id'],
                        raw: true
                    });

                    const taskIds = projectTasks.map(t => t.id);

                    const subtasksResult = await Subtask.findAndCountAll({
                        where: {
                            trangThai: 'Hoàn thành',
                            taskId: taskIds,
                            approvedBy: userId
                        },
                        include: [
                            {
                                model: User,
                                as: 'nguoiThucHien',
                                attributes: ['id', 'manv', 'hoten'],
                                required: false
                            },
                            {
                                model: User,
                                as: 'approver',
                                attributes: ['id', 'manv', 'hoten'],
                                required: false
                            },
                            {
                                model: Task,
                                as: 'task',
                                attributes: ['id', 'tentask'],
                                required: false,
                                include: [{
                                    model: DuAn,
                                    as: 'duan',
                                    attributes: ['id', 'tenduan'],
                                    required: false
                                }]
                            }
                        ],
                        order: [['approvedAt', 'DESC']],
                        limit: parseInt(limit),
                        offset: offset
                    });
                    subtasks = subtasksResult.rows;
                    totalCount += subtasksResult.count;
                    console.log('✅ Found approved subtasks for manager:', subtasks.length);
                } catch (subtaskError) {
                    console.error('Error fetching approved subtasks:', subtaskError.message);
                }
            }

            // Lấy assignments đã chấp nhận
            try {
                const { Assignment } = require('../models');

                // Lấy tất cả tasks thuộc dự án
                const projectTasks = await Task.findAll({
                    where: { duanId: projectIds },
                    attributes: ['id'],
                    raw: true
                });

                const taskIds = projectTasks.map(t => t.id);
                console.log('📋 Manager project taskIds:', taskIds);

                // Lấy tất cả subtaskIds thuộc các tasks trong dự án
                const projectSubtasks = await Subtask.findAll({
                    where: { taskId: taskIds },
                    attributes: ['id'],
                    raw: true
                });

                const subtaskIds = projectSubtasks.map(s => s.id);
                console.log('📋 Manager project subtaskIds:', subtaskIds);

                // Nếu không có tasks và subtasks, không query assignments
                if (taskIds.length === 0 && subtaskIds.length === 0) {
                    console.log('⚠️ No tasks or subtasks found in manager projects');
                    assignments = [];
                } else {
                    // Query assignments: hoặc trực tiếp từ task trong dự án, hoặc từ subtask trong dự án
                    const orConditions = [];
                    if (taskIds.length > 0) {
                        orConditions.push({ taskId: taskIds });
                    }
                    if (subtaskIds.length > 0) {
                        orConditions.push({ subtaskId: subtaskIds });
                    }

                    const whereConditions = {
                        status: 'accepted',
                        acceptedBy: userId,
                        [Op.or]: orConditions
                    };

                    console.log('🔍 Assignment query conditions:', JSON.stringify(whereConditions, null, 2));

                    assignments = await Assignment.findAll({
                        where: whereConditions,
                        include: [
                            {
                                model: User,
                                as: 'assignee',
                                attributes: ['id', 'manv', 'hoten'],
                                required: false
                            },
                            {
                                model: User,
                                as: 'approver',
                                attributes: ['id', 'manv', 'hoten'],
                                required: false
                            },
                            {
                                model: Task,
                                as: 'task',
                                attributes: ['id', 'tentask'],
                                required: false,
                                include: [{
                                    model: DuAn,
                                    as: 'duan',
                                    attributes: ['id', 'tenduan'],
                                    required: false
                                }]
                            },
                            {
                                model: Subtask,
                                as: 'subtask',
                                attributes: ['id', 'tenSubtask', 'taskId'],
                                required: false,
                                include: [{
                                    model: Task,
                                    as: 'task',
                                    attributes: ['id', 'tentask'],
                                    required: false,
                                    include: [{
                                        model: DuAn,
                                        as: 'duan',
                                        attributes: ['id', 'tenduan'],
                                        required: false
                                    }]
                                }]
                            }
                        ],
                        order: [['acceptedAt', 'DESC']],
                        limit: parseInt(limit)
                    });
                    console.log('✅ Found accepted assignments for manager:', assignments.length);
                    if (assignments.length > 0) {
                        console.log('📋 Assignment details:', assignments.map(a => ({
                            id: a.id,
                            taskId: a.taskId,
                            subtaskId: a.subtaskId,
                            status: a.status,
                            acceptedBy: a.acceptedBy,
                            acceptedAt: a.acceptedAt
                        })));
                    }
                }
            } catch (assignmentError) {
                console.error('❌ Error fetching accepted assignments:', assignmentError.message);
                console.error('Stack:', assignmentError.stack);
            }

            console.log('📊 Manager history summary:', {
                tasks: tasks.length,
                subtasks: subtasks.length,
                assignments: assignments.length,
                total: tasks.length + subtasks.length + assignments.length
            });

            return res.json({
                success: true,
                data: { tasks, subtasks, assignments, total: tasks.length + subtasks.length + assignments.length },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                }
            });
        }

        // Admin có thể xem tất cả lịch sử phê duyệt
        if (type === 'all' || type === 'tasks') {
            try {
                const tasksResult = await Task.findAndCountAll({
                    where: {
                        trangThai: 'Hoàn thành',
                        approvedBy: userId
                    },
                    include: [
                        {
                            model: User,
                            as: 'nguoiGiao',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: User,
                            as: 'nguoiDuocGiao',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: User,
                            as: 'approver',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan'],
                            required: false
                        }
                    ],
                    order: [['approvedAt', 'DESC']],
                    limit: parseInt(limit),
                    offset: offset
                });
                tasks = tasksResult.rows;
                totalCount += tasksResult.count;
            } catch (taskError) {
                console.error('Error fetching approved tasks:', taskError.message);
            }
        }

        if (type === 'all' || type === 'subtasks') {
            try {
                const subtasksResult = await Subtask.findAndCountAll({
                    where: {
                        trangThai: 'Hoàn thành',
                        approvedBy: userId
                    },
                    include: [
                        {
                            model: User,
                            as: 'nguoiThucHien',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: User,
                            as: 'approver',
                            attributes: ['id', 'manv', 'hoten'],
                            required: false
                        },
                        {
                            model: Task,
                            as: 'task',
                            attributes: ['id', 'tentask'],
                            required: false,
                            include: [{
                                model: DuAn,
                                as: 'duan',
                                attributes: ['id', 'tenduan'],
                                required: false
                            }]
                        }
                    ],
                    order: [['approvedAt', 'DESC']],
                    limit: parseInt(limit),
                    offset: offset
                });
                subtasks = subtasksResult.rows;
                totalCount += subtasksResult.count;
            } catch (subtaskError) {
                console.error('Error fetching approved subtasks:', subtaskError.message);
            }
        }

        // Admin: Lấy tất cả assignments đã chấp nhận
        try {
            const { Assignment } = require('../models');
            assignments = await Assignment.findAll({
                where: {
                    status: 'accepted',
                    acceptedBy: userId
                },
                include: [
                    {
                        model: User,
                        as: 'assignee',
                        attributes: ['id', 'manv', 'hoten'],
                        required: false
                    },
                    {
                        model: User,
                        as: 'approver',
                        attributes: ['id', 'manv', 'hoten'],
                        required: false
                    },
                    {
                        model: Task,
                        as: 'task',
                        attributes: ['id', 'tentask'],
                        required: false,
                        include: [{
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan'],
                            required: false
                        }]
                    },
                    {
                        model: Subtask,
                        as: 'subtask',
                        attributes: ['id', 'tenSubtask', 'taskId'],
                        required: false,
                        include: [{
                            model: Task,
                            as: 'task',
                            attributes: ['id', 'tentask'],
                            required: false,
                            include: [{
                                model: DuAn,
                                as: 'duan',
                                attributes: ['id', 'tenduan'],
                                required: false
                            }]
                        }]
                    }
                ],
                order: [['acceptedAt', 'DESC']],
                limit: parseInt(limit)
            });
            console.log('✅ Admin found accepted assignments:', assignments.length);
        } catch (assignmentError) {
            console.error('❌ Error fetching admin assignments:', assignmentError.message);
        }

        console.log('📊 Admin history summary:', {
            tasks: tasks.length,
            subtasks: subtasks.length,
            assignments: assignments.length,
            total: tasks.length + subtasks.length + assignments.length
        });

        res.json({
            success: true,
            data: {
                tasks,
                subtasks,
                assignments,
                total: tasks.length + subtasks.length + assignments.length
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get approved history error:', error);
        console.error('Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy lịch sử phê duyệt',
            error: error.message
        });
    }
};

// Delete history item (remove approval data but keep the task/subtask/assignment)
const deleteHistory = async (req, res) => {
    try {
        const { type, id } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role?.name;

        if (!type || !id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin type hoặc id'
            });
        }

        console.log('🗑️ Delete history:', { type, id, userId, userRole });

        if (type === 'task') {
            const task = await Task.findByPk(id);
            if (!task) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });
            }

            // Reset approval fields
            await task.update({
                approvedBy: null,
                approvedAt: null,
                requestedCompletionAt: null
            });

            return res.json({
                success: true,
                message: 'Đã xóa lịch sử phê duyệt công việc'
            });
        } else if (type === 'subtask') {
            const subtask = await Subtask.findByPk(id);
            if (!subtask) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy công việc nhỏ' });
            }

            // Reset approval fields
            await subtask.update({
                approvedBy: null,
                approvedAt: null,
                requestedCompletionAt: null
            });

            return res.json({
                success: true,
                message: 'Đã xóa lịch sử phê duyệt công việc nhỏ'
            });
        } else if (type === 'assignment') {
            const { Assignment } = require('../models');
            const assignment = await Assignment.findByPk(id);
            if (!assignment) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy phân công' });
            }

            // Delete the assignment record completely
            await assignment.destroy();

            return res.json({
                success: true,
                message: 'Đã xóa lịch sử chấp nhận yêu cầu'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Loại không hợp lệ'
            });
        }
    } catch (error) {
        console.error('Delete history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa lịch sử',
            error: error.message
        });
    }
};

module.exports = {
    getPendingApprovals,
    approveTaskCompletion,
    rejectTaskCompletion,
    approveSubtaskCompletion,
    rejectSubtaskCompletion,
    getApprovedHistory,
    deleteHistory
};
