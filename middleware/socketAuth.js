const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from handshake auth or query
 */
const socketAuth = async (socket, next) => {
    try {
        // Get token from handshake auth or query
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            console.log('❌ Socket connection rejected: No token provided');
            return next(new Error('Authentication error: No token'));
        }

        const SECRET_KEY = process.env.SECRET_KEY || 'secret123';
        console.log('🔍 Socket auth - verifying token (length:', token.length, ')');
        console.log('🔑 Using SECRET_KEY:', SECRET_KEY);
        console.log('🔍 Token preview:', token.substring(0, 50) + '...');

        // Verify JWT
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log('✅ Token decoded successfully:', { userId: decoded.id, manv: decoded.manv });

        // Fetch user from database with role association
        const user = await User.findByPk(decoded.id, {
            include: [{
                model: require('../models').Role,
                as: 'role',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'manv', 'hoten', 'email', 'roleId']
        });

        if (!user) {
            console.log('❌ Socket connection rejected: User not found for id:', decoded.id);
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket
        socket.user = user.toJSON();
        console.log(`✅ Socket authenticated: user ${user.id} (${user.hoten})`);
        next();
    } catch (error) {
        console.error('❌ Socket auth error:', error.message);
        if (error.name === 'TokenExpiredError') {
            console.error('   Token expired at:', error.expiredAt);
        } else if (error.name === 'JsonWebTokenError') {
            console.error('   JWT Error:', error.message);
        }
        next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = socketAuth;
