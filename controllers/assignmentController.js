const { Assignment, Task, Subtask, Notification, UserNotification, User } = require('../models');
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
        if (assignment.taskId) {
            const task = await Task.findByPk(assignment.taskId);
            if (task) await task.update({ nguoiDuocGiaoId: userId });
        }
        if (assignment.subtaskId) {
            const sub = await Subtask.findByPk(assignment.subtaskId);
            if (sub) await sub.update({ nguoiThucHienId: userId });
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
