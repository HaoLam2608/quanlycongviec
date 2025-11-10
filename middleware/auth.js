const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Auth middleware: only concerns itself with authentication.
// Returns:
// 401 - Missing token, invalid token, expired token, or user not found.
// Leaves 403 exclusively for authorization (RBAC) layer.
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Thiếu token' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY || 'secret123'); // Use same secret as auth controller
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token hết hạn' });
            }
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Unhandled auth middleware error:', error);
        return res.status(500).json({ message: 'Lỗi xác thực' });
    }
};

module.exports = authenticateToken;