const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret key cho JWT
const JWT_SECRET = 'secret123'; // 👉 Thực tế nên để trong .env

// Đăng ký
exports.register = async (req, res) => {
    try {
        const { manv, password, chucvu, hoten, sdt } = req.body;

        // Kiểm tra manv có tồn tại chưa
        const exist = await User.findOne({ where: { manv } });
        if (exist) return res.status(400).json({ message: 'Mã nhân viên đã tồn tại' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            manv,
            password: hashedPassword,
            chucvu,
            hoten,
            sdt
        });

        return res.json({ message: 'Đăng ký thành công', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { manv, password } = req.body;

        const user = await User.findOne({ where: { manv } });
        if (!user) return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });

        // Tạo token
        const token = jwt.sign(
            { id: user.id, manv: user.manv },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Lưu token vào DB
        await user.update({ token });

        return res.json({
            message: 'Đăng nhập thành công',
            token,
            manv: user.manv,
            hoten: user.hoten
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

