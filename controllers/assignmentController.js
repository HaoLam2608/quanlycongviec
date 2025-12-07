const { Assignment, Task, Subtask, Notification, UserNotification, User, Group, GroupProject, DuAn } = require('../models');
const emailService = require('../services/emailService');

/**
 * Helper: Check if user can accept/decline a join request for a task/subtask
 * Returns: { hasPermission, reason }
 * 
 * Permissions:
 * - Admin: can approve any request
 * - Task creator: can approve for their task
 * - Teamlead: can approve if requester is in their group
 * - Manager of project: can approve if requester's group participates in the project
 */
const checkJoinRequestPermission = async (userId, userRole, taskId, subtaskId, requesterId) => {
    try {
        // Admin can approve anything
        if (userRole === 'admin') {
            return { hasPermission: true, reason: 'Admin' };
        }

        let task = null;
        let subCreatorId = null;
        if (subtaskId) {
            const sub = await Subtask.findByPk(subtaskId, {
                include: [
                    {
                        model: Task,
                        as: 'task',
                        include: [
                            { model: DuAn, as: 'duan' },
                            { model: User, as: 'nguoiGiao', attributes: ['id', 'manv', 'hoten', 'email'] }
                        ]
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'manv', 'hoten', 'email']
                    }
                ]
            });
            if (!sub) return { hasPermission: false, reason: 'Subtask không tồn tại' };
            task = sub.task;
            subCreatorId = sub.createdBy || (sub.creator && sub.creator.id) || null;
        } else {
            task = await Task.findByPk(taskId, {
                include: [
                    { model: DuAn, as: 'duan' },
                    { model: User, as: 'nguoiGiao', attributes: ['id', 'manv', 'hoten', 'email'] }
                ]
            });
            if (!task) return { hasPermission: false, reason: 'Task không tồn tại' };
        }

        if (subCreatorId && subCreatorId === userId) {
            return { hasPermission: true, reason: 'Subtask creator' };
        }

        // 1. Task creator (nguoiGiaoId) can approve
        if (task.nguoiGiaoId === userId) {
            return { hasPermission: true, reason: 'Task creator' };
        }

        // Get requester's groups
        const { GroupMember } = require('../models');
        const requesterGroups = await GroupMember.findAll({
            where: { userId: requesterId },
            attributes: ['groupId'],
            raw: true
        });
        const requesterGroupIds = requesterGroups.map(g => g.groupId);

        // 2. Teamlead of requester's group can approve
        if (requesterGroupIds.length > 0) {
            const teamleadGroup = await Group.findOne({
                where: {
                    id: requesterGroupIds,
                    leaderId: userId,
                    status: 'active'
                }
            });
            if (teamleadGroup) {
                return { hasPermission: true, reason: 'Teamlead of requester group' };
            }

            // 3. Project manager: can approve if requester's group participates in the project
            if (task.duan && task.duan.userId === userId) {
                // Project manager, check if any requester group is in this project
                const { GroupProject } = require('../models');
                const groupInProject = await GroupProject.findOne({
                    where: {
                        groupId: requesterGroupIds,
                        projectId: task.duanId
                    }
                });
                if (groupInProject) {
                    return { hasPermission: true, reason: 'Project manager of requester group' };
                }
            }
        }

        return { hasPermission: false, reason: 'No permission' };
    } catch (error) {
        console.error('Error checking join request permission:', error);
        return { hasPermission: false, reason: 'Error checking permission' };
    }
};

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
        await assignment.update({
            status: 'accepted',
            acceptedBy: userId,
            acceptedAt: new Date()
        });

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
        let task = null;

        let subCreatorUser = null;
        let subCreatorId = null;

        if (subtaskId) {
            const sub = await Subtask.findByPk(subtaskId, {
                include: [
                    {
                        model: Task,
                        as: 'task',
                        include: [
                            { model: DuAn, as: 'duan' },
                            { model: User, as: 'nguoiGiao', attributes: ['id', 'manv', 'hoten', 'email'] }
                        ]
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'manv', 'hoten', 'email']
                    }
                ]
            });
            if (!sub) return res.status(404).json({ success: false, message: 'Subtask không tồn tại' });
            task = sub.task;
            itemName = sub.tenSubtask || (task && task.tentask) || 'Subtask';
            subCreatorUser = sub.creator || null;
            subCreatorId = sub.createdBy || (subCreatorUser && subCreatorUser.id) || null;
        } else if (taskId) {
            task = await Task.findByPk(taskId, {
                include: [
                    { model: DuAn, as: 'duan' },
                    { model: User, as: 'nguoiGiao', attributes: ['id', 'manv', 'hoten', 'email'] }
                ]
            });
            if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });
            itemName = task.tentask;
        }

        if (!task) return res.status(400).json({ success: false, message: 'Task/Subtask không hợp lệ' });

        // Get requester's groups
        const { GroupMember } = require('../models');
        const requesterGroupIds = await GroupMember.findAll({
            where: { userId: requesterId },
            attributes: ['groupId'],
            raw: true
        }).then(gms => gms.map(gm => gm.groupId));

        if (requesterGroupIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Bạn không nằm trong nhóm nào' });
        }

        // Find who can approve this request:
        // 1. Task creator
        // 2. Teamlead of requester's groups
        // 3. Project manager of project containing this task
        // 4. All admins

        const approversSet = new Set();

        // 0. Subtask creator (nếu có) luôn được quyền phê duyệt
        if (subCreatorId) {
            approversSet.add(subCreatorId);
        }

        // 1. Task creator
        if (task.nguoiGiaoId) {
            approversSet.add(task.nguoiGiaoId);
        }

        // 2. Teamleads of requester's groups
        const teamleads = await Group.findAll({
            where: {
                id: requesterGroupIds,
                status: 'active'
            },
            attributes: ['leaderId'],
            raw: true
        });
        teamleads.forEach(tl => {
            if (tl.leaderId) approversSet.add(tl.leaderId);
        });

        // 3. Project manager of task's project
        if (task.duanId && task.duan && task.duan.userId) {
            approversSet.add(task.duan.userId);
        }

        // 4. All admins
        const admins = await User.findAll({
            include: [{
                model: require('../models').Role,
                as: 'role',
                where: { name: 'admin' },
                attributes: ['id']
            }],
            attributes: ['id'],
            raw: true
        });
        admins.forEach(admin => approversSet.add(admin.id));

        const approverIds = Array.from(approversSet);

        if (approverIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy người có quyền duyệt yêu cầu' });
        }

        const taskCreatorUser = subCreatorUser || task?.nguoiGiao || null;
        let taskCreatorId = subCreatorId || task?.nguoiGiaoId || null;

        if (!taskCreatorId && task?.duan?.userId) {
            taskCreatorId = task.duan.userId;
        }

        if (taskCreatorId === requesterId) {
            const fallbackApprover = approverIds.find(id => id !== requesterId);
            if (fallbackApprover) {
                taskCreatorId = fallbackApprover;
            }
        }

        let taskCreator = taskCreatorUser;
        if (taskCreatorId && (!taskCreator || taskCreator.id !== taskCreatorId)) {
            taskCreator = await User.findByPk(taskCreatorId, {
                attributes: ['id', 'manv', 'hoten', 'email']
            });
        }

        console.log('📢 Creating request-to-join notification', {
            requesterId,
            taskId,
            subtaskId,
            approverIds,
            itemName,
            subCreatorId,
            subCreatorName: subCreatorUser?.hoten || subCreatorUser?.manv,
            taskCreatorId,
            taskCreatorName: taskCreator?.hoten || taskCreator?.manv
        });

        // Build notification for all approvers
        const requester = await User.findByPk(requesterId, { attributes: ['id', 'manv', 'hoten', 'email'] });
        const title = `${requester.hoten || requester.manv} yêu cầu tham gia: ${itemName}`;
        const content = message || `${requester.hoten || requester.manv} đã gửi yêu cầu tham gia công việc: ${itemName}`;

        const notification = await Notification.create({
            title,
            content,
            type: 'task',
            priority: 'low',
            targetAudience: 'specific',
            authorId: taskCreatorId || requesterId,
            status: 'published',
            publishedAt: new Date()
        });

        // Create UserNotification for each approver
        for (const approverId of approverIds) {
            await UserNotification.create({
                userId: approverId,
                notificationId: notification.id,
                isRead: false,
                meta: {
                    requestToJoin: true,
                    taskId: taskId || null,
                    subtaskId: subtaskId || null,
                    requesterId,
                    requesterName: requester.hoten || requester.manv,
                    taskCreatorId: taskCreatorId || null,
                    taskCreatorName: taskCreator?.hoten || taskCreator?.manv || null,
                    taskCreatorManv: taskCreator?.manv || null
                }
            });
        }

        res.status(201).json({ success: true, message: 'Yêu cầu tham gia đã được gửi' });
    } catch (error) {
        console.error('requestToJoin error', error);
        res.status(500).json({ success: false, message: 'Lỗi khi gửi yêu cầu tham gia', error: error.message });
    }
};

// Manager accepts a request-to-join (assigns the requester to the task/subtask)
exports.acceptRequestToJoin = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.name || req.user.role;
        let { taskId, subtaskId, requesterId } = req.body;

        // Parse to integers
        taskId = taskId ? parseInt(taskId) : null;
        subtaskId = subtaskId ? parseInt(subtaskId) : null;
        requesterId = parseInt(requesterId);

        console.log('📋 acceptRequestToJoin START:', { userId, userRole, taskId, subtaskId, requesterId });

        if (!taskId && !subtaskId) return res.status(400).json({ success: false, message: 'Thiếu taskId hoặc subtaskId' });
        if (!requesterId) return res.status(400).json({ success: false, message: 'Thiếu requesterId' });

        // Check permission using helper
        const permCheck = await checkJoinRequestPermission(userId, userRole, taskId, subtaskId, requesterId);

        console.log('🔍 acceptRequestToJoin permission check:', {
            userId,
            userRole,
            requesterId,
            taskId,
            subtaskId,
            permCheck
        });

        if (!permCheck.hasPermission) {
            return res.status(403).json({ success: false, message: `Không có quyền: ${permCheck.reason}` });
        }

        console.log(`✅ Permission granted (${permCheck.reason}), proceeding with accept`);        // Get task for item name
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

        // Verify requester exists before updating
        const requester = await User.findByPk(requesterId);
        if (!requester) return res.status(404).json({ success: false, message: 'Người yêu cầu không tồn tại' });

        console.log('✅ Requester verified:', { requesterId, requesterName: requester.hoten });

        // Create an Assignment record and immediately accept it
        const assignment = await Assignment.create({
            taskId: taskId || null,
            subtaskId: subtaskId || null,
            managerId: userId,
            assigneeId: requesterId,
            status: 'accepted',
            acceptedBy: userId,
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
            authorId: userId,
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
            console.log('🔍 Searching for related notifications with:', { taskId, subtaskId, requesterId });
            const candidates = await UserNotification.findAll();
            console.log(`📦 Total candidates: ${candidates.length}`);

            const related = candidates.filter(un => {
                if (!un.meta || !un.meta.requestToJoin) return false;

                // Convert to numbers for comparison (meta stores as strings)
                const metaTaskId = un.meta.taskId ? parseInt(un.meta.taskId) : null;
                const metaSubtaskId = un.meta.subtaskId ? parseInt(un.meta.subtaskId) : null;
                const metaRequesterId = un.meta.requesterId ? parseInt(un.meta.requesterId) : null;

                const matchesTask = taskId && metaTaskId === taskId;
                const matchesSubtask = subtaskId && metaSubtaskId === subtaskId;
                const matchesRequester = metaRequesterId === requesterId;

                const isMatch = (matchesTask || matchesSubtask) && matchesRequester;

                if (isMatch) {
                    console.log('✅ Found matching notification:', {
                        id: un.id,
                        userId: un.userId,
                        meta: un.meta,
                        processed: un.processed,
                        comparison: { taskId, subtaskId, requesterId, metaTaskId, metaSubtaskId, metaRequesterId }
                    });
                }

                return isMatch;
            });

            console.log(`🔄 Marking ${related.length} notifications as processed (accepted)`);

            for (const rn of related) {
                console.log(`📝 Before update - Notification ${rn.id}:`, {
                    processed: rn.processed,
                    isRead: rn.isRead
                });

                rn.isRead = true;
                rn.processed = true;
                rn.processedAt = new Date();
                rn.processedBy = userId;

                const result = await rn.save();

                console.log(`✅ After save - Notification ${rn.id}:`, {
                    processed: result.processed,
                    processedAt: result.processedAt,
                    processedBy: result.processedBy
                });
            }
            console.log(`✅ Successfully marked ${related.length} notifications as processed`);
        } catch (e) {
            console.error('❌ Error marking notifications processed:', e);
            console.error('Error stack:', e.stack);
        }

        res.json({ success: true, message: 'Đã chấp nhận yêu cầu và phân công công việc' });
    } catch (error) {
        console.error('❌ acceptRequestToJoin error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.errors && Array.isArray(error.errors)) {
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
            error.errors.forEach((e, i) => {
                console.error(`Error ${i}:`, {
                    message: e.message,
                    type: e.type,
                    path: e.path,
                    value: e.value,
                    validatorKey: e.validatorKey,
                    validatorName: e.validatorName
                });
            });
        }
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Lỗi khi chấp nhận yêu cầu', error: error.message });
    }
};

// Manager declines a request-to-join
exports.declineRequestToJoin = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.name || req.user.role;
        let { taskId, subtaskId, requesterId, reason } = req.body;

        // Parse to integers
        taskId = taskId ? parseInt(taskId) : null;
        subtaskId = subtaskId ? parseInt(subtaskId) : null;
        requesterId = parseInt(requesterId);

        console.log('📋 declineRequestToJoin START:', { userId, userRole, taskId, subtaskId, requesterId });

        if (!taskId && !subtaskId) return res.status(400).json({ success: false, message: 'Thiếu taskId hoặc subtaskId' });
        if (!requesterId) return res.status(400).json({ success: false, message: 'Thiếu requesterId' });

        // Check permission using helper
        const permCheck = await checkJoinRequestPermission(userId, userRole, taskId, subtaskId, requesterId);

        console.log('🔍 declineRequestToJoin permission check:', {
            userId,
            userRole,
            requesterId,
            taskId,
            subtaskId,
            permCheck
        });

        if (!permCheck.hasPermission) {
            return res.status(403).json({ success: false, message: `Không có quyền: ${permCheck.reason}` });
        }

        console.log(`✅ Permission granted (${permCheck.reason}), proceeding with decline`);

        // Verify requester exists before creating notification
        const requester = await User.findByPk(requesterId);
        if (!requester) return res.status(404).json({ success: false, message: 'Người yêu cầu không tồn tại' });

        console.log('✅ Requester verified:', { requesterId, requesterName: requester.hoten });

        // Create notification to requester about decline
        const itemName = subtaskId ? (await Subtask.findByPk(subtaskId)).tenSubtask : (await Task.findByPk(taskId)).tentask;
        const notification = await Notification.create({
            title: 'Yêu cầu tham gia bị từ chối',
            content: `Yêu cầu tham gia công việc "${itemName}" đã bị từ chối.${reason ? ' Lý do: ' + reason : ''}`,
            type: 'task',
            priority: 'low',
            targetAudience: 'member',
            authorId: userId,
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
            console.log('🔍 Searching for related notifications with:', { taskId, subtaskId, requesterId });
            const candidates = await UserNotification.findAll();
            console.log(`📦 Total candidates: ${candidates.length}`);

            const related = candidates.filter(un => {
                if (!un.meta || !un.meta.requestToJoin) return false;

                // Convert to numbers for comparison (meta stores as strings)
                const metaTaskId = un.meta.taskId ? parseInt(un.meta.taskId) : null;
                const metaSubtaskId = un.meta.subtaskId ? parseInt(un.meta.subtaskId) : null;
                const metaRequesterId = un.meta.requesterId ? parseInt(un.meta.requesterId) : null;

                const matchesTask = taskId && metaTaskId === taskId;
                const matchesSubtask = subtaskId && metaSubtaskId === subtaskId;
                const matchesRequester = metaRequesterId === requesterId;

                return (matchesTask || matchesSubtask) && matchesRequester;
            });

            console.log(`🔄 Marking ${related.length} notifications as processed (declined)`);
            for (const rn of related) {
                rn.isRead = true;
                rn.processed = true;
                rn.processedAt = new Date();
                rn.processedBy = userId;
                console.log(`📝 Updating notification ${rn.id}`);
                await rn.save();
            }
            console.log(`✅ Successfully marked ${related.length} notifications as processed`);
        } catch (e) {
            console.error('❌ Error marking notifications processed:', e);
            console.error('Error stack:', e.stack);
        }

        res.json({ success: true, message: 'Đã từ chối yêu cầu tham gia' });
    } catch (error) {
        console.error('❌ declineRequestToJoin error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.errors && Array.isArray(error.errors)) {
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
            error.errors.forEach((e, i) => {
                console.error(`Error ${i}:`, {
                    message: e.message,
                    type: e.type,
                    path: e.path,
                    value: e.value,
                    validatorKey: e.validatorKey,
                    validatorName: e.validatorName
                });
            });
        }
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Lỗi khi từ chối yêu cầu', error: error.message });
    }
};

/**
 * Get join requests for current user based on their role
 * - Teamlead: requests for members in their groups
 * - Manager: requests for members in groups that participate in their projects
 * - Admin: all requests
 */
exports.getMyJoinRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.name || req.user.role;
        const { Op } = require('sequelize');
        const sequelize = require('sequelize');

        console.log('📋 getMyJoinRequests for user:', { userId, userRole });

        let userNotifications = [];

        if (userRole === 'admin') {
            // Admin: get all join requests that are not processed
            userNotifications = await UserNotification.findAll({
                where: {
                    processed: false,
                    [Op.and]: [
                        sequelize.where(
                            sequelize.literal("JSON_EXTRACT(meta, '$.requestToJoin')"),
                            Op.eq,
                            true
                        )
                    ]
                },
                include: [
                    {
                        model: Notification,
                        as: 'notification',
                        required: true,
                        include: [
                            {
                                model: User,
                                as: 'author',
                                attributes: ['id', 'manv', 'hoten']
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'manv', 'hoten']
                    }
                ],
                order: [['createdAt', 'DESC']],
                raw: false,
                subQuery: false
            });
            console.log('✅ Admin: all unprocessed join requests count:', userNotifications.length);
        } else if (userRole === 'manager') {
            // Manager: get requests for members in groups participating in manager's projects
            const { GroupProject } = require('../models');

            // Get all projects managed by this user
            const managedProjects = await DuAn.findAll({
                where: { userId },
                attributes: ['id'],
                raw: true
            });
            const projectIds = managedProjects.map(p => p.id);

            if (projectIds.length === 0) {
                return res.json({ success: true, data: [] });
            }

            // Get groups in these projects
            const groupsInProjects = await GroupProject.findAll({
                where: { projectId: { [Op.in]: projectIds } },
                attributes: ['groupId'],
                raw: true
            });
            const groupIds = groupsInProjects.map(gp => gp.groupId);

            if (groupIds.length === 0) {
                return res.json({ success: true, data: [] });
            }

            // Get members in these groups
            const { GroupMember } = require('../models');
            const membershipRecords = await GroupMember.findAll({
                where: { groupId: { [Op.in]: groupIds } },
                attributes: ['userId'],
                raw: true
            });
            const memberIds = membershipRecords.map(m => m.userId);

            if (memberIds.length === 0) {
                return res.json({ success: true, data: [] });
            }

            // Get join requests sent TO manager (userId = manager) FROM these members (meta.requesterId)
            // Fetch all notifications for this manager first
            const allManagerNotifications = await UserNotification.findAll({
                where: {
                    userId: userId,  // Manager receives notifications
                    processed: false,
                    [Op.and]: [
                        sequelize.where(
                            sequelize.literal("JSON_EXTRACT(meta, '$.requestToJoin')"),
                            Op.eq,
                            true
                        )
                    ]
                },
                include: [
                    {
                        model: Notification,
                        as: 'notification',
                        required: true,
                        include: [
                            {
                                model: User,
                                as: 'author',
                                attributes: ['id', 'manv', 'hoten']
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'manv', 'hoten']
                    }
                ],
                order: [['createdAt', 'DESC']],
                raw: false,
                subQuery: false
            });

            // Filter by requesterId in meta (must be a member in manager's project groups)
            userNotifications = allManagerNotifications.filter(un => {
                const requesterId = un.meta?.requesterId ? parseInt(un.meta.requesterId) : null;
                const isFromProjectMember = requesterId && memberIds.includes(requesterId);
                if (isFromProjectMember) {
                    console.log(`✅ Manager notification matched: notificationId=${un.notificationId}, requesterId=${requesterId}`);
                }
                return isFromProjectMember;
            });

            console.log('✅ Manager: unprocessed join requests for members in their projects count:', userNotifications.length);
        } else if (userRole === 'teamleader' || userRole === 'employee') {
            // Teamlead: get requests for members in their groups
            const userGroups = await Group.findAll({
                where: {
                    leaderId: userId,
                    status: 'active'
                },
                attributes: ['id'],
                raw: true
            });
            const groupIds = userGroups.map(g => g.id);
            console.log(`🔵 TEAMLEAD ${userId}: Found ${userGroups.length} groups:`, groupIds);

            if (groupIds.length === 0) {
                console.log(`⚠️ TEAMLEAD ${userId}: No groups found, returning empty`);
                return res.json({ success: true, data: [] });
            }

            // Get members in these groups
            const { GroupMember } = require('../models');
            const membershipRecords = await GroupMember.findAll({
                where: { groupId: { [Op.in]: groupIds } },
                attributes: ['userId'],
                raw: true
            });
            const memberIds = membershipRecords.map(m => m.userId);
            console.log(`🔵 TEAMLEAD ${userId}: Found ${memberIds.length} members in groups:`, memberIds);

            if (memberIds.length === 0) {
                console.log(`⚠️ TEAMLEAD ${userId}: No members in groups, returning empty`);
                return res.json({ success: true, data: [] });
            }

            // Get join requests sent TO teamlead (userId = teamlead) FROM members in their groups (meta.requesterId)
            // Fetch all notifications for this teamlead first
            const allTeamleadNotifications = await UserNotification.findAll({
                where: {
                    userId: userId,  // Teamlead receives notifications
                    processed: false,
                    [Op.and]: [
                        sequelize.where(
                            sequelize.literal("JSON_EXTRACT(meta, '$.requestToJoin')"),
                            Op.eq,
                            true
                        )
                    ]
                },
                include: [
                    {
                        model: Notification,
                        as: 'notification',
                        required: true,
                        include: [
                            {
                                model: User,
                                as: 'author',
                                attributes: ['id', 'manv', 'hoten']
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'manv', 'hoten']
                    }
                ],
                order: [['createdAt', 'DESC']],
                raw: false,
                subQuery: false
            });
            console.log(`🔵 TEAMLEAD ${userId}: Found ${allTeamleadNotifications.length} total notifications`);

            // Filter by requesterId in meta (must be a member in teamlead's groups)
            userNotifications = allTeamleadNotifications.filter(un => {
                const requesterId = un.meta?.requesterId ? parseInt(un.meta.requesterId) : null;
                const isFromGroupMember = requesterId && memberIds.includes(requesterId);
                if (requesterId) {
                    console.log(`🔍 TEAMLEAD checking notification: requesterId=${requesterId}, isInGroup=${isFromGroupMember}`);
                }
                if (isFromGroupMember) {
                    console.log(`✅ Teamlead notification matched: notificationId=${un.notificationId}, requesterId=${requesterId}`);
                }
                return isFromGroupMember;
            });

            console.log('✅ Teamlead: unprocessed join requests for members in their groups count:', userNotifications.length);
        }

        // Format response (already filtered by processed=false in query)
        // Deduplicate by notificationId - same request sent to multiple approvers
        const seenNotificationIds = new Set();
        const formatted = userNotifications
            .filter(un => {
                if (seenNotificationIds.has(un.notificationId)) {
                    console.log(`⚠️ Skipping duplicate notificationId: ${un.notificationId} for userId: ${un.userId}`);
                    return false;
                }
                seenNotificationIds.add(un.notificationId);
                return true;
            })
            .map(un => ({
                id: un.notificationId,
                userId: un.userId,
                title: un.notification.title,
                content: un.notification.content,
                createdAt: un.notification.createdAt,
                isRead: un.isRead,
                processed: un.processed,
                processedAt: un.processedAt,
                processedBy: un.processedBy,
                meta: un.meta,
                userMeta: un.meta,
                author: un.notification.author,
                recipient: un.user,
                userNotification: {
                    isRead: un.isRead,
                    meta: un.meta,
                    processed: un.processed
                }
            }));

        console.log(`✅ Returning ${formatted.length} unprocessed join requests (after deduplication)`);

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('Error fetching my join requests:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách yêu cầu',
            error: error.message
        });
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

// Get pending task assignments for current user (teamlead)
// These are main tasks that manager assigned to this user
exports.getPendingTaskAssignments = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy danh sách assignments chờ phê duyệt cho user hiện tại
        // assigneeId = userId (người nhận task)
        // status = 'pending' (chờ xác nhận)
        // taskId != null (chỉ lấy task, không lấy subtask)
        const assignments = await Assignment.findAll({
            where: {
                assigneeId: userId,
                taskId: { [require('sequelize').Op.ne]: null },
                status: 'pending'
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask', 'mota', 'trangThai', 'mucDoUuTien', 'ngayBatDau', 'ngayKetThuc', 'duanId'],
                    include: [
                        {
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan']
                        },
                        {
                            model: User,
                            as: 'nguoiGiao',
                            attributes: ['id', 'hoten', 'manv']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'hoten', 'manv', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            message: 'Danh sách công việc được giao',
            data: assignments
        });
    } catch (error) {
        console.error('getPendingTaskAssignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách công việc được giao',
            error: error.message
        });
    }
}

// Get unassigned tasks that teamlead can claim
// These are tasks created without assigning to anyone (nguoiDuocGiaoId = null)
// and belong to projects where the teamlead's group is involved
exports.getUnassignedTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Group, GroupMember, GroupProject } = require('../models');

        console.log('🔍 getUnassignedTasks called for userId:', userId);

        // Find all groups where current user is a MEMBER OR is the LEADER
        const userGroupsAsLeader = await Group.findAll({
            where: { leaderId: userId },
            attributes: ['id']
        });

        const userGroupsAsMember = await GroupMember.findAll({
            where: { userId },
            attributes: ['groupId']
        });

        const leaderGroupIds = userGroupsAsLeader.map(g => g.id);
        const memberGroupIds = userGroupsAsMember.map(g => g.groupId);
        const allGroupIds = [...new Set([...leaderGroupIds, ...memberGroupIds])]; // Remove duplicates

        console.log('📍 User as leader of groups:', leaderGroupIds);
        console.log('📍 User as member of groups:', memberGroupIds);
        console.log('📍 All groups:', allGroupIds);

        if (allGroupIds.length === 0) {
            console.log('⚠️  User not in any group (as leader or member)');
            return res.json({
                success: true,
                message: 'Bạn không thuộc nhóm nào',
                data: []
            });
        }

        // Find projects where these groups are involved
        const groupProjects = await GroupProject.findAll({
            where: { groupId: allGroupIds },
            attributes: ['projectId']
        });

        console.log('📊 Group projects:', groupProjects.length, groupProjects.map(gp => gp.projectId));

        const projectIds = groupProjects.map(gp => gp.projectId);

        if (projectIds.length === 0) {
            console.log('⚠️  User groups not in any projects');
            return res.json({
                success: true,
                message: 'Nhóm của bạn không tham gia dự án nào',
                data: []
            });
        }

        // Get unassigned tasks from these projects
        // Tasks where:
        // - duanId is in projectIds (projects where user's group is involved)
        // - nguoiDuocGiaoId is null (no one assigned yet)
        // - NOT already assigned via pending Assignment to this user
        const unassignedTasks = await Task.findAll({
            attributes: ['id', 'tentask', 'mota', 'duanId', 'mucDoUuTien', 'ngayKetThuc', 'nguoiGiaoId'],
            where: {
                duanId: {
                    [require('sequelize').Op.in]: projectIds
                },
                nguoiDuocGiaoId: null
            },
            include: [
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                },
                {
                    model: User,
                    as: 'nguoiGiao',
                    attributes: ['id', 'hoten', 'manv']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        console.log('📋 Unassigned tasks found:', unassignedTasks.length);
        console.log('   Task IDs:', unassignedTasks.map(t => ({ id: t.id, name: t.tentask, duanId: t.duanId })));

        // Filter out tasks that already have pending assignments for this user
        const pendingAssignments = await Assignment.findAll({
            where: {
                assigneeId: userId,
                taskId: {
                    [require('sequelize').Op.ne]: null
                },
                status: 'pending'
            },
            attributes: ['taskId']
        });

        const pendingTaskIds = pendingAssignments.map(a => a.taskId);
        console.log('⏳ Pending assignment task IDs:', pendingTaskIds);

        // Remove already-pending tasks
        const availableTasks = unassignedTasks.filter(t => !pendingTaskIds.includes(t.id));
        console.log('✅ Available tasks after filtering:', availableTasks.length);

        res.json({
            success: true,
            message: 'Danh sách công việc chưa ai nhận',
            data: availableTasks
        });
    } catch (error) {
        console.error('getUnassignedTasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách công việc chưa ai nhận',
            error: error.message
        });
    }
}

// Teamlead request to claim an unassigned task
// Creates a pending assignment that manager must approve
exports.requestToClaimTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.body;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chỉ định taskId'
            });
        }

        // Verify task exists and is unassigned
        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Công việc không tồn tại'
            });
        }

        if (task.nguoiDuocGiaoId !== null) {
            return res.status(400).json({
                success: false,
                message: 'Công việc này đã được giao cho người khác'
            });
        }

        // Verify user's group is part of the project
        const { GroupMember, GroupProject } = require('../models');

        const userGroups = await GroupMember.findAll({
            where: { userId },
            attributes: ['groupId']
        });

        // Also check if user is leader of groups
        const { Group } = require('../models');
        const leaderGroups = await Group.findAll({
            where: { leaderId: userId },
            attributes: ['id']
        });

        const groupIds = [
            ...userGroups.map(g => g.groupId),
            ...leaderGroups.map(g => g.id)
        ];

        const hasAccess = await GroupProject.findOne({
            where: {
                groupId: groupIds,
                projectId: task.duanId
            }
        });

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Nhóm của bạn không có quyền truy cập dự án này'
            });
        }

        // Check if already has pending assignment for this task
        const existingAssignment = await Assignment.findOne({
            where: {
                taskId,
                assigneeId: userId,
                status: 'pending'
            }
        });

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã gửi yêu cầu nhận công việc này rồi'
            });
        }

        // Create pending assignment (request to claim)
        const assignment = await Assignment.create({
            taskId,
            subtaskId: null,
            managerId: task.nguoiGiaoId, // Task creator is the manager
            assigneeId: userId,
            status: 'pending'
        });

        // Send notification to task creator (manager)
        const requester = await User.findByPk(userId);
        const notification = await Notification.create({
            title: 'Yêu cầu nhận công việc',
            content: `${requester.hoten || requester.manv} yêu cầu nhận: ${task.tentask}`,
            type: 'task',
            priority: 'medium',
            targetAudience: 'manager',
            authorId: userId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: task.nguoiGiaoId,
            notificationId: notification.id,
            isRead: false,
            meta: { assignmentId: assignment.id, action: 'claim_request', requestToJoin: true }
        });

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu nhận công việc',
            data: assignment
        });
    } catch (error) {
        console.error('requestToClaimTask error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi yêu cầu nhận công việc',
            error: error.message
        });
    }
}

// Manager: Get all pending task claim requests
// Shows all pending assignments where:
// 1. Current user is the manager (task creator) - assignments.managerId = userId
// 2. Current user is the project manager - task.duan.userId = userId
// Note: This includes assignments created by manager assigning tasks/subtasks to members
exports.getClaimRequests = async (req, res) => {
    try {
        const managerId = req.user.id;
        const userRole = req.user.role?.name || req.user.role;

        console.log('🔍 getClaimRequests for manager:', { managerId, userRole });

        // Get all pending assignments with task and project info
        const allPendingAssignments = await Assignment.findAll({
            where: {
                taskId: { [require('sequelize').Op.ne]: null },
                subtaskId: null, // Only task assignments, not subtask assignments
                status: 'pending'
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask', 'mota', 'duanId', 'nguoiGiaoId'],
                    include: [
                        {
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan', 'userId'],
                            required: false
                        },
                        {
                            model: User,
                            as: 'nguoiGiao',
                            attributes: ['id', 'hoten', 'manv']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'hoten', 'manv', 'email']
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'hoten', 'manv']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        console.log('📊 Total pending assignments found:', allPendingAssignments.length);

        // Filter assignments where:
        // 1. User is the direct manager (assignment.managerId = userId)
        // 2. User is the project manager (task.duan.userId = userId)
        const filteredAssignments = allPendingAssignments.filter(assignment => {
            // Case 1: Direct manager
            if (assignment.managerId === managerId) {
                console.log('✅ Direct manager match for assignment:', assignment.id);
                return true;
            }

            // Case 2: Project manager
            if (assignment.task && assignment.task.duan && assignment.task.duan.userId === managerId) {
                console.log('✅ Project manager match for assignment:', assignment.id, 'project:', assignment.task.duan.tenduan);
                return true;
            }

            console.log('❌ No match for assignment:', assignment.id);
            return false;
        });

        console.log('✅ Filtered assignments for manager:', filteredAssignments.length);

        res.json({
            success: true,
            message: 'Danh sách yêu cầu nhận công việc',
            data: filteredAssignments
        });
    } catch (error) {
        console.error('getClaimRequests error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách yêu cầu nhận công việc',
            error: error.message
        });
    }
}

// Admin: Get ALL pending task claim requests across the entire system
// Shows all pending assignments regardless of manager
exports.getAllClaimRequests = async (req, res) => {
    try {
        const assignments = await Assignment.findAll({
            where: {
                status: 'pending'
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask', 'mota', 'duanId', 'nguoiGiaoId'],
                    required: false,
                    include: [
                        {
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan']
                        },
                        {
                            model: User,
                            as: 'nguoiGiao',
                            attributes: ['id', 'hoten', 'manv']
                        }
                    ]
                },
                {
                    model: Subtask,
                    as: 'subtask',
                    attributes: ['id', 'tenSubtask', 'mota', 'taskId'],
                    required: false,
                    include: [
                        {
                            model: Task,
                            as: 'task',
                            attributes: ['id', 'tentask', 'duanId', 'nguoiGiaoId'],
                            include: [
                                {
                                    model: DuAn,
                                    as: 'duan',
                                    attributes: ['id', 'tenduan']
                                },
                                {
                                    model: User,
                                    as: 'nguoiGiao',
                                    attributes: ['id', 'hoten', 'manv']
                                }
                            ]
                        }
                    ]
                },
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'hoten', 'manv', 'email']
                },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'hoten', 'manv']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            message: 'Danh sách tất cả yêu cầu nhận công việc',
            data: assignments
        });
    } catch (error) {
        console.error('getAllClaimRequests error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách yêu cầu nhận công việc',
            error: error.message
        });
    }
}

// Manager: Approve a claim request
// Updates assignment to accepted and assigns task to the requester
// Admin can also approve any claim request
exports.approveClaimRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.name || req.user.role;
        const { assignmentId } = req.body;

        if (!assignmentId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chỉ định assignmentId'
            });
        }

        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Yêu cầu không tồn tại'
            });
        }

        // Check permission: must be the manager OR admin
        if (assignment.managerId !== userId && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền phê duyệt yêu cầu này'
            });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này không ở trạng thái chờ phê duyệt'
            });
        }

        // Update assignment status to accepted
        await assignment.update({
            status: 'accepted',
            acceptedBy: userId,
            acceptedAt: new Date()
        });

        // Update task/subtask - assign to the requester
        if (assignment.taskId) {
            await Task.update(
                { nguoiDuocGiaoId: assignment.assigneeId },
                { where: { id: assignment.taskId } }
            );
        } else if (assignment.subtaskId) {
            await Subtask.update(
                { nguoiThucHienId: assignment.assigneeId },
                { where: { id: assignment.subtaskId } }
            );
        }

        // Notify the requester about approval
        const assignee = await User.findByPk(assignment.assigneeId);
        let itemName = '';

        if (assignment.taskId) {
            const task = await Task.findByPk(assignment.taskId);
            itemName = task.tentask;
        } else if (assignment.subtaskId) {
            const subtask = await Subtask.findByPk(assignment.subtaskId);
            itemName = subtask.tenSubtask;
        }

        const notification = await Notification.create({
            title: 'Yêu cầu nhận công việc được phê duyệt',
            content: `Bạn được phép nhận công việc: ${itemName}`,
            type: 'task',
            priority: 'high',
            targetAudience: 'member',
            authorId: userId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: assignment.assigneeId,
            notificationId: notification.id,
            isRead: false,
            meta: { assignmentId: assignment.id, action: 'approved' }
        });

        res.json({
            success: true,
            message: 'Đã phê duyệt yêu cầu nhận công việc'
        });
    } catch (error) {
        console.error('approveClaimRequest error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phê duyệt yêu cầu',
            error: error.message
        });
    }
}

// Manager: Reject a claim request
// Admin can also reject any claim request
exports.rejectClaimRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role?.name || req.user.role;
        const { assignmentId, reason } = req.body;

        if (!assignmentId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chỉ định assignmentId'
            });
        }

        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Yêu cầu không tồn tại'
            });
        }

        // Check permission: must be the manager OR admin
        if (assignment.managerId !== userId && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền từ chối yêu cầu này'
            });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này không ở trạng thái chờ phê duyệt'
            });
        }

        // Update assignment status to declined
        await assignment.update({ status: 'declined', reason });

        // Notify the requester about rejection
        let itemName = '';

        if (assignment.taskId) {
            const task = await Task.findByPk(assignment.taskId);
            itemName = task.tentask;
        } else if (assignment.subtaskId) {
            const subtask = await Subtask.findByPk(assignment.subtaskId);
            itemName = subtask.tenSubtask;
        }

        const notification = await Notification.create({
            title: 'Yêu cầu nhận công việc bị từ chối',
            content: `Yêu cầu nhận công việc "${itemName}" bị từ chối${reason ? '. Lý do: ' + reason : ''}`,
            type: 'task',
            priority: 'medium',
            targetAudience: 'member',
            authorId: userId,
            status: 'published',
            publishedAt: new Date()
        });

        await UserNotification.create({
            userId: assignment.assigneeId,
            notificationId: notification.id,
            isRead: false,
            meta: { assignmentId: assignment.id, action: 'rejected', reason }
        });

        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu nhận công việc'
        });
    } catch (error) {
        console.error('rejectClaimRequest error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối yêu cầu',
            error: error.message
        });
    }
}

