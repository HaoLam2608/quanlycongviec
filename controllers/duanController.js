const { DuAn, User } = require('../models');

// Thêm dự án
exports.createDuAn = async (req, res) => {
    try {
        const { tenduan, mota, ngaybatdau, ngayketthuc, userId } = req.body;
        const duan = await DuAn.create({ tenduan, mota, ngaybatdau, ngayketthuc, userId });
        res.json({ message: "Tạo dự án thành công", duan });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách dự án + người đảm nhận
exports.getAllDuAn = async (req, res) => {
    try {
        const duans = await DuAn.findAll({
            include: [{ model: User, as: 'nguoiDamNhan', attributes: ['id', 'manv', 'hoten', 'chucvu'] }]
        });
        res.json(duans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
