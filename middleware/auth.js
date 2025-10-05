const jwt = require('jsonwebtoken');
const { User } = require('../models');


const authenticateToken = async (req, res, next) => {
    try {
        
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.sendStatus(401);
    
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
        const user = await User.findByPk(decoded.id);
        if (!user ) {
            return res.status(401).json({ message: 'Người dùng không tồn tại' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in auth middleware:', error);
        res.status(403).json({ message: 'Token không hợp lệ' });
    }
}

module.exports = authenticateToken;