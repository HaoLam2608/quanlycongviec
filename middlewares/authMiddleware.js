const jwt = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = process.env.SECRET_KEY;

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ message: "Thiếu token" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(401).json({ message: "User không tồn tại" });

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

module.exports = authMiddleware;
