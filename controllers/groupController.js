const { Group, GroupMember, User, DuAn, GroupProjectHistory, sequelize } = require('../models');

// Create group
exports.createGroup = async (req, res) => {
    try {
        const { name, description, duanId, leaderId, memberIds } = req.body;
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

        const group = await Group.create({ name, description, duanId, leaderId });

        // Nếu có dự án được chọn, thêm vào lịch sử
        if (duanId) {
            await GroupProjectHistory.create({
                groupId: group.id,
                duanId: duanId,
                status: 'dang_tham_gia'
            });
        }

        if (Array.isArray(memberIds) && memberIds.length) {
            const bulk = memberIds.map(uid => ({ groupId: group.id, userId: uid }));
            await GroupMember.bulkCreate(bulk, { ignoreDuplicates: true });
        }

        const full = await Group.findByPk(group.id, { include: ['leader', 'members', 'duan'] });
        res.status(201).json({ message: 'Tạo nhóm thành công', group: full });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// List groups (optional filter by duanId)
exports.getGroups = async (req, res) => {
    try {
        const { duanId } = req.query;
        const where = duanId ? { duanId } : {};
        const groups = await Group.findAll({
            where,
            include: [
                { model: User, as: 'leader', attributes: ['id', 'manv', 'hoten'] },
                { model: User, as: 'members', attributes: ['id', 'manv', 'hoten'], through: { attributes: [] } },
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] }
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
        const group = await Group.findByPk(req.params.id, {
            include: [
                { model: User, as: 'leader', attributes: ['id', 'manv', 'hoten'] },
                { model: User, as: 'members', attributes: ['id', 'manv', 'hoten'], through: { attributes: [] } },
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] }
            ]
        });
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        res.json({ group });
    } catch (e) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Update
exports.updateGroup = async (req, res) => {
    try {
        const { name, description, leaderId, duanId } = req.body;
        const group = await Group.findByPk(req.params.id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

        // Validation khi gán dự án mới
        if (duanId && duanId !== group.duanId) {
            // Kiểm tra nhóm đã tham gia bao nhiêu dự án đang hoạt động
            const activeProjectsCount = await GroupProjectHistory.count({
                where: {
                    groupId: group.id,
                    status: 'dang_tham_gia'
                }
            });

            if (activeProjectsCount >= 2) {
                return res.status(400).json({
                    message: 'Nhóm đã tham gia tối đa 2 dự án đồng thời. Vui lòng hoàn thành một dự án trước khi tham gia dự án mới.'
                });
            }

            // Kiểm tra dự án mới có tồn tại không
            const newProject = await DuAn.findByPk(duanId);
            if (!newProject) {
                return res.status(404).json({ message: 'Không tìm thấy dự án' });
            }

            // Kiểm tra nhóm đã từng tham gia dự án này chưa
            const existingHistory = await GroupProjectHistory.findOne({
                where: {
                    groupId: group.id,
                    duanId: duanId
                }
            });

            if (existingHistory) {
                if (existingHistory.status === 'dang_tham_gia') {
                    return res.status(400).json({
                        message: 'Nhóm đã đang tham gia dự án này'
                    });
                } else if (existingHistory.status === 'hoan_thanh') {
                    return res.status(400).json({
                        message: 'Nhóm đã hoàn thành dự án này trước đó'
                    });
                }
            }

            // Thêm dự án mới vào lịch sử
            await GroupProjectHistory.create({
                groupId: group.id,
                duanId: duanId,
                status: 'dang_tham_gia'
            });
        }

        await group.update({
            name: name ?? group.name,
            description: description ?? group.description,
            leaderId: leaderId ?? group.leaderId,
            duanId: duanId ?? group.duanId
        });

        const full = await Group.findByPk(group.id, { include: ['leader', 'members', 'duan'] });
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
