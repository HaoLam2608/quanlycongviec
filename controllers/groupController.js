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
        await GroupProjectHistory.destroy({ where: { groupId: id }, transaction: t }).catch(() => {});

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
