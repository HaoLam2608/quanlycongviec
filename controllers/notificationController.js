const { Notification, User, UserNotification } = require('../models');
const { Op } = require('sequelize');

// Get all notifications for admin
exports.getAllNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const type = req.query.type;
        const status = req.query.status;
        const search = req.query.search;

        let whereClause = {};

        if (type) {
            whereClause.type = type;
        }

        if (status) {
            whereClause.status = status;
        }

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'manv', 'hoten']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: notifications.rows,
            pagination: {
                page,
                limit,
                total: notifications.count,
                totalPages: Math.ceil(notifications.count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thông báo',
            error: error.message
        });
    }
};

// Get notifications for current user
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Load user with role to get role name
        const userWithRole = await User.findByPk(userId, {
            include: [{
                model: require('../models').Role,
                as: 'role',
                attributes: ['name']
            }]
        });

        const userRole = userWithRole?.role?.name || 'member'; // default to member if no role

        // Map employee role to member for notification targeting
        const mappedRole = userRole === 'employee' ? 'member' : userRole;
        console.log(`🔔 getUserNotifications for user ${userId}, role: ${userRole}, mapped: ${mappedRole}`);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // 1) role-based notifications (broadcasts)
        const roleNotifications = await Notification.findAll({
            where: {
                status: 'published',
                [Op.or]: [
                    { targetAudience: { [Op.like]: '%all%' } },
                    { targetAudience: { [Op.like]: `%${mappedRole}%` } }
                ]
            },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'manv', 'hoten']
            }],
            order: [['createdAt', 'DESC']]
        });

        // 2) user-specific notifications via UserNotification
        const userNotifs = await Notification.findAll({
            include: [
                {
                    model: UserNotification,
                    as: 'UserNotifications',
                    where: { userId },
                    required: true,
                    attributes: ['isRead', 'meta']
                },
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'manv', 'hoten']
                }
            ],
            where: {
                status: 'published'
            },
            order: [['createdAt', 'DESC']]
        });

        // Map user-specific notifications to include meta from UserNotification
        const userMapped = userNotifs.map(n => {
            const u = n.dataValues;
            const userNotif = (n.UserNotifications && n.UserNotifications[0]) || null;
            const userNotifData = userNotif?.dataValues || userNotif;

            console.log('🔍 Processing notification:', {
                id: n.id,
                title: u.title,
                userNotif: userNotifData,
                meta: userNotifData?.meta
            });

            return {
                ...u,
                userMeta: userNotifData?.meta || null,
                isRead: userNotifData?.isRead || false
            };
        });

        console.log(`📊 User-specific notifications: ${userMapped.length}`);
        if (userMapped.length > 0) {
            console.log('User notifications details:', userMapped.map(n => ({
                id: n.id,
                title: n.title,
                userMeta: n.userMeta,
                isRead: n.isRead
            })));
        }

        // Map role-based notifications to include default isRead: false
        const roleMapped = roleNotifications.map(n => ({
            ...n.dataValues,
            isRead: false, // Role-based notifications are never marked as read
            userMeta: null
        }));

        console.log(`📊 Role-based notifications: ${roleMapped.length}`);

        // Merge and dedupe by id, prioritizing user-specific over role-based
        const combined = [...roleMapped, ...userMapped];
        const mapById = new Map();
        combined.forEach(n => {
            if (!mapById.has(n.id)) {
                mapById.set(n.id, n);
            } else {
                // If exists, prioritize user-specific (userMapped comes last)
                const existing = mapById.get(n.id);
                if (n.userMeta || n.isRead) {
                    mapById.set(n.id, n);
                }
            }
        });

        const allNotifications = Array.from(mapById.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log(`📦 Total merged notifications: ${allNotifications.length}`);
        const assignmentCount = allNotifications.filter(n => n.userMeta?.assignmentId).length;
        console.log(`🎯 Assignment notifications in response: ${assignmentCount}`);

        // Pagination
        const paged = allNotifications.slice(offset, offset + limit);

        console.log(`📄 Sending ${paged.length} notifications (page ${page})`);
        console.log('📋 Detailed response data:');
        paged.forEach((n, idx) => {
            console.log(`  [${idx + 1}] ID: ${n.id}, Title: "${n.title}"`);
            console.log(`      userMeta: ${JSON.stringify(n.userMeta)}`);
            console.log(`      isRead: ${n.isRead}`);
        });

        res.json({
            success: true,
            data: paged,
            pagination: {
                page,
                limit,
                total: allNotifications.length,
                totalPages: Math.ceil(allNotifications.length / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông báo của người dùng',
            error: error.message
        });
    }
};

// Create new notification
exports.createNotification = async (req, res) => {
    try {
        console.log('Create notification request body:', req.body);
        console.log('User:', req.user);

        const { title, content, type, priority, targetRole } = req.body;
        const authorId = req.user.id;

        if (!title || !content || !type) {
            console.log('Missing required fields:', { title, content, type });
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        console.log('Creating notification with data:', {
            title,
            content,
            type,
            priority: priority || 'medium',
            targetAudience: Array.isArray(targetRole) ? targetRole.join(',') : targetRole,
            authorId,
            status: 'draft'
        });

        const notification = await Notification.create({
            title,
            content,
            type,
            priority: priority || 'medium',
            targetAudience: Array.isArray(targetRole) ? targetRole.join(',') : targetRole,
            authorId,
            status: 'draft'
        });

        const notificationWithAuthor = await Notification.findByPk(notification.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'manv', 'hoten']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Tạo thông báo thành công',
            data: notificationWithAuthor
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thông báo',
            error: error.message
        });
    }
};

// Update notification
exports.updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, type, priority, targetRole } = req.body;

        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        await notification.update({
            title: title || notification.title,
            content: content || notification.content,
            type: type || notification.type,
            priority: priority || notification.priority,
            targetAudience: targetRole ?
                (Array.isArray(targetRole) ? targetRole.join(',') : targetRole) :
                notification.targetAudience
        });

        const updatedNotification = await Notification.findByPk(id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'manv', 'hoten']
            }]
        });

        res.json({
            success: true,
            message: 'Cập nhật thông báo thành công',
            data: updatedNotification
        });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông báo',
            error: error.message
        });
    }
};

// Publish/unpublish notification
exports.toggleNotificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'publish' or 'unpublish'

        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        const newStatus = action === 'publish' ? 'published' : 'draft';
        await notification.update({
            status: newStatus,
            publishedAt: action === 'publish' ? new Date() : null
        });

        const updatedNotification = await Notification.findByPk(id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'manv', 'hoten']
            }]
        });

        res.json({
            success: true,
            message: action === 'publish' ? 'Đã xuất bản thông báo' : 'Đã hủy xuất bản thông báo',
            data: updatedNotification
        });
    } catch (error) {
        console.error('Error toggling notification status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thay đổi trạng thái thông báo',
            error: error.message
        });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        await notification.destroy();

        res.json({
            success: true,
            message: 'Xóa thông báo thành công'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thông báo',
            error: error.message
        });
    }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
    try {
        const totalNotifications = await Notification.count();
        const publishedNotifications = await Notification.count({ where: { status: 'published' } });
        const draftNotifications = await Notification.count({ where: { status: 'draft' } });

        // Count by type
        const typeStats = await Notification.findAll({
            attributes: [
                'type',
                [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count']
            ],
            group: ['type']
        });

        // Count by priority
        const priorityStats = await Notification.findAll({
            attributes: [
                'priority',
                [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count']
            ],
            group: ['priority']
        });

        res.json({
            success: true,
            data: {
                total: totalNotifications,
                published: publishedNotifications,
                draft: draftNotifications,
                byType: typeStats.reduce((acc, item) => {
                    acc[item.type] = parseInt(item.dataValues.count);
                    return acc;
                }, {}),
                byPriority: priorityStats.reduce((acc, item) => {
                    acc[item.priority] = parseInt(item.dataValues.count);
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê thông báo',
            error: error.message
        });
    }
};

// Mark notification as read for user
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if notification exists
        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        const { UserNotification } = require('../models');
        if (UserNotification) {
            // Find or create UserNotification entry
            const [userNotif, created] = await UserNotification.findOrCreate({
                where: { userId, notificationId: id },
                defaults: { isRead: true, meta: null }
            });

            if (!created && !userNotif.isRead) {
                await userNotif.update({ isRead: true });
            }

            return res.json({
                success: true,
                message: 'Đã đánh dấu thông báo là đã đọc',
                isRead: true
            });
        }

        // Fallback if UserNotification model not available
        res.json({ success: true, message: 'Đã đánh dấu thông báo là đã đọc' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu đã đọc',
            error: error.message
        });
    }
};

// Mark all notifications as read for user
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        // Load user with role
        const userWithRole = await User.findByPk(userId, {
            include: [{
                model: require('../models').Role,
                as: 'role',
                attributes: ['name']
            }]
        });

        const userRole = userWithRole?.role?.name || 'member';
        const mappedRole = userRole === 'employee' ? 'member' : userRole;

        // Get all notifications for this user (role-based + user-specific)
        const roleNotifications = await Notification.findAll({
            where: {
                status: 'published',
                [Op.or]: [
                    { targetAudience: { [Op.like]: '%all%' } },
                    { targetAudience: { [Op.like]: `%${mappedRole}%` } }
                ]
            },
            attributes: ['id']
        });

        const userNotifs = await Notification.findAll({
            include: [{
                model: UserNotification,
                as: 'UserNotifications',
                where: { userId },
                required: true
            }],
            where: { status: 'published' },
            attributes: ['id']
        });

        // Merge notification IDs
        const allNotifIds = [...new Set([
            ...roleNotifications.map(n => n.id),
            ...userNotifs.map(n => n.id)
        ])];

        // Mark all as read in UserNotification table
        for (const notifId of allNotifIds) {
            await UserNotification.upsert({
                userId,
                notificationId: notifId,
                isRead: true,
                meta: null
            });
        }

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo là đã đọc',
            count: allNotifIds.length
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đánh dấu tất cả đã đọc',
            error: error.message
        });
    }
};