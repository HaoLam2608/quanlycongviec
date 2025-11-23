const chatService = require('../services/chatService');
const multer = require('multer');
const path = require('path');

// Configure multer for chat attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/chat/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('File type not allowed'));
    }
}).array('files', 5); // Max 5 files

/**
 * Get user's conversations
 */
exports.getConversations = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const conversations = await chatService.getUserConversations(
            req.user.id,
            { limit: parseInt(limit), offset: parseInt(offset) }
        );
        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get conversation by ID
 */
exports.getConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const canAccess = await chatService.canAccessConversation(req.user.id, id);
        
        if (!canAccess) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        const conversation = await chatService.getConversationById(id, req.user.id);
        if (!conversation) {
            return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create direct conversation
 */
exports.createDirectConversation = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const conversation = await chatService.getOrCreateDirectConversation(
            req.user.id,
            userId
        );
        
        res.status(201).json(conversation);
    } catch (error) {
        console.error('Create direct conversation error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create group conversation
 */
exports.createGroupConversation = async (req, res) => {
    try {
        const { name, participantIds = [] } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }

        if (participantIds.length === 0) {
            return res.status(400).json({ error: 'participantIds is required' });
        }

        const conversation = await chatService.createGroupConversation(
            req.user.id,
            name,
            participantIds
        );
        
        res.status(201).json(conversation);
    } catch (error) {
        console.error('Create group conversation error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get messages for conversation
 */
exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const messages = await chatService.getMessages(
            id,
            req.user.id,
            { limit: parseInt(limit), offset: parseInt(offset) }
        );

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Send message (REST fallback)
 */
exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, type = 'text', replyTo } = req.body;

        if (!content && type === 'text') {
            return res.status(400).json({ error: 'content is required' });
        }

        const message = await chatService.createMessage({
            conversationId: id,
            senderId: req.user.id,
            content,
            type,
            replyTo
        });

        // Send notifications
        await chatService.sendMessageNotifications(id, message);

        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Upload attachment
 */
exports.uploadAttachment = (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        try {
            const { id } = req.params;
            const { replyTo } = req.body;

            const canAccess = await chatService.canAccessConversation(req.user.id, id);
            if (!canAccess) {
                return res.status(403).json({ error: 'Không có quyền truy cập' });
            }

            const attachments = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                path: `/uploads/chat/${file.filename}`,
                size: file.size,
                mimeType: file.mimetype
            }));

            const message = await chatService.createMessage({
                conversationId: id,
                senderId: req.user.id,
                content: `Đã gửi ${req.files.length} file`,
                type: req.files[0].mimetype.startsWith('image/') ? 'image' : 'file',
                attachments,
                replyTo
            });

            // Send notifications
            await chatService.sendMessageNotifications(id, message);

            res.status(201).json(message);
        } catch (error) {
            console.error('Upload attachment error:', error);
            res.status(500).json({ error: error.message });
        }
    });
};

/**
 * Mark conversation as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { messageId } = req.body;

        await chatService.markAsRead(req.user.id, id, messageId);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update message
 */
exports.updateMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'content is required' });
        }

        const message = await chatService.updateMessage(messageId, req.user.id, { content });
        res.json(message);
    } catch (error) {
        console.error('Update message error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete message
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        await chatService.deleteMessage(messageId, req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Add participants to group
 */
exports.addParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const { participantIds } = req.body;

        if (!Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ error: 'participantIds is required' });
        }

        await chatService.addParticipants(id, req.user.id, participantIds);
        res.json({ success: true });
    } catch (error) {
        console.error('Add participants error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Remove participant from group
 */
exports.removeParticipant = async (req, res) => {
    try {
        const { id, userId } = req.params;
        await chatService.removeParticipant(id, req.user.id, userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Remove participant error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Upload group avatar
 */
exports.uploadGroupAvatar = async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { Conversation } = require('../models');
        const conversation = await Conversation.findByPk(id);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        if (conversation.type !== 'group') {
            return res.status(400).json({ error: 'Can only upload avatar for group conversations' });
        }

        // Store avatar as blob
        conversation.avatarData = file.buffer;
        conversation.avatarMime = file.mimetype;
        conversation.avatar = `/chat/conversations/${id}/avatar`;
        await conversation.save();

        res.json({ 
            success: true,
            avatarUrl: conversation.avatar
        });
    } catch (error) {
        console.error('Upload group avatar error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get group avatar
 */
exports.getGroupAvatar = async (req, res) => {
    try {
        const { id } = req.params;
        const { Conversation } = require('../models');
        
        const conversation = await Conversation.findByPk(id, {
            attributes: ['id', 'type', 'avatarData', 'avatarMime', 'name']
        });
        
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        // If has avatar data, send it
        if (conversation.avatarData && conversation.avatarMime) {
            res.set('Content-Type', conversation.avatarMime);
            res.set('Cache-Control', 'public, max-age=86400');
            return res.send(conversation.avatarData);
        }
        
        // Default: generate SVG with group icon or first letter
        const initial = conversation.name ? conversation.name[0].toUpperCase() : 'G';
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const bgColor = colors[parseInt(id) % colors.length];
        
        const svg = `
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="${bgColor}"/>
                <text x="50" y="50" font-size="48" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="bold">
                    ${initial}
                </text>
            </svg>
        `;
        
        res.set('Content-Type', 'image/svg+xml');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(svg.trim());
    } catch (error) {
        console.error('Get group avatar error:', error);
        res.status(500).json({ error: error.message });
    }
};
