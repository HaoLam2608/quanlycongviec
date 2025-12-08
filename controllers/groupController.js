// Đóng nhóm (chuyển trạng thái sang closed)
exports.closeGroup = async (req, res) => {
    try {
        const group = await Group.findByPk(req.params.id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        if (group.status === 'closed') return res.status(400).json({ message: 'Nhóm đã đóng trước đó' });
        await group.update({ status: 'closed' });
        res.json({ message: 'Đã đóng nhóm thành công', group });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
// Thêm nhóm vào dự án (group_projects)
exports.addGroupToProject = async (req, res) => {
    try {
        const { groupId, projectId } = req.body;
        if (!groupId || !projectId) return res.status(400).json({ message: 'Thiếu groupId hoặc projectId' });

        // Kiểm tra trạng thái nhóm
        const group = await Group.findByPk(groupId);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        if (group.status === 'closed') return res.status(400).json({ message: 'Nhóm đã đóng, không thể thêm vào dự án!' });

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
            // Kiểm tra leader đã là leader của nhóm ĐANG HOẠT ĐỘNG (không phải closed) chưa
            const allLeaderGroups = await Group.findAll({ where: { leaderId } });
            const activeLeaderGroup = allLeaderGroups.find(g => g.status !== 'closed');

            if (activeLeaderGroup) {
                return res.status(400).json({
                    message: `Người này đã là nhóm trưởng của nhóm "${activeLeaderGroup.name}"`
                });
            }

            // Kiểm tra leader đã là thành viên của nhóm ĐANG HOẠT ĐỘNG khác chưa
            const existingMembership = await GroupMember.findOne({ where: { userId: leaderId } });
            if (existingMembership) {
                const memberGroup = await Group.findByPk(existingMembership.groupId);
                // Chỉ báo lỗi nếu nhóm đó không phải closed
                if (memberGroup && memberGroup.status !== 'closed') {
                    return res.status(400).json({
                        message: `Người này đã là thành viên của nhóm "${memberGroup.name}"`
                    });
                }
            }
        }

        // Validation cho members nếu có
        if (Array.isArray(memberIds) && memberIds.length) {
            for (const userId of memberIds) {
                // Kiểm tra user đã là leader của nhóm ĐANG HOẠT ĐỘNG khác chưa
                const allLeaderGroups = await Group.findAll({ where: { leaderId: userId } });
                const activeLeaderGroup = allLeaderGroups.find(g => g.status !== 'closed');

                if (activeLeaderGroup) {
                    const user = await User.findByPk(userId);
                    return res.status(400).json({
                        message: `${user.hoten} đã là nhóm trưởng của nhóm "${activeLeaderGroup.name}"`
                    });
                }

                // Kiểm tra user đã tham gia bao nhiêu nhóm ĐANG HOẠT ĐỘNG
                // Lấy tất cả membership của user
                const memberships = await GroupMember.findAll({ where: { userId } });
                // Đếm số nhóm active
                let activeGroupCount = 0;
                for (const membership of memberships) {
                    const group = await Group.findByPk(membership.groupId);
                    if (group && group.status !== 'closed') {
                        activeGroupCount++;
                    }
                }

                if (activeGroupCount >= 2) {
                    const user = await User.findByPk(userId);
                    return res.status(400).json({
                        message: `${user.hoten} đã tham gia tối đa 2 nhóm`
                    });
                }
            }
        }

        const group = await Group.create({
            name,
            description,
            leaderId,
            duanId: req.body.duanId ?? null // Đảm bảo luôn có duanId, null nếu không chọn
        });

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
        console.error('Error in getGroups:', e);
        res.status(500).json({ message: 'Lỗi server', error: e.message });
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
    } catch (e) {
        console.error('Error in getGroup:', e);
        res.status(500).json({ message: 'Lỗi server', error: e.message });
    }
};

// Update
exports.updateGroup = async (req, res) => {
    try {
        const { name, description, leaderId, memberIds, projectIds } = req.body;
        const group = await Group.findByPk(req.params.id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        if (group.status === 'closed') return res.status(400).json({ message: 'Nhóm đã đóng, không thể chỉnh sửa!' });

        await group.update({
            name: name ?? group.name,
            description: description ?? group.description,
            leaderId: leaderId ?? group.leaderId
        });

        // Đồng bộ lại thành viên nhóm nếu có memberIds
        if (Array.isArray(memberIds)) {
            const { GroupMember } = require('../models');
            // Lấy danh sách thành viên hiện tại
            const currentMembers = await GroupMember.findAll({ where: { groupId: group.id } });
            const currentIds = currentMembers.map(m => m.userId);
            // Xóa các thành viên không còn trong memberIds
            const toRemove = currentIds.filter(id => !memberIds.includes(id));
            if (toRemove.length > 0) {
                await GroupMember.destroy({ where: { groupId: group.id, userId: toRemove } });
            }
            // Thêm các thành viên mới
            const toAdd = memberIds.filter(id => !currentIds.includes(id));
            if (toAdd.length > 0) {
                const bulk = toAdd.map(uid => ({ groupId: group.id, userId: uid }));
                await GroupMember.bulkCreate(bulk, { ignoreDuplicates: true });
            }
        }

        // Đồng bộ lại dự án nếu có projectIds
        if (Array.isArray(projectIds)) {
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
            const { GroupProject } = require('../models');
            // Lấy danh sách projectId hiện tại của nhóm
            const currentProjects = await GroupProject.findAll({ where: { groupId: group.id, status: 'active' } });
            const currentPids = currentProjects.map(p => p.projectId);
            // Xóa các dự án không còn trong projectIds
            const toRemove = currentPids.filter(pid => !projectIds.includes(pid));
            if (toRemove.length > 0) {
                await GroupProject.destroy({ where: { groupId: group.id, projectId: toRemove, status: 'active' } });
            }
            // Thêm các dự án mới
            const toAdd = projectIds.filter(pid => !currentPids.includes(pid));
            if (toAdd.length > 0) {
                const bulk = toAdd.map(pid => ({ groupId: group.id, projectId: pid, status: 'active' }));
                await GroupProject.bulkCreate(bulk, { ignoreDuplicates: true });
            }
        }

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
        if (group.status === 'closed') return res.status(400).json({ message: 'Nhóm đã đóng, không thể thêm thành viên!' });

        // Validation cho từng member
        for (const userId of memberIds) {
            // Kiểm tra user đã là leader của nhóm ĐANG HOẠT ĐỘNG khác chưa
            const allLeaderGroups = await Group.findAll({ where: { leaderId: userId } });
            const activeLeaderGroup = allLeaderGroups.find(g => g.status !== 'closed');

            if (activeLeaderGroup) {
                const user = await User.findByPk(userId);
                return res.status(400).json({
                    message: `${user.hoten} đã là nhóm trưởng của nhóm "${activeLeaderGroup.name}"`
                });
            }

            // Kiểm tra user đã tham gia bao nhiêu nhóm ĐANG HOẠT ĐỘNG
            const memberships = await GroupMember.findAll({ where: { userId } });
            let activeGroupCount = 0;
            for (const membership of memberships) {
                const memberGroup = await Group.findByPk(membership.groupId);
                if (memberGroup && memberGroup.status !== 'closed') {
                    activeGroupCount++;
                }
            }

            if (activeGroupCount >= 2) {
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
        const group = await Group.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        if (group.status === 'closed') return res.status(400).json({ message: 'Nhóm đã đóng, không thể xóa thành viên!' });
        const gm = await GroupMember.findOne({ where: { groupId: id, userId } });
        if (!gm) return res.status(404).json({ message: 'Thành viên không thuộc nhóm' });
        await gm.destroy();
        res.json({ message: 'Đã xóa thành viên khỏi nhóm' });
    } catch (e) { res.status(500).json({ message: 'Lỗi server' }); }
};

// Xóa nhóm khỏi dự án
exports.removeGroupFromProject = async (req, res) => {
    try {
        const { groupId, projectId } = req.body;
        if (!groupId || !projectId) return res.status(400).json({ message: 'Thiếu groupId hoặc projectId' });

        const { GroupProject } = require('../models');

        // Tìm bản ghi group_projects
        const groupProject = await GroupProject.findOne({
            where: { groupId, projectId, status: 'active' }
        });

        if (!groupProject) {
            return res.status(404).json({ message: 'Nhóm không tham gia dự án này hoặc đã bị xóa' });
        }

        // Xóa bản ghi
        await groupProject.destroy();

        res.json({ message: 'Đã xóa nhóm khỏi dự án thành công' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Lỗi server khi xóa nhóm khỏi dự án' });
    }
};

// Delete group (permanent)
exports.deleteGroup = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const id = req.params.id;
        const group = await Group.findByPk(id);
        if (!group) {
            await t.rollback();
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        // Remove related records first to be explicit
        await GroupMember.destroy({ where: { groupId: id }, transaction: t });
        const { GroupProject } = require('../models');
        await GroupProject.destroy({ where: { groupId: id }, transaction: t });
        await GroupProjectHistory.destroy({ where: { groupId: id }, transaction: t }).catch(() => { });

        // Finally remove the group
        await group.destroy({ transaction: t });

        await t.commit();
        res.json({ message: 'Đã xóa nhóm thành công' });
    } catch (e) {
        console.error('Error deleting group:', e);
        await t.rollback();
        res.status(500).json({ message: 'Lỗi server khi xóa nhóm' });
    }
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

// Get my groups (for teamleader) - supports multiple groups
exports.getMyGroup = async (req, res) => {
    try {
        console.log('🔍 getMyGroup called by user:', req.user);

        // Tìm tất cả nhóm mà user là leader (bao gồm cả active và closed)
        const groups = await Group.findAll({
            where: { leaderId: req.user.id },
            include: [
                {
                    model: User,
                    as: 'leader',
                    attributes: ['id', 'hoten', 'manv', 'email', 'sdt', 'chucvu']
                },
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'hoten', 'manv', 'email', 'sdt', 'chucvu'],
                    through: { attributes: [] }
                },
                {
                    model: require('../models').GroupProject,
                    as: 'groupProjects',
                    required: false,
                    include: [{
                        model: DuAn,
                        as: 'project',
                        attributes: ['id', 'tenduan', 'moTa', 'status']
                    }]
                }
            ],
            order: [
                ['status', 'DESC'], // active trước, closed sau
                ['createdAt', 'DESC']
            ]
        });

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Bạn chưa được gán làm trưởng nhóm nào' });
        }

        const activeGroups = groups.filter(g => g.status === 'active');
        const closedGroups = groups.filter(g => g.status === 'closed');

        console.log(`✅ Found ${groups.length} groups for teamleader (${activeGroups.length} active, ${closedGroups.length} closed)`);
        res.json({
            groups,
            activeGroups,
            closedGroups,
            // Backward compatibility: trả về nhóm active đầu tiên nếu có
            group: activeGroups[0] || groups[0]
        });
    } catch (error) {
        console.error('❌ getMyGroup error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Get group projects (for teamleader) - Lấy danh sách dự án của nhóm
exports.getGroupProjects = async (req, res) => {
    try {
        console.log('🔍 getGroupProjects called by user:', req.user.id);

        // Tìm tất cả nhóm mà user là leader
        const groups = await Group.findAll({
            where: { leaderId: req.user.id },
            attributes: ['id', 'name', 'status']
        });

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Bạn chưa được gán làm trưởng nhóm nào' });
        }

        const groupIds = groups.map(g => g.id);
        const { GroupProject } = require('../models');

        // Lấy tất cả dự án của các nhóm (cả active và completed)
        const groupProjects = await GroupProject.findAll({
            where: { groupId: groupIds },
            include: [
                {
                    model: DuAn,
                    as: 'project',
                    attributes: ['id', 'tenduan', 'mota', 'ngaybatdau', 'ngayketthuc', 'status'],
                    include: [{
                        model: User,
                        as: 'nguoiDamNhan',
                        attributes: ['id', 'hoten', 'manv', 'email']
                    }]
                },
                {
                    model: Group,
                    attributes: ['id', 'name', 'status']
                }
            ],
            order: [
                ['status', 'DESC'], // active trước
                ['createdAt', 'DESC']
            ]
        });

        // Phân loại dự án
        const activeProjects = groupProjects.filter(gp => gp.status === 'active');
        const completedProjects = groupProjects.filter(gp => gp.status === 'completed');

        console.log(`✅ Found ${groupProjects.length} projects (${activeProjects.length} active, ${completedProjects.length} completed)`);

        res.json({
            projects: groupProjects,
            activeProjects,
            completedProjects,
            groups
        });
    } catch (error) {
        console.error('❌ getGroupProjects error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Get available members - Lấy danh sách member có thể thêm vào nhóm
exports.getAvailableMembers = async (req, res) => {
    try {
        const { groupId } = req.query; // Optional: để loại trừ members hiện tại khi update

        // Lấy tất cả users
        const allUsers = await User.findAll({
            attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
            order: [['hoten', 'ASC']]
        });

        // Lấy tất cả nhóm active
        const activeGroups = await Group.findAll({
            where: { status: { [require('sequelize').Op.ne]: 'closed' } }
        });

        // Lấy tất cả group members
        const allGroupMembers = await GroupMember.findAll();

        const availableUsers = [];
        const unavailableUsers = [];

        for (const user of allUsers) {
            let isAvailable = true;
            let reason = '';

            // Kiểm tra xem user có phải là leader của nhóm active nào không
            const isLeaderOfActiveGroup = activeGroups.find(g => g.leaderId === user.id);
            if (isLeaderOfActiveGroup) {
                isAvailable = false;
                reason = `Đang là trưởng nhóm "${isLeaderOfActiveGroup.name}"`;
            }

            // Kiểm tra số lượng nhóm active mà user đang tham gia
            if (isAvailable) {
                const userMemberships = allGroupMembers.filter(m => m.userId === user.id);
                let activeGroupCount = 0;

                for (const membership of userMemberships) {
                    const group = activeGroups.find(g => g.id === membership.groupId);
                    if (group) {
                        // Nếu đang update nhóm, không đếm nhóm hiện tại
                        if (!groupId || group.id !== parseInt(groupId)) {
                            activeGroupCount++;
                        }
                    }
                }

                if (activeGroupCount >= 2) {
                    isAvailable = false;
                    reason = 'Đã tham gia tối đa 2 nhóm';
                }
            }

            // Nếu đang update, kiểm tra xem user đã là member của nhóm này chưa
            let isCurrentMember = false;
            if (groupId) {
                isCurrentMember = allGroupMembers.some(
                    m => m.userId === user.id && m.groupId === parseInt(groupId)
                );
            }

            const userData = {
                id: user.id,
                manv: user.manv,
                hoten: user.hoten,
                email: user.email,
                sdt: user.sdt,
                chucvu: user.chucvu,
                isCurrentMember,
                reason
            };

            if (isAvailable) {
                availableUsers.push(userData);
            } else {
                unavailableUsers.push(userData);
            }
        }

        res.json({
            availableUsers,
            unavailableUsers,
            total: allUsers.length,
            availableCount: availableUsers.length,
            unavailableCount: unavailableUsers.length
        });
    } catch (error) {
        console.error('❌ getAvailableMembers error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Get group detail with statistics - Chi tiết nhóm với thống kê
exports.getGroupDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const { GroupProject, Task, Subtask } = require('../models');

        // Lấy thông tin nhóm
        const group = await Group.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'leader',
                    attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu']
                },
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                    through: { attributes: [] }
                },
                {
                    model: GroupProject,
                    as: 'groupProjects',
                    include: [{
                        model: DuAn,
                        as: 'project',
                        attributes: ['id', 'tenduan', 'mota', 'ngaybatdau', 'ngayketthuc', 'status']
                    }]
                }
            ]
        });

        if (!group) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }

        // Lấy danh sách project IDs
        const projectIds = group.groupProjects
            .filter(gp => gp.status === 'active')
            .map(gp => gp.projectId);

        // Thống kê tasks và subtasks
        let taskStats = {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            overdue: 0
        };

        let subtaskStats = {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0
        };

        if (projectIds.length > 0) {
            const { Op } = require('sequelize');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Lấy tất cả tasks của các dự án
            const tasks = await Task.findAll({
                where: { duanId: projectIds }
            });

            taskStats.total = tasks.length;
            taskStats.completed = tasks.filter(t => t.trangThai === 'Hoàn thành').length;
            taskStats.inProgress = tasks.filter(t => t.trangThai === 'Đang chạy').length;
            taskStats.pending = tasks.filter(t => t.trangThai === 'Chưa bắt đầu').length;
            taskStats.overdue = tasks.filter(t =>
                t.trangThai !== 'Hoàn thành' &&
                t.ngayKetThuc &&
                new Date(t.ngayKetThuc) < today
            ).length;

            // Lấy tất cả subtasks
            const taskIds = tasks.map(t => t.id);
            if (taskIds.length > 0) {
                const subtasks = await Subtask.findAll({
                    where: { taskId: taskIds }
                });

                subtaskStats.total = subtasks.length;
                subtaskStats.completed = subtasks.filter(s => s.trangThai === 'Hoàn thành').length;
                subtaskStats.inProgress = subtasks.filter(s => s.trangThai === 'Đang chạy').length;
                subtaskStats.pending = subtasks.filter(s => s.trangThai === 'Chưa bắt đầu').length;
            }
        }

        // Member statistics
        const memberStats = group.members.map(member => ({
            id: member.id,
            manv: member.manv,
            hoten: member.hoten,
            email: member.email,
            chucvu: member.chucvu,
            // Có thể thêm thống kê task của từng member ở đây nếu cần
        }));

        res.json({
            group: {
                id: group.id,
                name: group.name,
                description: group.description,
                status: group.status,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt,
                leader: group.leader,
                memberCount: group.members.length,
                members: memberStats,
                projects: group.groupProjects.map(gp => ({
                    id: gp.project.id,
                    tenduan: gp.project.tenduan,
                    mota: gp.project.mota,
                    ngaybatdau: gp.project.ngaybatdau,
                    ngayketthuc: gp.project.ngayketthuc,
                    status: gp.project.status,
                    groupProjectStatus: gp.status
                }))
            },
            statistics: {
                tasks: taskStats,
                subtasks: subtaskStats,
                projects: {
                    total: group.groupProjects.length,
                    active: group.groupProjects.filter(gp => gp.status === 'active').length,
                    completed: group.groupProjects.filter(gp => gp.status === 'completed').length
                }
            }
        });
    } catch (error) {
        console.error('❌ getGroupDetail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
