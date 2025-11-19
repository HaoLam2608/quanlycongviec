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

module.exports = {
    getPendingApprovals,
    approveTaskCompletion,
    rejectTaskCompletion,
    approveSubtaskCompletion,
    rejectSubtaskCompletion
};
