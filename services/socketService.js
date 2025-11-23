const { Server } = require('socket.io');
const socketAuth = require('../middleware/socketAuth');
const chatService = require('../services/chatService');

/**
 * Normalize conversation payloads coming from different clients
 */
const getConversationId = (payload) => {
    if (payload == null) return null;
    if (typeof payload === 'object') {
        return payload.conversationId ?? payload.id ?? null;
    }
    const parsed = Number(payload);
    return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Initialize Socket.IO server
 */
function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // In production, specify exact origins
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(socketAuth);

    // Track online users
    const onlineUsers = new Set();

    // Connection handler
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`🔌 User connected: ${user.id} (${user.hoten})`);

        // Add user to online set
        onlineUsers.add(user.id);
        console.log('📊 Online users:', Array.from(onlineUsers));

        // Broadcast to all users that this user is online
        console.log('📢 Broadcasting user:online for userId:', user.id);
        io.emit('user:online', { userId: user.id });

        // Send current online users list to the connected user
        socket.emit('users:online', { userIds: Array.from(onlineUsers) });

        // Join user to their personal room (for DMs and notifications)
        socket.join(`user:${user.id}`);

        // Handle conversation join
        socket.on('conversation:join', async (payload) => {
            try {
                const conversationId = getConversationId(payload);
                if (!conversationId) {
                    socket.emit('error', { message: 'conversationId không hợp lệ' });
                    return;
                }
                // Verify user is participant
                const canJoin = await chatService.canAccessConversation(user.id, conversationId);
                if (!canJoin) {
                    socket.emit('error', { message: 'Không có quyền truy cập cuộc trò chuyện này' });
                    return;
                }

                socket.join(`conversation:${conversationId}`);
                console.log(`📥 User ${user.id} joined conversation ${conversationId}`);
                socket.emit('conversation:joined', { conversationId });
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Handle conversation leave
        socket.on('conversation:leave', (payload) => {
            const conversationId = getConversationId(payload);
            if (!conversationId) {
                return;
            }
            socket.leave(`conversation:${conversationId}`);
            console.log(`📤 User ${user.id} left conversation ${conversationId}`);
        });

        // Handle new message
        socket.on('message:send', async (data) => {
            try {
                const { conversationId, content, type = 'text', attachments, replyTo } = data;

                // Create message in database
                const message = await chatService.createMessage({
                    conversationId,
                    senderId: user.id,
                    content,
                    type,
                    attachments,
                    replyTo
                });

                // Broadcast to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', message);

                // Send push notifications to offline participants
                await chatService.sendMessageNotifications(conversationId, message);

                console.log(`💬 Message ${message.id} sent in conversation ${conversationId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Handle typing indicator
        socket.on('typing:start', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit('typing:start', {
                conversationId,
                userId: user.id,
                userName: user.hoten
            });
        });

        socket.on('typing:stop', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit('typing:stop', {
                conversationId,
                userId: user.id
            });
        });

        // Handle message read
        socket.on('message:read', async ({ conversationId, messageId }) => {
            try {
                await chatService.markAsRead(user.id, conversationId, messageId);
                
                // Notify other participants
                socket.to(`conversation:${conversationId}`).emit('message:read', {
                    conversationId,
                    userId: user.id,
                    messageId
                });
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        });

        // Handle message update/delete
        socket.on('message:update', async ({ messageId, content }) => {
            try {
                const message = await chatService.updateMessage(messageId, user.id, { content });
                io.to(`conversation:${message.conversationId}`).emit('message:updated', message);
            } catch (error) {
                console.error('Error updating message:', error);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('message:delete', async ({ messageId }) => {
            try {
                const message = await chatService.deleteMessage(messageId, user.id);
                io.to(`conversation:${message.conversationId}`).emit('message:deleted', { messageId });
            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${user.id} (${user.hoten})`);
            
            // Remove user from online set
            onlineUsers.delete(user.id);
            console.log('📊 Online users after disconnect:', Array.from(onlineUsers));
            
            // Broadcast to all users that this user is offline
            console.log('📢 Broadcasting user:offline for userId:', user.id);
            io.emit('user:offline', { userId: user.id });
        });

         // ===== CALL SIGNALING (1-1) =====

         socket.on("call:request" , ({ toUserId, conversationId , callType }) => {
            io.to(`user:${toUserId}`).emit("call:incoming", {
                fromUserId: user.id,
                fromName: user.hoten,
                conversationId,
                callType,
            });
        });

        socket.on("call:accept" , ({ toUserId, conversationId }) => {
            io.to(`user:${toUserId}`).emit("call:accepted", {
                fromUserId: user.id,
                conversationId,
            });
        });

        socket.on("call:reject" , ({ toUserId, conversationId }) => {
            io.to(`user:${toUserId}`).emit("call:rejected", {
                fromUserId: user.id,
                conversationId,
            });
        });

        socket.on("call:end" , ({ toUserId }) => {
            io.to(`user:${toUserId}`).emit("call:ended", {
                fromUserId: user.id,
            });
        });

         socket.on('webrtc:offer', ({ toUserId, offer }) => {
            io.to(`user:${toUserId}`).emit('webrtc:offer', {
                fromUserId: user.id,
                offer
            });
        });

        socket.on('webrtc:answer', ({ toUserId, answer }) => {
            io.to(`user:${toUserId}`).emit('webrtc:answer', {
                fromUserId: user.id,
                answer
            });
        });

        socket.on('webrtc:candidate', ({ toUserId, candidate }) => {
            io.to(`user:${toUserId}`).emit('webrtc:candidate', {
                fromUserId: user.id,
                candidate
            });
        });
         // ===== WEBRTC SIGNALING =====
    });

    console.log('✅ Socket.IO server initialized');
    return io;
}

module.exports = initializeSocket;
