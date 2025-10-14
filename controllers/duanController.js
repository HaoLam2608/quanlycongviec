const { DuAn, User } = require('../models');

// Thêm dự án
exports.createDuAn = async (req, res) => {
    try {
        const { tenduan, mota, ngaybatdau, ngayketthuc, status } = req.body;
        const userId = req.user.id; // lấy từ token

        const duan = await DuAn.create({
            tenduan,
            mota,
            ngaybatdau,
            ngayketthuc,
            status: status || "chua_bat_dau",
            userId,
        });

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

// Lấy chi tiết 1 dự án theo id
exports.getDuAnById = async (req, res) => {
    try {
        const { id } = req.params;
        const duan = await DuAn.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "nguoiDamNhan",
                    attributes: ["id", "manv", "hoten", "chucvu"]
                }
            ]
        });

        if (!duan) {
            return res.status(404).json({ message: "Không tìm thấy dự án" });
        }

        res.json(duan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Sửa dự án
exports.updateDuAn = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenduan, mota, ngaybatdau, ngayketthuc, status, userId } = req.body;

        const duan = await DuAn.findByPk(id);
        if (!duan) return res.status(404).json({ message: "Không tìm thấy dự án" });

        await duan.update({ tenduan, mota, ngaybatdau, ngayketthuc, status, userId });


        // Nếu dự án chuyển sang trạng thái hoàn thành hoặc đã đóng, cập nhật group_projects
        const { GroupProject } = require('../models');
        if (status === 'da_hoan_thanh' || status === 'da_dong') {
            await GroupProject.update(
                { status: 'completed' },
                { where: { projectId: duan.id, status: 'active' } }
            );
        } else {
            // Nếu chuyển ngược lại trạng thái khác, cho phép nhóm lại active với dự án này nếu chưa vượt quá 2 dự án
            // (Chỉ thực hiện nếu trước đó đã completed)
            const groupProjects = await GroupProject.findAll({ where: { projectId: duan.id, status: 'completed' } });
            for (const gp of groupProjects) {
                // Đếm số dự án active hiện tại của nhóm này
                const activeCount = await GroupProject.count({ where: { groupId: gp.groupId, status: 'active' } });
                if (activeCount < 2) {
                    await gp.update({ status: 'active' });
                }
            }
        }

        res.json({ message: "Cập nhật dự án thành công", duan });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xoá dự án
exports.deleteDuAn = async (req, res) => {
    try {
        const { id } = req.params;
        const duan = await DuAn.findByPk(id);
        if (!duan) return res.status(404).json({ message: "Không tìm thấy dự án" });

        await duan.destroy();
        res.json({ message: "Xoá dự án thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};