// Admin upload avatar for any user
exports.adminUploadAvatar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.upload) return res.status(500).json({ message: 'Upload middleware not configured' });
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'No file uploaded' });
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.avatarData = file.buffer;
        user.avatarMime = file.mimetype;
        user.avatar = `/users/${user.id}/avatar`;
        await user.save();
        const avatarUrl = `/users/${user.id}/avatar`;
        res.json({ message: 'Avatar uploaded', avatarUrl });
    } catch (err) {
        console.error('Admin upload avatar error:', err);
        res.status(500).json({ error: err.message });
    }
}
const { User, Role, Permission } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

// Lấy thông tin người dùng với phân trang và tìm kiếm
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { manv: { [Op.like]: `%${search}%` } },
                { hoten: { [Op.like]: `%${search}%` } },
                { sdt: { [Op.like]: `%${search}%` } }
            ];
        }

        const includeClause = [{ model: Role, as: 'role' }];
        if (role) {
            includeClause[0].where = { name: role };
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            include: includeClause,
            attributes: { exclude: ['password', 'token', 'avatarData', 'avatarMime'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        // Map avatar url for each user if avatar hoặc avatarData tồn tại
        const usersWithAvatar = rows.map(u => {
            const user = u.toJSON();
            if (user.avatar) {
                user.avatarUrl = user.avatar;
            } else if (user.id) {
                user.avatarUrl = `/users/${user.id}/avatar`;
            }
            return user;
        });
        res.json({
            users: usersWithAvatar,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
    try {
        const { manv, password, chucvu, hoten, sdt, roleId } = req.body;

        // Kiểm tra mã nhân viên đã tồn tại
        const existingUser = await User.findOne({ where: { manv } });
        if (existingUser) {
            return res.status(400).json({ message: 'Mã nhân viên đã tồn tại' });
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            manv,
            password: hashedPassword,
            chucvu,
            hoten,
            sdt,
            roleId
        });

        // Lấy user với role để trả về
        const userWithRole = await User.findByPk(user.id, {
            include: [{ model: Role, as: 'role' }],
            attributes: { exclude: ['password', 'token'] }
        });

        res.status(201).json({
            message: 'Tạo người dùng thành công',
            user: userWithRole
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { manv, chucvu, hoten, sdt, roleId, password, avatar } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Kiểm tra mã nhân viên trùng (nếu thay đổi)
        if (manv && manv !== user.manv) {
            const existingUser = await User.findOne({ where: { manv } });
            if (existingUser) {
                return res.status(400).json({ message: 'Mã nhân viên đã tồn tại' });
            }
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = {};
        if (manv) updateData.manv = manv;
        if (chucvu) updateData.chucvu = chucvu;
        if (hoten) updateData.hoten = hoten;
        if (sdt) updateData.sdt = sdt;
        if (roleId) updateData.roleId = roleId;
        if (avatar) updateData.avatar = avatar;

        // Hash password mới nếu có
        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);

        // Lấy user đã cập nhật với role
        const updatedUser = await User.findByPk(id, {
            include: [{ model: Role, as: 'role' }],
            attributes: { exclude: ['password', 'token'] }
        });

        res.json({
            message: 'Cập nhật người dùng thành công',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Không cho xóa chính mình
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình' });
        }

        await user.destroy();

        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy thông tin người dùng theo ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            include: [{ model: Role, as: 'role' }],
            attributes: { exclude: ['password', 'token'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Thống kê dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // Tổng số người dùng
        const totalUsers = await User.count();

        // Người dùng theo vai trò
        const usersByRole = await User.findAll({
            include: [{ model: Role, as: 'role' }],
            attributes: ['roleId', [sequelize.fn('COUNT', sequelize.col('User.id')), 'count']],
            group: ['roleId', 'role.id']
        });

        // Người dùng mới trong 30 ngày
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsers = await User.count({
            where: {
                createdAt: {
                    [Op.gte]: thirtyDaysAgo
                }
            }
        });

        // Hoạt động gần đây (có thể mở rộng)
        const recentActivities = await User.findAll({
            limit: 5,
            order: [['updatedAt', 'DESC']],
            include: [{ model: Role, as: 'role' }],
            attributes: { exclude: ['password', 'token'] }
        });

        res.json({
            stats: {
                totalUsers,
                newUsers,
                usersByRole: usersByRole.map(item => {
                    // item.role may be null if the role association is missing; handle defensively
                    const roleName = item.role && item.role.name ? item.role.name : `role_${item.roleId}`;
                    return {
                        role: roleName,
                        count: item.dataValues?.count || 0
                    };
                })
            },
            recentActivities
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Upload avatar for current user
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.upload) return res.status(500).json({ message: 'Upload middleware not configured' });
        // multer middleware will have filled req.file
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'No file uploaded' });
        // store the file buffer directly on the User record (avatarData)
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.avatarData = file.buffer;
        user.avatarMime = file.mimetype;
        // keep legacy avatar string for compatibility but point to new endpoint
        user.avatar = `/users/${user.id}/avatar`;
        await user.save();

        const avatarUrl = `/users/${user.id}/avatar`;
        res.json({ message: 'Avatar uploaded', avatarUrl });
    } catch (err) {
        console.error('Upload avatar error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Delete current user's avatar
exports.deleteAvatar = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.avatarData = null;
        user.avatarMime = null;
        user.avatar = null;
        await user.save();

        res.json({ message: 'Avatar removed' });
    } catch (err) {
        console.error('Delete avatar error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Serve current user's avatar
exports.getMyAvatar = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ['avatarData', 'avatarMime'] });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.avatarData) return res.status(404).json({ message: 'Avatar not set' });

        res.setHeader('Content-Type', user.avatarMime || 'image/*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(user.avatarData);
    } catch (err) {
        console.error('Get my avatar error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Serve avatar by user id (public)
exports.getAvatarById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, { attributes: ['avatarData', 'avatarMime'] });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.avatarData) return res.status(404).json({ message: 'Avatar not set' });

        res.setHeader('Content-Type', user.avatarMime || 'image/*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(user.avatarData);
    } catch (err) {
        console.error('Get avatar by id error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Get current user's profile
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            include: [{ model: Role, as: 'role' }],
            attributes: { exclude: ['password', 'token'] }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Format avatar URL
        const userData = user.toJSON();
        if (userData.avatar) {
            userData.avatarUrl = userData.avatar;
        } else if (userData.id) {
            userData.avatarUrl = `/users/${userData.id}/avatar`;
        }

        res.json({ user: userData });
    } catch (err) {
        console.error('Get my profile error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Update current user's profile (allowed fields only)
exports.updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { hoten, sdt, chucvu, password } = req.body;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updateData = {};
        if (hoten) updateData.hoten = hoten;
        if (sdt) updateData.sdt = sdt;
        if (chucvu) updateData.chucvu = chucvu;

        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);

        const updatedUser = await User.findByPk(userId, { attributes: { exclude: ['password', 'token'] }, include: [{ model: Role, as: 'role' }] });
        res.json({ message: 'Cập nhật hồ sơ thành công', user: updatedUser });
    } catch (err) {
        console.error('Update my profile error:', err);
        res.status(500).json({ error: err.message });
    }
}
