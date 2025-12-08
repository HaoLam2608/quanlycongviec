const { Conversation, ConversationParticipant, Message, User } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../models').sequelize;
const { sendPushToUsers } = require('./pushNotificationService');

/**
 * Chat Service - Business logic for chat operations
 */
class ChatService {
    /**
     * Check if user can access conversation
     */
    async canAccessConversation(userId, conversationId) {
        const participant = await ConversationParticipant.findOne({
            where: {
                conversationId,
                userId,
                leftAt: null
            }
        });
        return !!participant;
    }

    /**
     * Get or create direct conversation between two users
     */
    async getOrCreateDirectConversation(userId1, userId2) {
        // Find existing direct conversation
        const existingConversation = await sequelize.query(`
            SELECT c.* FROM conversations c
            INNER JOIN conversationparticipants cp1 ON cp1.conversationId = c.id AND cp1.userId = ?
            INNER JOIN conversationparticipants cp2 ON cp2.conversationId = c.id AND cp2.userId = ?
            WHERE c.type = 'direct' AND cp1.leftAt IS NULL AND cp2.leftAt IS NULL
            LIMIT 1
        `, {
            replacements: [userId1, userId2],
            type: QueryTypes.SELECT
        });

        if (existingConversation && existingConversation.length > 0) {
            return await this.getConversationById(existingConversation[0].id, userId1);
        }

        // Create new conversation
        const conversation = await Conversation.create({
            type: 'direct',
            createdBy: userId1
        });

        // Add participants
        await ConversationParticipant.bulkCreate([
            { conversationId: conversation.id, userId: userId1, role: 'member' },
            { conversationId: conversation.id, userId: userId2, role: 'member' }
        ]);

        return await this.getConversationById(conversation.id, userId1);
    }

    /**
     * Create group conversation
     */
    async createGroupConversation(creatorId, name, participantIds) {
        const conversation = await Conversation.create({
            type: 'group',
            name,
            createdBy: creatorId
        });

        // Add creator as admin
        const participants = [
            { conversationId: conversation.id, userId: creatorId, role: 'admin' }
        ];

        // Add other participants
        participantIds.forEach(userId => {
            if (userId !== creatorId) {
                participants.push({
                    conversationId: conversation.id,
                    userId,
                    role: 'member'
                });
            }
        });

        await ConversationParticipant.bulkCreate(participants);

        // Create system message
        await this.createMessage({
            conversationId: conversation.id,
            senderId: creatorId,
            content: `${name} đã được tạo`,
            type: 'system'
        });

        return await this.getConversationById(conversation.id, creatorId);
    }

    /**
     * Get conversation by ID with participants and last message
     */
    async getConversationById(conversationId, userId) {
        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                {
                    model: ConversationParticipant,
                    as: 'participants',
                    where: { leftAt: null },
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'manv', 'hoten', 'email', 'avatar']
                        }
                    ]
                },
                {
                    model: Message,
                    as: 'lastMessage',
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'hoten', 'avatar']
                        }
                    ]
                }
            ]
        });

        if (!conversation) return null;

        // Get unread count for current user
        const participant = conversation.participants.find(p => p.userId === userId);
        let unreadCount = 0;

        if (participant && participant.lastReadAt) {
            unreadCount = await Message.count({
                where: {
                    conversationId,
                    createdAt: { [Op.gt]: participant.lastReadAt },
                    senderId: { [Op.ne]: userId }
                }
            });
        } else if (participant) {
            unreadCount = await Message.count({
                where: {
                    conversationId,
                    senderId: { [Op.ne]: userId }
                }
            });
        }

        const result = conversation.toJSON();
        result.unreadCount = unreadCount;
        result.currentUserParticipant = participant;

        return result;
    }

    /**
     * Get conversations for user
     */
    async getUserConversations(userId, { limit = 50, offset = 0 } = {}) {
        console.log('📋 getUserConversations - userId:', userId);

        // Get all conversations where user is a participant
        const conversations = await Conversation.findAll({
            include: [
                {
                    model: ConversationParticipant,
                    as: 'participants',
                    required: true,
                    where: { leftAt: null }
                }
            ],
            where: {
                id: {
                    [Op.in]: sequelize.literal(`(
                        SELECT conversationId 
                        FROM conversationparticipants 
                        WHERE userId = ${userId} AND leftAt IS NULL
                    )`)
                }
            },
            order: [
                ['updatedAt', 'DESC']
            ],
            limit,
            offset
        });

        // Now load full details for each conversation
        const fullConversations = await Promise.all(
            conversations.map(conv => this.getConversationById(conv.id, userId))
        );

        return fullConversations.filter(c => c !== null);

        // Calculate unread counts
        const result = await Promise.all(
            conversations.map(async (conv) => {
                const participant = conv.participants.find(p => p.userId === userId);
                let unreadCount = 0;

                if (participant && participant.lastReadAt) {
                    unreadCount = await Message.count({
                        where: {
                            conversationId: conv.id,
                            createdAt: { [Op.gt]: participant.lastReadAt },
                            senderId: { [Op.ne]: userId }
                        }
                    });
                } else if (participant) {
                    unreadCount = await Message.count({
                        where: {
                            conversationId: conv.id,
                            senderId: { [Op.ne]: userId }
                        }
                    });
                }

                const data = conv.toJSON();
                data.unreadCount = unreadCount;
                return data;
            })
        );

        return result;
    }

    /**
     * Get messages for conversation
     */
    async getMessages(conversationId, userId, { limit = 50, offset = 0 } = {}) {
        // Verify access
        const canAccess = await this.canAccessConversation(userId, conversationId);
        if (!canAccess) {
            throw new Error('Không có quyền truy cập cuộc trò chuyện này');
        }

        const messages = await Message.findAll({
            where: {
                conversationId,
                deletedAt: null
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'manv', 'hoten', 'email', 'avatar']
                },
                {
                    model: Message,
                    as: 'repliedMessage',
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'hoten', 'avatar']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        return messages.reverse(); // Return chronological order
    }

    /**
     * Create new message
     */
    async createMessage({ conversationId, senderId, content, type = 'text', attachments, replyTo }) {
        // Verify sender is participant
        const canAccess = await this.canAccessConversation(senderId, conversationId);
        if (!canAccess) {
            throw new Error('Không có quyền gửi tin nhắn trong cuộc trò chuyện này');
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content,
            type,
            attachments,
            replyTo
        });

        // Update conversation last message
        await Conversation.update(
            {
                lastMessageId: message.id,
                lastMessageAt: message.createdAt
            },
            { where: { id: conversationId } }
        );

        // Return message with sender info
        return await Message.findByPk(message.id, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'manv', 'hoten', 'email', 'avatar']
                },
                {
                    model: Message,
                    as: 'repliedMessage',
                    include: [
                        {
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'hoten', 'avatar']
                        }
                    ]
                }
            ]
        });
    }

    /**
     * Mark messages as read
     */
    async markAsRead(userId, conversationId, messageId = null) {
        const participant = await ConversationParticipant.findOne({
            where: { conversationId, userId, leftAt: null }
        });

        if (!participant) {
            throw new Error('Không tìm thấy người tham gia');
        }

        // If messageId provided, use its timestamp; otherwise use current time
        let readAt = new Date();
        if (messageId) {
            const message = await Message.findByPk(messageId);
            if (message) {
                readAt = message.createdAt;
            }
        }

        await participant.update({ lastReadAt: readAt });
        return participant;
    }

    /**
     * Update message
     */
    async updateMessage(messageId, userId, updates) {
        const message = await Message.findByPk(messageId);

        if (!message) {
            throw new Error('Tin nhắn không tồn tại');
        }

        if (message.senderId !== userId) {
            throw new Error('Chỉ người gửi mới có thể sửa tin nhắn');
        }

        await message.update(updates);
        return await Message.findByPk(messageId, {
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'hoten', 'avatar']
                }
            ]
        });
    }

    /**
     * Delete message (soft delete)
     */
    async deleteMessage(messageId, userId) {
        const message = await Message.findByPk(messageId);

        if (!message) {
            throw new Error('Tin nhắn không tồn tại');
        }

        if (message.senderId !== userId) {
            throw new Error('Chỉ người gửi mới có thể xóa tin nhắn');
        }

        await message.update({ deletedAt: new Date() });
        return message;
    }

    /**
     * Send push notifications for new message
     */
    async sendMessageNotifications(conversationId, message) {
        try {
            // Get all participants except sender
            const participants = await ConversationParticipant.findAll({
                where: {
                    conversationId,
                    userId: { [Op.ne]: message.senderId },
                    leftAt: null
                }
            });

            const userIds = participants.map(p => p.userId);
            if (userIds.length === 0) return;

            // Get sender info
            const sender = await User.findByPk(message.senderId, {
                attributes: ['hoten']
            });

            // Get conversation info
            const conversation = await Conversation.findByPk(conversationId);
            const title = conversation.type === 'direct'
                ? sender?.hoten || 'Tin nhắn mới'
                : conversation.name || 'Cuộc trò chuyện nhóm';

            const body = message.content || 'Đã gửi file đính kèm';

            // Send push notification
            await sendPushToUsers(userIds, title, body, {
                type: 'chat',
                conversationId,
                messageId: message.id
            });
        } catch (error) {
            console.error('Error sending message notifications:', error);
        }
    }

    /**
     * Add participants to group conversation
     */
    async addParticipants(conversationId, userId, participantIds) {
        const conversation = await Conversation.findByPk(conversationId);

        if (!conversation || conversation.type !== 'group') {
            throw new Error('Chỉ có thể thêm thành viên vào nhóm');
        }

        // Check if user is admin
        const userParticipant = await ConversationParticipant.findOne({
            where: { conversationId, userId, leftAt: null }
        });

        if (!userParticipant || userParticipant.role !== 'admin') {
            throw new Error('Chỉ admin mới có thể thêm thành viên');
        }

        const participants = participantIds.map(id => ({
            conversationId,
            userId: id,
            role: 'member'
        }));

        await ConversationParticipant.bulkCreate(participants, {
            ignoreDuplicates: true
        });

        // Create system message
        const addedUsers = await User.findAll({
            where: { id: participantIds },
            attributes: ['hoten']
        });

        const names = addedUsers.map(u => u.hoten).join(', ');
        await this.createMessage({
            conversationId,
            senderId: userId,
            content: `${names} đã được thêm vào nhóm`,
            type: 'system'
        });
    }

    /**
     * Remove participant from group
     */
    async removeParticipant(conversationId, userId, targetUserId) {
        const conversation = await Conversation.findByPk(conversationId);

        if (!conversation || conversation.type !== 'group') {
            throw new Error('Chỉ có thể xóa thành viên khỏi nhóm');
        }

        // Check if user is admin
        const userParticipant = await ConversationParticipant.findOne({
            where: { conversationId, userId, leftAt: null }
        });

        if (!userParticipant || userParticipant.role !== 'admin') {
            throw new Error('Chỉ admin mới có thể xóa thành viên');
        }

        const targetParticipant = await ConversationParticipant.findOne({
            where: { conversationId, userId: targetUserId, leftAt: null }
        });

        if (targetParticipant) {
            await targetParticipant.update({ leftAt: new Date() });

            // Create system message
            const targetUser = await User.findByPk(targetUserId, { attributes: ['hoten'] });
            await this.createMessage({
                conversationId,
                senderId: userId,
                content: `${targetUser?.hoten} đã rời khỏi nhóm`,
                type: 'system'
            });
        }
    }
}

module.exports = new ChatService();
