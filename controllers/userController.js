const { User } = require('../models');

// Lấy tất cả user
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'manv', 'hoten', 'chucvu', 'sdt'] // không trả password
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
