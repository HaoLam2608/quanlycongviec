const { User, Role, Permission } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret key cho JWT
const JWT_SECRET = process.env.SECRET_KEY;
const REFRESH_SECRET = "refresh123"; // nên để trong .env

// Tạo token
function generateAccessToken(user) {
    return jwt.sign({ id: user.id, manv: user.manv }, JWT_SECRET, { expiresIn: "15m" });
}
function generateRefreshToken(user) {
    return jwt.sign({ id: user.id, manv: user.manv }, REFRESH_SECRET, { expiresIn: "7d" });
}
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

        const user = await User.findOne({
            where: { manv }, include: [{
                model: Role,
                as: 'role',
                include: [{
                    model: Permission,
                    as: 'permissions'
                }]
            }]
        });

        if (!user) return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Lưu refresh token vào DB hoặc bộ nhớ (tùy bạn)
        await user.update({ token: refreshToken });

        return res.json({
            message: "Đăng nhập thành công",
            token: accessToken,
            refreshToken,
            manv: user.manv,
            hoten: user.hoten,

            chucvu: user.chucvu,
            role: user.role?.name || 'employee',
            permissions: user.role?.permissions || []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Thiếu refresh token" });

    try {
        // Xác minh refresh token
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

        const user = await User.findByPk(decoded.id);
        if (!user || user.token !== refreshToken) {
            return res.status(403).json({ message: "Refresh token không hợp lệ" });
        }

        // Cấp access token mới
        const newAccessToken = generateAccessToken(user);

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: "Refresh token hết hạn hoặc sai" });
    }
};
exports.logout = async (req, res) => {
    try {
        // Lấy user từ middleware auth (hoặc từ token trong header)
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Chưa đăng nhập" });
        }

        // Xoá refresh token trong DB
        await user.update({ token: null });

        return res.json({ message: "Đăng xuất thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { manv, password, hoten, chucvu, sdt, roleId } = req.body;

        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = await User.create({
            manv,
            password: hashedPassword,
            hoten,
            chucvu,
            sdt,
            roleId
        });

        const userWithRole = await User.findByPk(user.id, {
            include: [{ model: Role, as: 'role' }]
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: userWithRole.id,
                manv: userWithRole.manv,
                hoten: userWithRole.hoten,
                chucvu: userWithRole.chucvu,
                sdt: userWithRole.sdt,
                role: userWithRole.role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};