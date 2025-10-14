// Thêm nhóm vào dự án (group_projects)
exports.addGroupToProject = async (req, res) => {
    try {
        const { groupId, projectId } = req.body;
        if (!groupId || !projectId) return res.status(400).json({ message: 'Thiếu groupId hoặc projectId' });

        // Lấy số lượng dự án active mà nhóm đang tham gia
        const { GroupProject } = require('../models');
        const activeCount = await GroupProject.count({
            where: { groupId, status: 'active' }
        });
        if (activeCount >= 2) {
            return res.status(400).json({ message: 'Nhóm đã tham gia tối đa 2 dự án đồng thời' });
        }

        // Kiểm tra đã tham gia dự án này chưa
        const existed = await GroupProject.findOne({ where: { groupId, projectId, status: 'active' } });
        if (existed) {
            return res.status(400).json({ message: 'Nhóm đã tham gia dự án này' });
        }

        // Thêm bản ghi mới
        await GroupProject.create({ groupId, projectId, status: 'active' });
        res.json({ message: 'Thêm nhóm vào dự án thành công' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
const { Group, GroupMember, User, DuAn, GroupProjectHistory, sequelize } = require('../models');

// Create group
exports.createGroup = async (req, res) => {
    try {
        const { name, description, leaderId, memberIds, projectIds } = req.body;
        if (!name) return res.status(400).json({ message: 'Thiếu name' });

        // Validation cho leader nếu có
        if (leaderId) {
            // Kiểm tra leader đã là leader của nhóm khác chưa
            const existingLeaderGroup = await Group.findOne({ where: { leaderId } });
            if (existingLeaderGroup) {
                return res.status(400).json({
                    message: `Người này đã là nhóm trưởng của nhóm "${existingLeaderGroup.name}"`
                });
            }

            // Kiểm tra leader đã là thành viên của nhóm khác chưa
            const existingMembership = await GroupMember.findOne({ where: { userId: leaderId } });
            if (existingMembership) {
                const memberGroup = await Group.findByPk(existingMembership.groupId);
                return res.status(400).json({
                    message: `Người này đã là thành viên của nhóm "${memberGroup.name}"`
                });
            }
        }

        // Validation cho members nếu có
        if (Array.isArray(memberIds) && memberIds.length) {
            for (const userId of memberIds) {
                // Kiểm tra user đã là leader của nhóm khác chưa
                const existingLeaderGroup = await Group.findOne({ where: { leaderId: userId } });
                if (existingLeaderGroup) {
                    const user = await User.findByPk(userId);
                    return res.status(400).json({
                        message: `${user.hoten} đã là nhóm trưởng của nhóm "${existingLeaderGroup.name}"`
                    });
                }

                // Kiểm tra user đã tham gia bao nhiêu nhóm
                const membershipCount = await GroupMember.count({ where: { userId } });
                if (membershipCount >= 2) {
                    const user = await User.findByPk(userId);
                    return res.status(400).json({
                        message: `${user.hoten} đã tham gia tối đa 2 nhóm`
                    });
                }
            }
        }

        const group = await Group.create({ name, description, leaderId });

        // Xử lý gán dự án cho nhóm nếu có
        if (Array.isArray(projectIds) && projectIds.length > 0) {
            if (projectIds.length > 2) return res.status(400).json({ message: 'Chỉ được chọn tối đa 2 dự án đang chạy hoặc chuẩn bị!' });
            // Lấy danh sách dự án hợp lệ
            const validProjects = await DuAn.findAll({
                where: {
                    id: projectIds,
                    status: ['chua_bat_dau', 'dang_chay']
                }
            });
            if (validProjects.length !== projectIds.length) {
                return res.status(400).json({ message: 'Chỉ được chọn dự án ở trạng thái chuẩn bị hoặc đang chạy!' });
            }
            // Kiểm tra nhóm đã tham gia dự án này chưa (không cần vì nhóm mới tạo)
            const { GroupProject } = require('../models');
            for (const pid of projectIds) {
                await GroupProject.create({ groupId: group.id, projectId: pid, status: 'active' });
            }
        }

        if (Array.isArray(memberIds) && memberIds.length) {
            const bulk = memberIds.map(uid => ({ groupId: group.id, userId: uid }));
            await GroupMember.bulkCreate(bulk, { ignoreDuplicates: true });
        }

        const full = await Group.findByPk(group.id, { include: ['leader', 'members', 'projects'] });
        res.status(201).json({ message: 'Tạo nhóm thành công', group: full });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// List groups (optional filter by duanId)
exports.getGroups = async (req, res) => {
    try {
        const { GroupProject } = require('../models');
        const groups = await Group.findAll({
            include: [
                { model: User, as: 'leader', attributes: ['id', 'manv', 'hoten'] },
                { model: User, as: 'members', attributes: ['id', 'manv', 'hoten'], through: { attributes: [] } },
                { model: DuAn, as: 'projects', attributes: ['id', 'tenduan'], through: { attributes: [] } },
                { model: GroupProject, as: 'groupProjects', attributes: ['id', 'projectId', 'status'] }
            ],
            order: [['id', 'ASC']]
        });
        res.json({ groups });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Detail
exports.getGroup = async (req, res) => {
    try {
        const { GroupProject } = require('../models');
        const group = await Group.findByPk(req.params.id, {
            include: [
                { model: User, as: 'leader', attributes: ['id', 'manv', 'hoten'] },
                { model: User, as: 'members', attributes: ['id', 'manv', 'hoten'], through: { attributes: [] } },
                { model: DuAn, as: 'projects', attributes: ['id', 'tenduan'], through: { attributes: [] } },
                { model: GroupProject, as: 'groupProjects', attributes: ['id', 'projectId', 'status'] }
            ]
        });
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        res.json({ group });
    } catch (e) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Update
exports.updateGroup = async (req, res) => {
    try {
        const { name, description, leaderId } = req.body;
        const group = await Group.findByPk(req.params.id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

        await group.update({
            name: name ?? group.name,
            description: description ?? group.description,
            leaderId: leaderId ?? group.leaderId
        });

        const { GroupProject } = require('../models');
        const full = await Group.findByPk(group.id, {
            include: [
                { model: User, as: 'leader', attributes: ['id', 'manv', 'hoten'] },
                { model: User, as: 'members', attributes: ['id', 'manv', 'hoten'], through: { attributes: [] } },
                { model: DuAn, as: 'projects', attributes: ['id', 'tenduan'], through: { attributes: [] } },
                { model: GroupProject, as: 'groupProjects', attributes: ['id', 'projectId', 'status'] }
            ]
        });
        res.json({ message: 'Cập nhật thành công', group: full });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Add members
exports.addMembers = async (req, res) => {
    try {
        const { memberIds } = req.body;
        const { id } = req.params;
        if (!Array.isArray(memberIds) || !memberIds.length) return res.status(400).json({ message: 'memberIds rỗng' });

        const group = await Group.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

        // Validation cho từng member
        for (const userId of memberIds) {
            // Kiểm tra user đã là leader của nhóm khác chưa
            const existingLeaderGroup = await Group.findOne({ where: { leaderId: userId } });
            if (existingLeaderGroup) {
                const user = await User.findByPk(userId);
                return res.status(400).json({
                    message: `${user.hoten} đã là nhóm trưởng của nhóm "${existingLeaderGroup.name}"`
                });
            }

            // Kiểm tra user đã tham gia bao nhiêu nhóm
            const membershipCount = await GroupMember.count({ where: { userId } });
            if (membershipCount >= 2) {
                const user = await User.findByPk(userId);
                return res.status(400).json({
                    message: `${user.hoten} đã tham gia tối đa 2 nhóm`
                });
            }
        }

        const bulk = memberIds.map(uid => ({ groupId: id, userId: uid }));
        await GroupMember.bulkCreate(bulk, { ignoreDuplicates: true });
        const full = await Group.findByPk(id, { include: ['leader', 'members', 'duan'] });
        res.json({ message: 'Thêm thành viên thành công', group: full });
    } catch (e) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Remove member
exports.removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const gm = await GroupMember.findOne({ where: { groupId: id, userId } });
        if (!gm) return res.status(404).json({ message: 'Thành viên không thuộc nhóm' });
        await gm.destroy();
        res.json({ message: 'Đã xóa thành viên khỏi nhóm' });
    } catch (e) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Complete project for group
exports.completeProject = async (req, res) => {
    try {
        const { groupId, duanId } = req.body;

        const history = await GroupProjectHistory.findOne({
            where: {
                groupId,
                duanId,
                status: 'dang_tham_gia'
            }
        });

        if (!history) {
            return res.status(404).json({ message: 'Không tìm thấy dự án đang tham gia' });
        }

        await history.update({
            status: 'hoan_thanh',
            completedAt: new Date()
        });

        // Cập nhật duanId trong Groups nếu đây là dự án chính
        const group = await Group.findByPk(groupId);
        if (group.duanId === duanId) {
            // Tìm dự án khác đang tham gia để làm dự án chính
            const otherActiveProject = await GroupProjectHistory.findOne({
                where: {
                    groupId,
                    status: 'dang_tham_gia'
                }
            });

            await group.update({
                duanId: otherActiveProject ? otherActiveProject.duanId : null
            });
        }

        res.json({ message: 'Hoàn thành dự án thành công' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
