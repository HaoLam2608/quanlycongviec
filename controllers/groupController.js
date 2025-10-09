const { Group, GroupMember, User, DuAn } = require('../models');

// Create group
exports.createGroup = async (req, res) => {
    try {
        const { name, description, duanId, leaderId, memberIds } = req.body;
        if (!name || !duanId) return res.status(400).json({ message: 'Thiếu name hoặc duanId' });

        const group = await Group.create({ name, description, duanId, leaderId });

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

        await group.update({
            name: name ?? group.name,
            description: description ?? group.description,
            leaderId: leaderId ?? group.leaderId,
            duanId: duanId ?? group.duanId
        });

        const full = await Group.findByPk(group.id, { include: ['leader', 'members', 'duan'] });
        res.json({ message: 'Cập nhật thành công', group: full });
    } catch (e) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Delete
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findByPk(req.params.id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        await group.destroy();
        res.json({ message: 'Xóa nhóm thành công' });
    } catch (e) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Add members
exports.addMembers = async (req, res) => {
    try {
        const { memberIds } = req.body;
        const { id } = req.params;
        if (!Array.isArray(memberIds) || !memberIds.length) return res.status(400).json({ message: 'memberIds rỗng' });
        const group = await Group.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
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
