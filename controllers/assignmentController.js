const { Assignment, Task, Subtask, Notification, UserNotification, User, Group, GroupProject, DuAn } = require('../models');
const emailService = require('../services/emailService');

// Manager creates an assignment (proposal) for a task or subtask
exports.createAssignment = async (req, res) => {
    try {
        const managerId = req.user.id;
        const { taskId, subtaskId, assigneeId, title, content } = req.body;

        if (!assigneeId || (!taskId && !subtaskId)) {
            return res.status(400).json({ success: false, message: 'Thiếu assigneeId hoặc taskId/subtaskId' });
        }

        const assignment = await Assignment.create({
            taskId: taskId || null,
            subtaskId: subtaskId || null,
            managerId,
            assigneeId,
            status: 'pending'
        });

        // Build notification for assignee
        const itemName = taskId ? (await Task.findByPk(taskId)).tentask : (await Subtask.findByPk(subtaskId)).tenSubtask;
        const notifTitle = title || `Giao việc: ${itemName}`;
        const notifContent = content || `Bạn được yêu cầu nhận công việc: ${itemName}`;

        const notification = await Notification.create({
            title: notifTitle,
            content: notifContent,
            type: 'task',
            priority: 'medium',
            targetAudience: 'member', // keep role-level too; we'll link to specific user via UserNotification
            authorId: managerId,
            status: 'published',
            publishedAt: new Date()
        });

        // Create user-specific notification linking to assignment
        await UserNotification.create({
            userId: assigneeId,
            notificationId: notification.id,
            isRead: false,
            meta: { assignmentId: assignment.id }
        });

        // Return assignment with notification info
        const assWithRelations = await Assignment.findByPk(assignment.id, {
            include: [
                { model: User, as: 'manager', attributes: ['id', 'manv', 'hoten', 'email'] },
                { model: User, as: 'assignee', attributes: ['id', 'manv', 'hoten', 'email'] }
            ]
        });

        // Send email notification to assignee
        try {
            const assignee = assWithRelations.assignee;
            const manager = assWithRelations.manager;

            if (assignee.email) {
                await emailService.sendAssignmentNotification(
                    assignee.email,
                    assignee.hoten || assignee.manv,
                    itemName,
                    manager.hoten || manager.manv
                );
                console.log(`Assignment email sent to: ${assignee.email}`);
            } else {
                console.log('Assignee email not found, skipping email notification');
            }
        } catch (emailError) {
            console.error('Error sending assignment email:', emailError);
            // Don't fail the whole request if email fails
        }

        res.status(201).json({ success: true, message: 'Đã tạo đề nghị giao việc', data: assWithRelations });
    } catch (error) {
        console.error('createAssignment error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo đề nghị giao việc', error: error.message });
    }
};

// Assignee accepts assignment
exports.acceptAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // assignment id

        const assignment = await Assignment.findByPk(id);
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment không tồn tại' });
        if (assignment.assigneeId !== userId) return res.status(403).json({ success: false, message: 'Không có quyền' });
        if (assignment.status !== 'pending') return res.status(400).json({ success: false, message: 'Assignment không ở trạng thái pending' });

        // Update assignment status
        await assignment.update({ status: 'accepted' });

        // Assign to task/subtask
        // Only update the specific item being assigned, not the parent task
        if (assignment.subtaskId) {
            // If assigning a subtask, only update the subtask
            const sub = await Subtask.findByPk(assignment.subtaskId);
            if (sub) await sub.update({ nguoiThucHienId: userId });
        } else if (assignment.taskId) {
            // Only update task if this is a direct task assignment (no subtaskId)
            const task = await Task.findByPk(assignment.taskId);
            if (task) await task.update({ nguoiDuocGiaoId: userId });
        }

        // Notify manager about acceptance
        const manager = await User.findByPk(assignment.managerId);
        const notification = await Notification.create({
            title: 'Đồng ý nhận việc',
            content: `Nhân viên đã chấp nhận giao việc (id:${assignment.id})`,
            type: 'task',
            priority: 'low',
            targetAudience: 'manager',
            authorId: userId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: assignment.managerId,
            notificationId: notification.id,
            isRead: false,
            meta: { assignmentId: assignment.id, action: 'accepted' }
        });

        // Send email notification to manager about acceptance
        try {
            const assignee = await User.findByPk(userId, { attributes: ['hoten', 'manv'] });
            const itemName = assignment.taskId ?
                (await Task.findByPk(assignment.taskId)).tentask :
                (await Subtask.findByPk(assignment.subtaskId)).tenSubtask;

            if (manager.email) {
                await emailService.sendAssignmentUpdateNotification(
                    manager.email,
                    manager.hoten || manager.manv,
                    itemName,
                    'accepted'
                );
                console.log(`Assignment acceptance email sent to manager: ${manager.email}`);
            }
        } catch (emailError) {
            console.error('Error sending acceptance email to manager:', emailError);
        }

        res.json({ success: true, message: 'Đã chấp nhận giao việc' });
    } catch (error) {
        console.error('acceptAssignment error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi chấp nhận', error: error.message });
    }
};

// Assignee declines assignment (requires reason)
exports.declineAssignment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối' });

        const assignment = await Assignment.findByPk(id);
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment không tồn tại' });
        if (assignment.assigneeId !== userId) return res.status(403).json({ success: false, message: 'Không có quyền' });
        if (assignment.status !== 'pending') return res.status(400).json({ success: false, message: 'Assignment không ở trạng thái pending' });

        await assignment.update({ status: 'declined', reason });

        // Notify manager about decline with reason
        const notification = await Notification.create({
            title: 'Từ chối nhận việc',
            content: `Nhân viên đã từ chối giao việc (id:${assignment.id}). Lý do: ${reason}`,
            type: 'task',
            priority: 'medium',
            targetAudience: 'manager',
            authorId: userId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: assignment.managerId,
            notificationId: notification.id,
            isRead: false,
            meta: { assignmentId: assignment.id, action: 'declined', reason }
        });

        // Send email notification to manager about decline
        try {
            const manager = await User.findByPk(assignment.managerId, { attributes: ['hoten', 'manv', 'email'] });
            const assignee = await User.findByPk(userId, { attributes: ['hoten', 'manv'] });
            const itemName = assignment.taskId ?
                (await Task.findByPk(assignment.taskId)).tentask :
                (await Subtask.findByPk(assignment.subtaskId)).tenSubtask;

            if (manager.email) {
                await emailService.sendAssignmentUpdateNotification(
                    manager.email,
                    manager.hoten || manager.manv,
                    itemName,
                    'declined',
                    reason
                );
                console.log(`Assignment decline email sent to manager: ${manager.email}`);
            }
        } catch (emailError) {
            console.error('Error sending decline email to manager:', emailError);
        }

        res.json({ success: true, message: 'Đã từ chối giao việc' });
    } catch (error) {
        console.error('declineAssignment error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi từ chối', error: error.message });
    }
};

// Optional: get assignment by id
exports.getAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findByPk(id, {
            include: [
                { model: Task, as: 'task' },
                { model: Subtask, as: 'subtask' },
                { model: User, as: 'manager', attributes: ['id', 'hoten', 'manv'] },
                { model: User, as: 'assignee', attributes: ['id', 'hoten', 'manv'] }
            ]
        });
        if (!assignment) return res.status(404).json({ success: false, message: 'Không tìm thấy assignment' });
        res.json({ success: true, data: assignment });
    } catch (error) {
        console.error('getAssignment error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy assignment', error: error.message });
    }
};

// Member requests to join a task or subtask — creates a notification for the task manager
exports.requestToJoin = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { taskId, subtaskId, message } = req.body;

        if (!taskId && !subtaskId) return res.status(400).json({ success: false, message: 'Thiếu taskId hoặc subtaskId' });

        let managerId = null;
        let itemName = '';

        if (subtaskId) {
            const sub = await Subtask.findByPk(subtaskId, { include: [{ model: Task, as: 'task' }] });
            if (!sub) return res.status(404).json({ success: false, message: 'Subtask không tồn tại' });
            itemName = sub.tenSubtask || (sub.task && sub.task.tentask) || 'Subtask';
            managerId = sub.task ? sub.task.nguoiGiaoId : null;
        } else if (taskId) {
            const task = await Task.findByPk(taskId);
            if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });
            itemName = task.tentask;
            managerId = task.nguoiGiaoId;
        }

        if (!managerId) return res.status(400).json({ success: false, message: 'Không tìm thấy người quản lý để gửi yêu cầu' });

        // Build notification for manager
        const requester = await User.findByPk(requesterId, { attributes: ['id', 'manv', 'hoten', 'email'] });
        const title = `${requester.hoten || requester.manv} yêu cầu tham gia: ${itemName}`;
        const content = message || `${requester.hoten || requester.manv} đã gửi yêu cầu tham gia công việc: ${itemName}`;

        const notification = await Notification.create({
            title,
            content,
            type: 'task',
            priority: 'low',
            targetAudience: 'manager',
            authorId: requesterId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: managerId,
            notificationId: notification.id,
            isRead: false,
            meta: { requestToJoin: true, taskId: taskId || null, subtaskId: subtaskId || null, requesterId }
        });

        // Do NOT send emails here — only create notification for manager (UI-driven flow)
        res.status(201).json({ success: true, message: 'Yêu cầu tham gia đã được gửi tới người quản lý' });
    } catch (error) {
        console.error('requestToJoin error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi gửi yêu cầu tham gia', error: error.message });
    }
};

// Manager accepts a request-to-join (assigns the requester to the task/subtask)
exports.acceptRequestToJoin = async (req, res) => {
    try {
        const managerId = req.user.id;
        const { taskId, subtaskId, requesterId } = req.body;

        if (!taskId && !subtaskId) return res.status(400).json({ success: false, message: 'Thiếu taskId hoặc subtaskId' });
        if (!requesterId) return res.status(400).json({ success: false, message: 'Thiếu requesterId' });

        // Validate manager/teamlead has permission
        let itemName = '';
        let task = null;
        if (subtaskId) {
            const sub = await Subtask.findByPk(subtaskId);
            if (!sub) return res.status(404).json({ success: false, message: 'Subtask không tồn tại' });
            task = await Task.findByPk(sub.taskId, { include: [{ model: DuAn, as: 'duan' }] });
            if (!task) return res.status(404).json({ success: false, message: 'Task cha không tồn tại' });
            itemName = sub.tenSubtask || task.tentask;
        } else {
            task = await Task.findByPk(taskId, { include: [{ model: DuAn, as: 'duan' }] });
            if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });
            itemName = task.tentask;
        }

        // Check permission: user must be task creator OR teamlead of group containing the requester
        let hasPermission = task.nguoiGiaoId === managerId;
        console.log('🔍 Permission check:', {
            managerId,
            requesterId,
            taskNguoiGiaoId: task.nguoiGiaoId,
            isTaskCreator: hasPermission,
            duanId: task.duan?.id,
            taskId: task.id
        });
        
        if (!hasPermission) {
            // Check if manager is teamlead of a group that contains the requester
            const { GroupMember } = require('../models');
            const requesterGroups = await GroupMember.findAll({
                where: { userId: requesterId },
                attributes: ['groupId']
            });
            const requesterGroupIds = requesterGroups.map(g => g.groupId);
            console.log('🔍 Requester groups:', requesterGroupIds);
            
            if (requesterGroupIds.length > 0) {
                const managerGroup = await Group.findOne({
                    where: {
                        id: requesterGroupIds,
                        leaderId: managerId,
                        status: 'active'
                    }
                });
                console.log('🔍 Manager is teamlead of requester group:', !!managerGroup);
                
                if (managerGroup) {
                    hasPermission = true;
                    console.log('✅ Permission granted: Manager is teamlead of requester group');
                }
            }
        }
        
        if (!hasPermission) {
            console.log('❌ Permission denied for user:', managerId);
            return res.status(403).json({ success: false, message: 'Không có quyền chấp nhận yêu cầu này' });
        }
        
        console.log('✅ Permission granted, proceeding with accept');

        // Create an Assignment record and immediately accept it
        const assignment = await Assignment.create({
            taskId: taskId || null,
            subtaskId: subtaskId || null,
            managerId,
            assigneeId: requesterId,
            status: 'accepted',
            acceptedBy: managerId,
            acceptedAt: new Date()
        });

        // Update task/subtask assignee
        if (subtaskId) {
            await Subtask.update({ nguoiThucHienId: requesterId }, { where: { id: subtaskId } });
        } else if (taskId) {
            await Task.update({ nguoiDuocGiaoId: requesterId }, { where: { id: taskId } });
        }

        // Notify requester about acceptance
        const notification = await Notification.create({
            title: 'Yêu cầu tham gia được chấp nhận',
            content: `Yêu cầu tham gia công việc "${itemName}" đã được chấp nhận. Bạn đã được phân công.`,
            type: 'task',
            priority: 'low',
            targetAudience: 'member',
            authorId: managerId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: requesterId,
            notificationId: notification.id,
            isRead: false,
            meta: { assignmentId: assignment.id, action: 'accepted' }
        });

        // Mark ALL related request-to-join notifications as processed (for all managers/teamleads)
        try {
            const candidates = await UserNotification.findAll();
            const related = candidates.filter(un => un.meta && un.meta.requestToJoin &&
                ((taskId && un.meta.taskId === taskId) || (subtaskId && un.meta.subtaskId === subtaskId)) &&
                un.meta.requesterId === requesterId
            );
            console.log(`🔄 Marking ${related.length} notifications as processed (accepted)`);
            for (const rn of related) {
                rn.isRead = true;
                rn.meta = { ...rn.meta, processed: true, processedAt: new Date(), action: 'accepted', processedBy: managerId };
                await rn.save();
            }
        } catch (e) {
            console.error('Error marking notifications processed:', e);
        }

        res.json({ success: true, message: 'Đã chấp nhận yêu cầu và phân công công việc' });
    } catch (error) {
        console.error('acceptRequestToJoin error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi chấp nhận yêu cầu', error: error.message });
    }
};

// Manager declines a request-to-join
exports.declineRequestToJoin = async (req, res) => {
    try {
        const managerId = req.user.id;
        const { taskId, subtaskId, requesterId, reason } = req.body;

        if (!taskId && !subtaskId) return res.status(400).json({ success: false, message: 'Thiếu taskId hoặc subtaskId' });
        if (!requesterId) return res.status(400).json({ success: false, message: 'Thiếu requesterId' });

        // Validate manager/teamlead has permission
        let task = null;
        if (subtaskId) {
            const sub = await Subtask.findByPk(subtaskId);
            if (!sub) return res.status(404).json({ success: false, message: 'Subtask không tồn tại' });
            task = await Task.findByPk(sub.taskId, { include: [{ model: DuAn, as: 'duan' }] });
            if (!task) return res.status(404).json({ success: false, message: 'Task cha không tồn tại' });
        } else {
            task = await Task.findByPk(taskId, { include: [{ model: DuAn, as: 'duan' }] });
            if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });
        }

        // Check permission: user must be task creator OR teamlead of group containing the requester
        let hasPermission = task.nguoiGiaoId === managerId;
        console.log('🔍 Permission check:', {
            managerId,
            requesterId,
            taskNguoiGiaoId: task.nguoiGiaoId,
            isTaskCreator: hasPermission,
            duanId: task.duan?.id,
            taskId: task.id
        });
        
        if (!hasPermission) {
            // Check if manager is teamlead of a group that contains the requester
            const { GroupMember } = require('../models');
            const requesterGroups = await GroupMember.findAll({
                where: { userId: requesterId },
                attributes: ['groupId']
            });
            const requesterGroupIds = requesterGroups.map(g => g.groupId);
            console.log('🔍 Requester groups:', requesterGroupIds);
            
            if (requesterGroupIds.length > 0) {
                const managerGroup = await Group.findOne({
                    where: {
                        id: requesterGroupIds,
                        leaderId: managerId,
                        status: 'active'
                    }
                });
                console.log('🔍 Manager is teamlead of requester group:', !!managerGroup);
                
                if (managerGroup) {
                    hasPermission = true;
                    console.log('✅ Permission granted: Manager is teamlead of requester group');
                }
            }
        }
        
        if (!hasPermission) {
            console.log('❌ Permission denied for user:', managerId);
            return res.status(403).json({ success: false, message: 'Không có quyền từ chối yêu cầu này' });
        }
        
        console.log('✅ Permission granted, proceeding with decline');

        // Create notification to requester about decline
        const itemName = subtaskId ? (await Subtask.findByPk(subtaskId)).tenSubtask : (await Task.findByPk(taskId)).tentask;
        const notification = await Notification.create({
            title: 'Yêu cầu tham gia bị từ chối',
            content: `Yêu cầu tham gia công việc "${itemName}" đã bị từ chối.${reason ? ' Lý do: ' + reason : ''}`,
            type: 'task',
            priority: 'low',
            targetAudience: 'member',
            authorId: managerId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: requesterId,
            notificationId: notification.id,
            isRead: false,
            meta: { action: 'request_declined', taskId: taskId || null, subtaskId: subtaskId || null }
        });

        // Mark ALL related request-to-join notifications as processed (for all managers/teamleads)
        try {
            const candidates = await UserNotification.findAll();
            const related = candidates.filter(un => un.meta && un.meta.requestToJoin &&
                ((taskId && un.meta.taskId === taskId) || (subtaskId && un.meta.subtaskId === subtaskId)) &&
                un.meta.requesterId === requesterId
            );
            console.log(`🔄 Marking ${related.length} notifications as processed (declined)`);
            for (const rn of related) {
                rn.isRead = true;
                rn.meta = { ...rn.meta, processed: true, processedAt: new Date(), action: 'declined', processedBy: managerId };
                await rn.save();
            }
        } catch (e) {
            console.error('Error marking notifications processed:', e);
        }

        res.json({ success: true, message: 'Đã từ chối yêu cầu tham gia' });
    } catch (error) {
        console.error('declineRequestToJoin error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi từ chối yêu cầu', error: error.message });
    }
};

// Member: list available tasks/subtasks that the member can request from their teamlead
exports.getAvailableForRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Group, Task, Subtask, User } = require('../models');

        // Find the group(s) where the current user is a member
        const group = await Group.findOne({
            where: { status: 'active' },
            include: [{ model: User, as: 'members', where: { id: userId }, through: { attributes: [] } }]
        });

        if (!group) {
            return res.json({ success: true, data: { tasks: [], subtasks: [] }, message: 'Bạn không thuộc nhóm nào hoặc không có teamlead' });
        }

        const leaderId = group.leaderId;
        if (!leaderId) return res.json({ success: true, data: { tasks: [], subtasks: [] } });

        // Tasks created by the teamlead that currently have no assignee
        const tasks = await Task.findAll({
            where: { nguoiGiaoId: leaderId, nguoiDuocGiaoId: null },
            include: [
                { model: User, as: 'nguoiGiao', attributes: ['id', 'hoten', 'manv'] },
                { model: Subtask, as: 'subtasks', attributes: ['id', 'tenSubtask', 'trangThai', 'nguoiThucHienId'] }
            ],
            order: [['ngayKetThuc', 'ASC'], ['createdAt', 'DESC']]
        });

        // Subtasks whose parent task is created by the teamlead and subtask has no performer
        const subtasks = await Subtask.findAll({
            where: { nguoiThucHienId: null },
            include: [
                {
                    model: Task,
                    as: 'task',
                    where: { nguoiGiaoId: leaderId },
                    attributes: ['id', 'tentask', 'nguoiGiaoId']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Exclude any items that are already the current user's tasks (defensive)
        const filteredTasks = tasks.filter(t => t.nguoiDuocGiaoId !== userId);
        const filteredSubtasks = subtasks.filter(st => st.nguoiThucHienId !== userId);

        res.json({ success: true, data: { tasks: filteredTasks, subtasks: filteredSubtasks }, group: { id: group.id, name: group.name } });
    } catch (error) {
        console.error('getAvailableForRequest error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách công việc có thể yêu cầu', error: error.message });
    }
}
