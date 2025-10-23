const { Subtask, Task, User } = require('../models');

// Tạo subtask mới
exports.createSubtask = async (req, res) => {
    try {
        const { taskId } = req.params; // Lấy taskId từ URL params
        const { tenSubtask, mota, nguoiThucHienId, ngayBatDau, ngayKetThuc, ghiChu } = req.body;

        // Kiểm tra task có tồn tại không
        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc chính' });
        }

        // Kiểm tra user thực hiện có tồn tại không
        const executor = await User.findByPk(nguoiThucHienId);
        if (!executor) {
            return res.status(404).json({ error: 'Không tìm thấy người thực hiện' });
        }

        // Tự động tính thứ tự cho subtask mới
        const maxOrder = await Subtask.max('thuTu', { where: { taskId } }) || 0;

        // Yêu cầu: phải chọn ngày bắt đầu cho subtask
        if (!ngayBatDau) {
            return res.status(400).json({ error: 'Vui lòng chọn ngày bắt đầu cho công việc nhỏ' });
        }

        const subStart = new Date(ngayBatDau);
        if (isNaN(subStart.getTime())) {
            return res.status(400).json({ error: 'Ngày bắt đầu không hợp lệ' });
        }

        // Nếu task có ngày bắt đầu, đảm bảo subStart >= task.ngayBatDau
        if (task.ngayBatDau) {
            const taskStart = new Date(task.ngayBatDau);
            if (!isNaN(taskStart.getTime()) && subStart < taskStart) {
                return res.status(400).json({ error: 'Ngày bắt đầu của công việc nhỏ phải lớn hơn hoặc bằng ngày bắt đầu của công việc chính' });
            }
        }

        // Nếu task có ngày kết thúc, đảm bảo subStart < task.ngayKetThuc
        if (task.ngayKetThuc) {
            const taskEnd = new Date(task.ngayKetThuc);
            if (isNaN(taskEnd.getTime())) {
                return res.status(400).json({ error: 'Ngày kết thúc của công việc chính không hợp lệ' });
            }
            if (!(subStart < taskEnd)) {
                return res.status(400).json({ error: 'Ngày bắt đầu của công việc nhỏ phải nhỏ hơn ngày kết thúc của công việc chính' });
            }
        }

        // Nếu cả ngày bắt đầu và kết thúc của subtask đều có, kiểm tra thứ tự
        if (ngayBatDau && ngayKetThuc) {
            const start = new Date(ngayBatDau);
            const end = new Date(ngayKetThuc);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                return res.status(400).json({ error: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc' });
            }
        }

        // Nếu có ngày kết thúc, đảm bảo nó nhỏ hơn ngày kết thúc của task (điều kiện đã có trước)
        if (ngayKetThuc && task.ngayKetThuc) {
            const subEnd = new Date(ngayKetThuc);
            const taskEnd = new Date(task.ngayKetThuc);
            if (isNaN(subEnd.getTime()) || isNaN(taskEnd.getTime())) {
                return res.status(400).json({ error: 'Ngày không hợp lệ' });
            }
            if (!(subEnd < taskEnd)) {
                return res.status(400).json({ error: 'Ngày kết thúc của subtask phải nhỏ hơn ngày kết thúc của công việc chính' });
            }
        }

        const newSubtask = await Subtask.create({
            tenSubtask,
            mota,
            taskId,
            nguoiThucHienId,
            trangThai: 'Chưa bắt đầu',
            ngayBatDau,
            ngayKetThuc,
            thuTu: maxOrder + 1,
            ghiChu
        });

        // Cập nhật progress của task chính
        await updateTaskProgress(taskId);

        // Lấy thông tin đầy đủ của subtask vừa tạo
        const subtaskWithDetails = await Subtask.findByPk(newSubtask.id, {
            include: [
                {
                    model: User,
                    as: 'nguoiThucHien',
                    attributes: ['id', 'hoten', 'manv', 'chucvu']
                },
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tentask']
                }
            ]
        });

        res.status(201).json({
            message: 'Tạo công việc nhỏ thành công',
            subtask: subtaskWithDetails
        });
    } catch (error) {
        console.error('Create subtask error:', error);
        // Include error details to aid debugging (non-sensitive)
        const responsePayload = { error: 'Lỗi khi tạo công việc nhỏ' };
        if (error && error.message) responsePayload.details = error.message;
        // If Sequelize validation errors exist, include their messages
        if (error && Array.isArray(error.errors)) {
            responsePayload.sequelizeErrors = error.errors.map(e => e.message);
        }
        res.status(500).json(responsePayload);
    }
};

// Lấy danh sách subtasks của một task
exports.getSubtasksByTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const subtasks = await Subtask.findAll({
            where: { taskId },
            include: [{
                model: User,
                as: 'nguoiThucHien',
                attributes: ['id', 'hoten', 'manv', 'chucvu']
            }],
            order: [['thuTu', 'ASC']]
        });

        res.json(subtasks);
    } catch (error) {
        console.error('Get subtasks error:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách công việc nhỏ' });
    }
};

// Cập nhật subtask
exports.updateSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const subtask = await Subtask.findByPk(id, {
            include: [{
                model: Task,
                as: 'task',
                attributes: ['nguoiGiaoId', 'nguoiDuocGiaoId']
            }]
        });

        if (!subtask) {
            return res.status(404).json({ error: 'Không tìm thấy công việc nhỏ' });
        }

        // Kiểm tra quyền cập nhật (người thực hiện, người giao task hoặc người được giao task chính)
        const canUpdate = subtask.nguoiThucHienId === req.user.id ||
            subtask.task.nguoiGiaoId === req.user.id ||
            subtask.task.nguoiDuocGiaoId === req.user.id;

        if (!canUpdate) {
            return res.status(403).json({ error: 'Không có quyền cập nhật công việc nhỏ này' });
        }

        // Tự động cập nhật ngày hoàn thành khi trạng thái là "Hoàn thành"
        if (updateData.trangThai === 'Hoàn thành' && !updateData.ngayHoanThanh) {
            updateData.ngayHoanThanh = new Date();
        }

        // Validate dates on update
        if (updateData.ngayBatDau && updateData.ngayKetThuc) {
            const start = new Date(updateData.ngayBatDau);
            const end = new Date(updateData.ngayKetThuc);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                return res.status(400).json({ error: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc' });
            }
        }

        await subtask.update(updateData);

        // Lấy thông tin đầy đủ sau khi cập nhật
        const updatedSubtask = await Subtask.findByPk(id, {
            include: [{
                model: User,
                as: 'nguoiThucHien',
                attributes: ['id', 'hoten', 'manv', 'chucvu']
            }]
        });

        // Cập nhật tiến độ task chính dựa trên subtasks
        await updateTaskProgress(subtask.taskId);

        res.json({
            message: 'Cập nhật công việc nhỏ thành công',
            subtask: updatedSubtask
        });
    } catch (error) {
        console.error('Update subtask error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật công việc nhỏ' });
    }
};

// Xóa subtask
exports.deleteSubtask = async (req, res) => {
    try {
        const { id } = req.params;

        const subtask = await Subtask.findByPk(id, {
            include: [{
                model: Task,
                as: 'task',
                attributes: ['nguoiGiaoId', 'nguoiDuocGiaoId']
            }]
        });

        if (!subtask) {
            return res.status(404).json({ error: 'Không tìm thấy công việc nhỏ' });
        }

        // Kiểm tra quyền xóa (người giao task hoặc người được giao task chính)
        const canDelete = subtask.task.nguoiGiaoId === req.user.id ||
            subtask.task.nguoiDuocGiaoId === req.user.id;

        if (!canDelete) {
            return res.status(403).json({ error: 'Không có quyền xóa công việc nhỏ này' });
        }

        const taskId = subtask.taskId;
        await subtask.destroy();

        // Cập nhật lại thứ tự các subtask còn lại
        await reorderSubtasks(taskId);

        // Cập nhật tiến độ task chính
        await updateTaskProgress(taskId);

        res.json({ message: 'Xóa công việc nhỏ thành công' });
    } catch (error) {
        console.error('Delete subtask error:', error);
        res.status(500).json({ error: 'Lỗi khi xóa công việc nhỏ' });
    }
};

// Cập nhật thứ tự subtasks
exports.reorderSubtasks = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { subtaskIds } = req.body; // Mảng IDs theo thứ tự mới

        // Kiểm tra quyền (người giao task hoặc người được giao task chính)
        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Không tìm thấy công việc chính' });
        }

        const canReorder = task.nguoiGiaoId === req.user.id || task.nguoiDuocGiaoId === req.user.id;
        if (!canReorder) {
            return res.status(403).json({ error: 'Không có quyền sắp xếp lại công việc nhỏ' });
        }

        // Cập nhật thứ tự
        for (let i = 0; i < subtaskIds.length; i++) {
            await Subtask.update(
                { thuTu: i + 1 },
                { where: { id: subtaskIds[i], taskId } }
            );
        }

        res.json({ message: 'Cập nhật thứ tự thành công' });
    } catch (error) {
        console.error('Reorder subtasks error:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật thứ tự công việc nhỏ' });
    }
};

// Helper function: Cập nhật tiến độ task dựa trên subtasks
async function updateTaskProgress(taskId) {
    try {
        const subtasks = await Subtask.findAll({ where: { taskId } });

        if (subtasks.length === 0) {
            // Nếu không có subtask, giữ nguyên tiến độ hiện tại
            return;
        }

        const completedCount = subtasks.filter(st => st.trangThai === 'Hoàn thành').length;
        const progress = Math.round((completedCount / subtasks.length) * 100);

        let taskStatus = 'Chưa bắt đầu';
        if (progress > 0 && progress < 100) {
            taskStatus = 'Đang chạy';
        } else if (progress === 100) {
            taskStatus = 'Hoàn thành';
        }

        await Task.update(
            {
                tienDo: progress,
                trangThai: taskStatus,
                ngayHoanThanh: progress === 100 ? new Date() : null
            },
            { where: { id: taskId } }
        );
    } catch (error) {
        console.error('Update task progress error:', error);
    }
}

// Helper function: Sắp xếp lại thứ tự subtasks sau khi xóa
async function reorderSubtasks(taskId) {
    try {
        const subtasks = await Subtask.findAll({
            where: { taskId },
            order: [['thuTu', 'ASC']]
        });

        for (let i = 0; i < subtasks.length; i++) {
            await subtasks[i].update({ thuTu: i + 1 });
        }
    } catch (error) {
        console.error('Reorder subtasks error:', error);
    }
}

// Helper function để cập nhật progress của task
async function updateTaskProgress(taskId) {
    try {
        const subtasks = await Subtask.findAll({ where: { taskId } });

        if (subtasks.length === 0) {
            await Task.update({ progress: 0 }, { where: { id: taskId } });
            return;
        }

        const completedCount = subtasks.filter(st => st.trangThai === 'Hoàn thành').length;
        const progress = Math.round((completedCount / subtasks.length) * 100);

        // Tự động cập nhật trạng thái task dựa vào progress
        let status = 'Chưa bắt đầu';
        if (progress === 100) {
            status = 'Hoàn thành';
        } else if (progress > 0) {
            status = 'Đang chạy';
        }

        await Task.update({
            progress,
            trangThai: status
        }, { where: { id: taskId } });
    } catch (error) {
        console.error('Update task progress error:', error);
    }
}