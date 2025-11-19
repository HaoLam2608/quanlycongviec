const { User, Task, Subtask, DuAn, Worklog, GroupMember, GroupProject } = require('../models');
const { Op } = require('sequelize');

// Get member dashboard statistics
const getMemberStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count tasks assigned to user
        const totalTasksCount = await Task.count({
            where: { nguoiDuocGiaoId: userId }
        });

        const completedTasksCount = await Task.count({
            where: {
                nguoiDuocGiaoId: userId,
                trangThai: 'Hoàn thành'
            }
        });

        const inProgressTasksCount = await Task.count({
            where: {
                nguoiDuocGiaoId: userId,
                trangThai: 'Đang chạy'
            }
        });

        // Count pending approval tasks
        const pendingApprovalTasksCount = await Task.count({
            where: {
                nguoiDuocGiaoId: userId,
                trangThai: 'Chờ xác nhận hoàn thành'
            }
        });

        // Count overdue tasks (deadline passed but not completed)
        const overdueTasksCount = await Task.count({
            where: {
                nguoiDuocGiaoId: userId,
                trangThai: { [Op.notIn]: ['Hoàn thành', 'Chờ xác nhận hoàn thành'] },
                ngayKetThuc: { [Op.lt]: today }
            }
        });

        // Count subtasks assigned to user
        const totalSubtasksCount = await Subtask.count({
            where: { nguoiThucHienId: userId }
        });

        const completedSubtasksCount = await Subtask.count({
            where: {
                nguoiThucHienId: userId,
                trangThai: 'Hoàn thành'
            }
        });

        const inProgressSubtasksCount = await Subtask.count({
            where: {
                nguoiThucHienId: userId,
                trangThai: 'Đang chạy'
            }
        });

        // Count pending approval subtasks
        const pendingApprovalSubtasksCount = await Subtask.count({
            where: {
                nguoiThucHienId: userId,
                trangThai: 'Chờ xác nhận hoàn thành'
            }
        });

        // Count overdue subtasks
        const overdueSubtasksCount = await Subtask.count({
            where: {
                nguoiThucHienId: userId,
                trangThai: { [Op.notIn]: ['Hoàn thành', 'Chờ xác nhận hoàn thành'] },
                ngayKetThuc: { [Op.lt]: today }
            }
        });

        // Only count subtasks for mobile app (members primarily work with subtasks)
        const totalTasks = totalSubtasksCount;
        const completedTasks = completedSubtasksCount;
        const inProgressTasks = inProgressSubtasksCount;
        const pendingApprovalTasks = pendingApprovalSubtasksCount;
        const overdueTasks = overdueSubtasksCount;

        const completionRate = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        res.json({
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingApprovalTasks,
            overdueTasks,
            completionRate,
            // Detailed breakdown
            breakdown: {
                tasks: {
                    total: totalTasksCount,
                    completed: completedTasksCount,
                    inProgress: inProgressTasksCount,
                    pendingApproval: pendingApprovalTasksCount,
                    overdue: overdueTasksCount
                },
                subtasks: {
                    total: totalSubtasksCount,
                    completed: completedSubtasksCount,
                    inProgress: inProgressSubtasksCount,
                    pendingApproval: pendingApprovalSubtasksCount,
                    overdue: overdueSubtasksCount
                }
            }
        });

    } catch (error) {
        console.error('Error getting member stats:', error);
        res.status(500).json({ message: 'Không thể lấy thống kê thành viên', error: error.message });
    }
};

// Get today's tasks for member
const getTodayTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get tasks due today
        const tasks = await Task.findAll({
            where: {
                nguoiDuocGiaoId: userId,
                ngayKetThuc: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            },
            include: [
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                }
            ],
            order: [['mucDoUuTien', 'DESC']]
        });

        // Get subtasks due today
        const subtasks = await Subtask.findAll({
            where: {
                nguoiThucHienId: userId,
                ngayKetThuc: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask'],
                    include: [{
                        model: DuAn,
                        as: 'duan',
                        attributes: ['id', 'tenduan']
                    }]
                }
            ],
            order: [['trangThai', 'ASC']]
        });

        // Format response
        const todayTasks = [
            ...tasks.map(task => ({
                id: task.id,
                tentask: task.tentask,
                priority: task.mucDoUuTien || 'medium',
                deadline: task.ngayKetThuc,
                status: task.trangThai,
                type: 'task',
                projectName: task.duan?.tenduan
            })),
            ...subtasks.map(subtask => ({
                id: subtask.id,
                tentask: subtask.task?.tentask,
                tenSubtask: subtask.tenSubtask,
                priority: 'medium', // Subtask không có priority field
                deadline: subtask.ngayKetThuc,
                status: subtask.trangThai,
                type: 'subtask',
                projectName: subtask.task?.duan?.tenduan
            }))
        ];

        res.json(todayTasks);

    } catch (error) {
        console.error('Error getting today tasks:', error);
        res.status(500).json({ message: 'Không thể lấy công việc hôm nay', error: error.message });
    }
};

// Get overdue tasks for member
const getOverdueTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get overdue tasks
        const tasks = await Task.findAll({
            where: {
                nguoiDuocGiaoId: userId,
                trangThai: { [Op.ne]: 'Hoàn thành' },
                ngayKetThuc: { [Op.lt]: today }
            },
            include: [
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                }
            ],
            order: [['ngayKetThuc', 'ASC']]
        });

        // Get overdue subtasks
        const subtasks = await Subtask.findAll({
            where: {
                nguoiThucHienId: userId,
                trangThai: { [Op.ne]: 'Hoàn thành' },
                ngayKetThuc: { [Op.lt]: today }
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask'],
                    include: [{
                        model: DuAn,
                        as: 'duan',
                        attributes: ['id', 'tenduan']
                    }]
                }
            ],
            order: [['ngayKetThuc', 'ASC']]
        });

        // Calculate days overdue and format response
        const overdueTasks = [
            ...tasks.map(task => {
                const deadline = new Date(task.ngayKetThuc);
                const diffTime = today.getTime() - deadline.getTime();
                const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    id: task.id,
                    title: task.tentask,
                    deadline: task.ngayKetThuc,
                    priority: task.mucDoUuTien || 'medium',
                    status: task.trangThai,
                    daysOverdue,
                    type: 'task',
                    project: task.duan?.tenduan
                };
            }),
            ...subtasks.map(subtask => {
                const deadline = new Date(subtask.ngayKetThuc);
                const diffTime = today.getTime() - deadline.getTime();
                const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    id: subtask.id,
                    title: subtask.tenSubtask,
                    deadline: subtask.ngayKetThuc,
                    priority: 'medium', // Subtask không có priority field
                    status: subtask.trangThai,
                    daysOverdue,
                    type: 'subtask',
                    parentTask: subtask.task?.tentask,
                    project: subtask.task?.duan?.tenduan
                };
            })
        ].sort((a, b) => b.daysOverdue - a.daysOverdue); // Sort by most overdue first

        res.json(overdueTasks);

    } catch (error) {
        console.error('Error getting overdue tasks:', error);
        res.status(500).json({ message: 'Không thể lấy công việc quá hạn', error: error.message });
    }
};

// Get upcoming tasks (next 7 days)
const getUpcomingTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const days = parseInt(req.query.days) || 7;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);

        // Get tasks with upcoming deadlines
        const tasks = await Task.findAll({
            where: {
                nguoiDuocGiaoId: userId,
                trangThai: { [Op.ne]: 'Hoàn thành' },
                ngayKetThuc: {
                    [Op.gte]: today,
                    [Op.lte]: futureDate
                }
            },
            include: [
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                }
            ],
            order: [['ngayKetThuc', 'ASC']]
        });

        // Get subtasks with upcoming deadlines
        const subtasks = await Subtask.findAll({
            where: {
                nguoiThucHienId: userId,
                trangThai: { [Op.ne]: 'Hoàn thành' },
                ngayKetThuc: {
                    [Op.gte]: today,
                    [Op.lte]: futureDate
                }
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask'],
                    include: [{
                        model: DuAn,
                        as: 'duan',
                        attributes: ['id', 'tenduan']
                    }]
                }
            ],
            order: [['ngayKetThuc', 'ASC']]
        });

        // Calculate days left and format response
        const upcomingTasks = [
            ...tasks.map(task => {
                const deadline = new Date(task.ngayKetThuc);
                const diffTime = deadline.getTime() - today.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    id: task.id,
                    title: task.tentask,
                    deadline: task.ngayKetThuc,
                    priority: task.mucDoUuTien || 'medium',
                    daysLeft,
                    projectName: task.duan?.tenduan,
                    status: task.trangThai,
                    type: 'task'
                };
            }),
            ...subtasks.map(subtask => {
                const deadline = new Date(subtask.ngayKetThuc);
                const diffTime = deadline.getTime() - today.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    id: subtask.id,
                    title: subtask.tenSubtask,
                    deadline: subtask.ngayKetThuc,
                    priority: 'medium', // Subtask không có priority field
                    daysLeft,
                    projectName: subtask.task?.duan?.tenduan,
                    status: subtask.trangThai,
                    type: 'subtask',
                    parentTask: subtask.task?.tentask
                };
            })
        ].sort((a, b) => a.daysLeft - b.daysLeft); // Sort by days left

        res.json(upcomingTasks);

    } catch (error) {
        console.error('Error getting upcoming tasks:', error);
        res.status(500).json({ message: 'Không thể lấy công việc sắp tới', error: error.message });
    }
};

// Get recent activities for member
const getRecentActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        // Get recent worklogs
        const recentWorklogs = await Worklog.findAll({
            where: { userId: userId },
            include: [
                {
                    model: Task,
                    attributes: ['id', 'tentask'],
                    required: false
                },
                {
                    model: Subtask,
                    attributes: ['id', 'tenSubtask'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limit
        });

        // Get recent task status changes (tasks assigned to user that were recently updated)
        const recentTaskUpdates = await Task.findAll({
            where: { nguoiDuocGiaoId: userId },
            attributes: ['id', 'tentask', 'trangThai', 'updatedAt'],
            order: [['updatedAt', 'DESC']],
            limit: Math.floor(limit / 2)
        });

        // Get recent subtask status changes
        const recentSubtaskUpdates = await Subtask.findAll({
            where: { nguoiThucHienId: userId },
            attributes: ['id', 'tenSubtask', 'trangThai', 'updatedAt'],
            include: [{
                model: Task,
                as: 'task',
                attributes: ['id', 'tentask']
            }],
            order: [['updatedAt', 'DESC']],
            limit: Math.floor(limit / 2)
        });

        // Format activities from worklogs
        const worklogActivities = recentWorklogs.map(worklog => {
            const worklogData = worklog.toJSON ? worklog.toJSON() : worklog;
            const taskTitle = worklogData.Task?.tentask || worklogData.Subtask?.tenSubtask || 'Unknown task';
            const hours = worklogData.hours || worklogData.hours_spent || 0;
            const timeAgo = getTimeAgo(worklogData.createdAt);

            return {
                id: `worklog-${worklogData.id}`,
                action: `Log ${hours}h làm việc`,
                taskTitle,
                timestamp: timeAgo,
                type: 'worklog',
                createdAt: worklogData.createdAt
            };
        });

        // Format activities from task updates
        const taskActivities = recentTaskUpdates.map(task => {
            const timeAgo = getTimeAgo(task.updatedAt);
            return {
                id: `task-${task.id}`,
                action: `Cập nhật trạng thái: ${task.trangThai}`,
                taskTitle: task.tentask,
                timestamp: timeAgo,
                type: 'status_change',
                createdAt: task.updatedAt
            };
        });

        // Format activities from subtask updates
        const subtaskActivities = recentSubtaskUpdates.map(subtask => {
            const timeAgo = getTimeAgo(subtask.updatedAt);
            return {
                id: `subtask-${subtask.id}`,
                action: `Cập nhật trạng thái: ${subtask.trangThai}`,
                taskTitle: subtask.tenSubtask,
                timestamp: timeAgo,
                type: 'status_change',
                createdAt: subtask.updatedAt,
                parentTask: subtask.task?.tentask
            };
        });

        // Combine and sort all activities by createdAt
        const allActivities = [...worklogActivities, ...taskActivities, ...subtaskActivities]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);

        res.json(allActivities);

    } catch (error) {
        console.error('Error getting recent activities:', error);
        res.status(500).json({ message: 'Không thể lấy hoạt động gần đây', error: error.message });
    }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    } else {
        return `${diffDays} ngày trước`;
    }
};

// Helper function to map status from database to display format
const mapStatusToDisplay = (status) => {
    const statusMap = {
        'chua_bat_dau': 'Chưa bắt đầu',
        'dang_chay': 'Đang chạy',
        'da_hoan_thanh': 'Hoàn thành',
        'tam_dung': 'Tạm dừng',
        'huy': 'Hủy'
    };
    return statusMap[status] || status;
};

// Get member's tasks with filters
const getMemberTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, projectId, dateFrom, dateTo, search } = req.query;

        // Build where clause for tasks
        const taskWhere = { nguoiDuocGiaoId: userId };
        if (status) taskWhere.trangThai = status;
        if (priority) taskWhere.mucDoUuTien = priority;
        if (projectId) taskWhere.duanId = parseInt(projectId);
        if (dateFrom || dateTo) {
            taskWhere.ngayKetThuc = {};
            if (dateFrom) taskWhere.ngayKetThuc[Op.gte] = new Date(dateFrom);
            if (dateTo) taskWhere.ngayKetThuc[Op.lte] = new Date(dateTo);
        }
        if (search) {
            taskWhere.tentask = { [Op.like]: `%${search}%` };
        }

        // Get tasks assigned to user
        const tasks = await Task.findAll({
            where: taskWhere,
            include: [
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan', 'status']
                },
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv']
                },
                {
                    model: Subtask,
                    as: 'subtasks',
                    required: false, // Lấy tất cả subtasks của task, không chỉ subtasks của user
                    include: [{
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'hoten', 'manv']
                    }],
                    attributes: ['id', 'tenSubtask', 'mota', 'trangThai', 'ngayBatDau', 'ngayKetThuc', 'ngayHoanThanh', 'thuTu', 'ghiChu']
                }
            ],
            order: [['ngayKetThuc', 'ASC']]
        });

        // Build where clause for subtasks
        const subtaskWhere = { nguoiThucHienId: userId };
        if (status) subtaskWhere.trangThai = status;
        // Subtask không có priority field
        if (dateFrom || dateTo) {
            subtaskWhere.ngayKetThuc = {};
            if (dateFrom) subtaskWhere.ngayKetThuc[Op.gte] = new Date(dateFrom);
            if (dateTo) subtaskWhere.ngayKetThuc[Op.lte] = new Date(dateTo);
        }
        if (search) {
            subtaskWhere.tenSubtask = { [Op.like]: `%${search}%` };
        }

        // Get subtasks assigned to user (subtasks được giao trực tiếp cho user)
        const subtasks = await Subtask.findAll({
            where: subtaskWhere,
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask', 'mota', 'trangThai', 'mucDoUuTien', 'duanId', 'nguoiDuocGiaoId'],
                    include: [
                        {
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan', 'status'],
                            where: projectId ? { id: parseInt(projectId) } : undefined,
                            required: projectId ? true : false
                        },
                        {
                            model: User,
                            as: 'nguoiDuocGiao',
                            attributes: ['id', 'hoten', 'manv']
                        }
                    ]
                }
            ],
            order: [['ngayKetThuc', 'ASC']]
        });

        res.json({
            tasks,
            subtasks
        });

    } catch (error) {
        console.error('Error getting member tasks:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách công việc', error: error.message });
    }
};

// Get member's projects
const getMemberProjects = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log('🔍 [getMemberProjects] User ID:', userId);
        console.log('👤 [getMemberProjects] User info:', req.user);

        // Find groups that the user is a member of
        const groupMembers = await GroupMember.findAll({
            where: { userId },
            attributes: ['groupId']
        });

        console.log('👥 [getMemberProjects] User is in groups:', groupMembers.map(gm => gm.groupId));

        const groupIds = groupMembers.map(gm => gm.groupId);

        // Find projects associated with those groups
        const groupProjects = await GroupProject.findAll({
            where: { groupId: { [Op.in]: groupIds } },
            attributes: ['projectId']
        });

        const projectIds = [...new Set(groupProjects.map(gp => gp.projectId))];

        // Also include projects where user is directly assigned as userId
        const directProjects = await DuAn.findAll({
            where: { userId },
            attributes: ['id']
        });

        // Also include projects where the user has tasks assigned (distinct duanId)
        const taskProjectRows = await Task.findAll({
            where: { nguoiDuocGiaoId: userId, duanId: { [Op.ne]: null } },
            attributes: ['duanId'],
            group: ['duanId']
        });
        const taskProjectIds = taskProjectRows.map(t => t.duanId).filter(Boolean);

        const allProjectIds = [...new Set([
            ...projectIds,
            ...directProjects.map(p => p.id),
            ...taskProjectIds
        ])];

        console.log('📂 [getMemberProjects] All project IDs for user (groups/direct/tasks):', allProjectIds);

        // If no projects found, return early to avoid building a WHERE IN (NULL) query
        if (!allProjectIds || allProjectIds.length === 0) {
            console.log('ℹ️ [getMemberProjects] No project IDs found for user, returning empty list');
            return res.json([]);
        }

        // Get detailed project information
        const projects = await DuAn.findAll({
            where: { id: { [Op.in]: allProjectIds } },
            include: [
                {
                    model: User,
                    as: 'nguoiDamNhan',
                    attributes: ['id', 'hoten', 'manv', 'chucvu']
                },
                {
                    model: Task,
                    as: 'tasks',
                    attributes: ['id', 'trangThai', 'nguoiDuocGiaoId']
                }
            ]
        });

        // Format response with additional statistics
        const formattedProjects = await Promise.all(projects.map(async (project) => {
            // Count total tasks in project
            const totalTasks = project.tasks.length;

            // Count completed tasks
            const completedTasks = project.tasks.filter(t => t.trangThai === 'Hoàn thành').length;

            // Count tasks assigned to current user
            const myTasks = project.tasks.filter(t => t.nguoiDuocGiaoId === userId).length;

            // Count completed tasks by current user
            const myCompletedTasks = project.tasks.filter(
                t => t.nguoiDuocGiaoId === userId && t.trangThai === 'Hoàn thành'
            ).length;

            // Calculate progress
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Count team members from groups assigned to this project
            const projectGroupRelations = await GroupProject.findAll({
                where: { projectId: project.id },
                attributes: ['groupId']
            });

            const projectGroupIds = projectGroupRelations.map(gp => gp.groupId);

            const teamMembers = await GroupMember.count({
                where: { groupId: { [Op.in]: projectGroupIds } },
                distinct: true,
                col: 'userId'
            });

            return {
                id: project.id,
                name: project.tenduan,
                description: project.mota,
                status: mapStatusToDisplay(project.status),
                progress,
                startDate: project.ngaybatdau,
                endDate: project.ngayketthuc,
                deadline: project.ngayketthuc,
                manager: project.nguoiDamNhan?.hoten || 'Chưa phân công',
                managerPosition: project.nguoiDamNhan?.chucvu,
                totalTasks,
                completedTasks,
                myTasks,
                myCompletedTasks,
                teamSize: teamMembers
            };
        }));

        console.log('✅ [getMemberProjects] Returning', formattedProjects.length, 'projects');

        res.json(formattedProjects);

    } catch (error) {
        console.error('❌ [getMemberProjects] Error:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách dự án', error: error.message });
    }
};

// Update task status for members (with approval workflow)
const updateMemberTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        // Accept either `status` (API canonical) or `trangThai` (frontend payload)
        const status = req.body.status || req.body.trangThai;
        const userId = req.user.id;

        console.log('🔍 [updateMemberTaskStatus] Request:', {
            taskId,
            status,
            userId,
            userInfo: { id: req.user.id, manv: req.user.manv, hoten: req.user.hoten }
        });

        const task = await Task.findByPk(taskId);
        if (!task) {
            console.log('❌ Task not found:', taskId);
            return res.status(404).json({ message: 'Không tìm thấy công việc' });
        }

        console.log('📋 Task info:', {
            id: task.id,
            tentask: task.tentask,
            nguoiDuocGiaoId: task.nguoiDuocGiaoId,
            nguoiGiaoId: task.nguoiGiaoId,
            trangThaiHienTai: task.trangThai
        });

        // Check if user is assigned to this task
        if (task.nguoiDuocGiaoId !== userId) {
            console.log('❌ Permission denied: user is not assigned to this task');
            console.log('   nguoiDuocGiaoId:', task.nguoiDuocGiaoId, '!== userId:', userId);
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật công việc này' });
        }

        console.log('✅ Permission check passed');

        console.log('✅ Permission check passed');

        // If member tries to complete task, set to pending approval instead
        if (status === 'Hoàn thành') {
            console.log('🔄 Status change: Hoàn thành -> Chờ xác nhận hoàn thành');
            task.trangThai = 'Chờ xác nhận hoàn thành';
            task.requestedCompletionAt = new Date();
            await task.save();

            console.log('✅ Task saved with pending approval status');
            return res.json({
                message: 'Đã gửi yêu cầu xác nhận hoàn thành. Chờ quản lý duyệt.',
                task
            });
        }

        // Allow other status changes
        console.log('🔄 Changing task status to:', status);
        task.trangThai = status;
        if (status === 'Đang chạy' && !task.ngayBatDau) {
            console.log('📅 Setting ngayBatDau to now');
            task.ngayBatDau = new Date();
        }
        await task.save();

        console.log('✅ Task status updated successfully');
        res.json({ message: 'Cập nhật trạng thái thành công', task });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
};

// Update subtask status for members (with approval workflow)
const updateMemberSubtaskStatus = async (req, res) => {
    try {
        const { taskId, subtaskId } = req.params;
        // Accept either `status` (API canonical) or `trangThai` (frontend payload)
        const status = req.body.status || req.body.trangThai;
        const userId = req.user.id;

        console.log('🔍 [updateMemberSubtaskStatus] Request:', {
            taskId,
            subtaskId,
            status,
            userId,
            userInfo: { id: req.user.id, manv: req.user.manv, hoten: req.user.hoten }
        });

        const subtask = await Subtask.findByPk(subtaskId, {
            include: [{
                model: Task,
                as: 'task',
                attributes: ['id', 'nguoiGiaoId', 'nguoiDuocGiaoId']
            }]
        });

        if (!subtask) {
            console.log('❌ Subtask not found:', subtaskId);
            return res.status(404).json({ message: 'Không tìm thấy công việc con' });
        }

        console.log('📋 Subtask info:', {
            id: subtask.id,
            tenSubtask: subtask.tenSubtask,
            nguoiThucHienId: subtask.nguoiThucHienId,
            parentTask: {
                id: subtask.task?.id,
                nguoiDuocGiaoId: subtask.task?.nguoiDuocGiaoId,
                nguoiGiaoId: subtask.task?.nguoiGiaoId
            },
            trangThaiHienTai: subtask.trangThai
        });

        // Check if user is assigned to this subtask or parent task
        if (subtask.nguoiThucHienId !== userId &&
            subtask.task.nguoiDuocGiaoId !== userId) {
            console.log('❌ Permission denied: user is not assigned to this subtask or parent task');
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật công việc con này' });
        }

        console.log('✅ Permission check passed');

        console.log('✅ Permission check passed');

        // If member tries to complete subtask, set to pending approval instead
        if (status === 'Hoàn thành') {
            console.log('🔄 Status change: Hoàn thành -> Chờ xác nhận hoàn thành');
            subtask.trangThai = 'Chờ xác nhận hoàn thành';
            subtask.requestedCompletionAt = new Date();
            await subtask.save();

            console.log('✅ Subtask saved with pending approval status');
            return res.json({
                message: 'Đã gửi yêu cầu xác nhận hoàn thành. Chờ quản lý duyệt.',
                subtask
            });
        }

        // Allow other status changes
        console.log('🔄 Changing subtask status to:', status);
        subtask.trangThai = status;
        if (status === 'Đang chạy' && !subtask.ngayBatDau) {
            console.log('📅 Setting ngayBatDau to now');
            subtask.ngayBatDau = new Date();
        }
        await subtask.save();

        console.log('✅ Subtask status updated successfully');
        res.json({ message: 'Cập nhật trạng thái thành công', subtask });
    } catch (error) {
        console.error('Update subtask status error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
};

// Get team members performance for teamlead
const getTeamPerformance = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log('Getting team performance for user:', userId);
        
        // Find groups where user is leader
        const db = require('../models');
        const Group = db.Group;
        
        const groups = await Group.findAll({
            where: { leaderId: userId },
            include: [{
                model: User,
                as: 'members',
                through: { attributes: [] },
                attributes: ['id', 'hoten', 'manv']
            }]
        });

        console.log('Found groups:', groups.length);

        if (!groups || groups.length === 0) {
            console.log('No groups found for this teamlead');
            return res.json({ members: [] });
        }

        // Get all unique member IDs from all groups
        const memberIds = new Set();
        groups.forEach(group => {
            if (group.members && Array.isArray(group.members)) {
                group.members.forEach(member => memberIds.add(member.id));
            }
        });

        const memberIdsArray = Array.from(memberIds);
        console.log('Found members:', memberIdsArray.length);

        if (memberIdsArray.length === 0) {
            return res.json({ members: [] });
        }

        // Calculate performance for each member
        const membersPerformance = await Promise.all(memberIdsArray.map(async (memberId) => {
            try {
                const user = await User.findByPk(memberId, {
                    attributes: ['id', 'hoten', 'manv']
                });

                if (!user) return null;

                // Get tasks stats
                const totalTasks = await Subtask.count({
                    where: { nguoiThucHienId: memberId }
                });

                const completedTasks = await Subtask.count({
                    where: {
                        nguoiThucHienId: memberId,
                        trangThai: 'Hoàn thành'
                    }
                });

                const pendingTasks = await Subtask.count({
                    where: {
                        nguoiThucHienId: memberId,
                        trangThai: { [Op.in]: ['Chưa làm', 'Đang làm'] }
                    }
                });

                // Get worklogs stats
                const worklogs = await Worklog.findAll({
                    where: {
                        userId: memberId,
                        trangThai: 'approved'
                    },
                    attributes: ['gioLam']
                });
                const totalHours = worklogs.reduce((sum, w) => sum + (w.gioLam || 0), 0);

                // Get subtasks by priority
                const highPriorityTasks = await Subtask.count({
                    where: {
                        nguoiThucHienId: memberId,
                        mucDoUuTien: 'Cao'
                    }
                });

                const mediumPriorityTasks = await Subtask.count({
                    where: {
                        nguoiThucHienId: memberId,
                        mucDoUuTien: 'Trung bình'
                    }
                });

                const lowPriorityTasks = await Subtask.count({
                    where: {
                        nguoiThucHienId: memberId,
                        mucDoUuTien: 'Thấp'
                    }
                });

                // Calculate average completion time
                const completedSubtasks = await Subtask.findAll({
                    where: {
                        nguoiThucHienId: memberId,
                        trangThai: 'Hoàn thành'
                    },
                    attributes: ['createdAt', 'updatedAt'],
                    limit: 10,
                    order: [['updatedAt', 'DESC']]
                });

                let averageCompletionTime = 0;
                if (completedSubtasks.length > 0) {
                    const totalTime = completedSubtasks.reduce((sum, task) => {
                        const diff = new Date(task.updatedAt) - new Date(task.createdAt);
                        return sum + (diff / (1000 * 60 * 60)); // Convert to hours
                    }, 0);
                    averageCompletionTime = Math.round(totalTime / completedSubtasks.length);
                }

                // Calculate quality score
                const qualityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                // Calculate on-time rate
                const tasksWithDeadline = await Subtask.findAll({
                    where: {
                        nguoiThucHienId: memberId,
                        trangThai: 'Hoàn thành',
                        ngayKetThuc: { [Op.ne]: null }
                    },
                    attributes: ['ngayKetThuc', 'updatedAt']
                });

                let onTimeCount = 0;
                tasksWithDeadline.forEach(task => {
                    if (new Date(task.updatedAt) <= new Date(task.ngayKetThuc)) {
                        onTimeCount++;
                    }
                });
                const onTimeRate = tasksWithDeadline.length > 0 
                    ? Math.round((onTimeCount / tasksWithDeadline.length) * 100) 
                    : 100;

                // Get recent activity
                const recentActivity = await Subtask.findAll({
                    where: { nguoiThucHienId: memberId },
                    order: [['updatedAt', 'DESC']],
                    limit: 5,
                    attributes: ['id', 'ten', 'trangThai', 'updatedAt']
                });

                return {
                    userId: user.id,
                    hoten: user.hoten,
                    manv: user.manv,
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    totalHours,
                    averageCompletionTime,
                    qualityScore,
                    onTimeRate,
                    tasksByPriority: {
                        high: highPriorityTasks,
                        medium: mediumPriorityTasks,
                        low: lowPriorityTasks
                    },
                    recentActivity: recentActivity.map(activity => ({
                        date: activity.updatedAt,
                        type: 'subtask',
                        description: `${activity.ten} - ${activity.trangThai}`
                    }))
                };
            } catch (memberErr) {
                console.error(`Error processing member ${memberId}:`, memberErr);
                return null;
            }
        }));

        // Filter out nulls
        const validMembers = membersPerformance.filter(m => m !== null);

        console.log('Returning performance data for', validMembers.length, 'members');
        res.json({ members: validMembers });
    } catch (err) {
        console.error('Get team performance error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
    }
};

module.exports = {
    getMemberStats,
    getTodayTasks,
    getOverdueTasks,
    getUpcomingTasks,
    getRecentActivities,
    getMemberTasks,
    getMemberProjects,
    updateMemberTaskStatus,
    updateMemberSubtaskStatus,
    getTeamPerformance
};