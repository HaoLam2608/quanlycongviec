const { Report, DuAn, User, Group, sequelize } = require('../models');
const { Op } = require('sequelize');

// Tạo báo cáo mới
exports.createReport = async (req, res) => {
    try {
        const { duanId, groupId, title, content, reportType, reportDate, statistics, attachments } = req.body;
        const createdBy = req.user.id; // Từ middleware auth

        // Validate dự án tồn tại
        const duan = await DuAn.findByPk(duanId);
        if (!duan) {
            return res.status(404).json({ message: 'Không tìm thấy dự án' });
        }

        // Validate nhóm nếu có
        if (groupId) {
            const group = await Group.findByPk(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Không tìm thấy nhóm' });
            }
        }

        const report = await Report.create({
            duanId,
            groupId,
            title,
            content,
            reportType: reportType || 'tien_do',
            status: 'draft',
            reportDate: reportDate || new Date(),
            createdBy,
            statistics: statistics || null,
            attachments: attachments || null
        });

        const fullReport = await Report.findByPk(report.id, {
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] },
                { model: User, as: 'creator', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] }
            ]
        });

        res.status(201).json({
            message: 'Tạo báo cáo thành công',
            report: fullReport
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách báo cáo theo dự án
exports.getReportsByDuAn = async (req, res) => {
    try {
        const { duanId } = req.params;
        const { status, reportType, groupId, startDate, endDate, search } = req.query;

        const whereClause = { duanId };

        if (status) whereClause.status = status;
        if (reportType) whereClause.reportType = reportType;
        if (groupId) whereClause.groupId = groupId;

        if (startDate || endDate) {
            whereClause.reportDate = {};
            if (startDate) whereClause.reportDate[Op.gte] = new Date(startDate);
            if (endDate) whereClause.reportDate[Op.lte] = new Date(endDate);
        }

        // Thêm tìm kiếm
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu']
                },
                { model: Group, as: 'group', attributes: ['id', 'name'] },
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'],
                    required: false
                }
            ],
            order: [['reportDate', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json({ reports, total: reports.length });
    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy tất cả báo cáo (cho admin)
exports.getAllReports = async (req, res) => {
    try {
        const { status, reportType, duanId, startDate, endDate } = req.query;

        const whereClause = {};
        if (status) whereClause.status = status;
        if (reportType) whereClause.reportType = reportType;
        if (duanId) whereClause.duanId = duanId;

        if (startDate || endDate) {
            whereClause.reportDate = {};
            if (startDate) whereClause.reportDate[Op.gte] = new Date(startDate);
            if (endDate) whereClause.reportDate[Op.lte] = new Date(endDate);
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] },
                { model: User, as: 'creator', attributes: ['id', 'manv', 'hoten'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] },
                { model: User, as: 'reviewer', attributes: ['id', 'manv', 'hoten'] }
            ],
            order: [['reportDate', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json({ reports, total: reports.length });
    } catch (error) {
        console.error('Error getting all reports:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy chi tiết một báo cáo
exports.getReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id, {
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan', 'mota'] },
                { model: User, as: 'creator', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] },
                { model: User, as: 'reviewer', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] }
            ]
        });

        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        res.json({ report });
    } catch (error) {
        console.error('Error getting report:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Cập nhật báo cáo
exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, reportType, statistics, attachments, reportDate } = req.body;

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        // Chỉ người tạo mới có thể sửa (hoặc admin)
        if (report.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền sửa báo cáo này' });
        }

        await report.update({
            title: title || report.title,
            content: content || report.content,
            reportType: reportType || report.reportType,
            statistics: statistics !== undefined ? statistics : report.statistics,
            attachments: attachments !== undefined ? attachments : report.attachments,
            reportDate: reportDate || report.reportDate
        });

        const updated = await Report.findByPk(id, {
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] },
                { model: User, as: 'creator', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] },
                { model: User, as: 'reviewer', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'], required: false }
            ]
        });

        res.json({ message: 'Cập nhật báo cáo thành công', report: updated });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Gửi báo cáo (chuyển từ draft sang submitted)
exports.submitReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        if (report.status !== 'draft') {
            return res.status(400).json({ message: 'Chỉ có thể gửi báo cáo ở trạng thái nháp' });
        }

        await report.update({ status: 'submitted' });

        const fullReport = await Report.findByPk(id, {
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] },
                { model: User, as: 'creator', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] }
            ]
        });

        res.json({ message: 'Gửi báo cáo thành công', report: fullReport });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Xem xét báo cáo (admin/manager)
exports.reviewReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNote, status } = req.body;
        const reviewedBy = req.user.id;

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        if (!['reviewed', 'approved'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        await report.update({
            status,
            reviewedBy,
            reviewedAt: new Date(),
            reviewNote: reviewNote || null
        });

        const updated = await Report.findByPk(id, {
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] },
                { model: User, as: 'creator', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: User, as: 'reviewer', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] }
            ]
        });

        res.json({ message: 'Xem xét báo cáo thành công', report: updated });
    } catch (error) {
        console.error('Error reviewing report:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Xóa báo cáo
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        // Chỉ người tạo hoặc admin mới có thể xóa
        if (report.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền xóa báo cáo này' });
        }

        await report.destroy();
        res.json({ message: 'Xóa báo cáo thành công' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Thống kê báo cáo theo dự án
exports.getReportStatistics = async (req, res) => {
    try {
        const { duanId } = req.params;

        // Tổng số báo cáo
        const totalReports = await Report.count({ where: { duanId } });

        // Thống kê theo status
        const statusStats = await Report.findAll({
            where: { duanId },
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        // Thống kê theo reportType
        const typeStats = await Report.findAll({
            where: { duanId },
            attributes: [
                'reportType',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['reportType'],
            raw: true
        });

        // Chuyển đổi thành object dễ sử dụng hơn
        const statusCounts = {
            draft: 0,
            submitted: 0,
            reviewed: 0,
            approved: 0
        };

        statusStats.forEach(stat => {
            statusCounts[stat.status] = parseInt(stat.count);
        });

        const typeCounts = {};
        typeStats.forEach(stat => {
            typeCounts[stat.reportType] = parseInt(stat.count);
        });

        res.json({
            duanId,
            totalReports,
            byStatus: statusCounts,
            byType: typeCounts,
            draft: statusCounts.draft,
            submitted: statusCounts.submitted,
            reviewed: statusCounts.reviewed,
            approved: statusCounts.approved,
            statistics: statusStats,
            typeStatistics: typeStats
        });
    } catch (error) {
        console.error('Error getting report statistics:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Upload file đính kèm
exports.uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file nào được upload' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: `/uploads/reports/${req.file.filename}`
        };

        res.json({
            message: 'Upload file thành công',
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading attachment:', error);
        res.status(500).json({ message: 'Lỗi khi upload file', error: error.message });
    }
};

// Tải file đính kèm
exports.downloadAttachment = async (req, res) => {
    try {
        const { filename } = req.params;
        const path = require('path');
        const filePath = path.join(__dirname, '../uploads/reports', filename);
        const fs = require('fs');

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File không tồn tại' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        res.status(500).json({ message: 'Lỗi khi tải file', error: error.message });
    }
};

// Xóa file đính kèm
exports.deleteAttachment = async (req, res) => {
    try {
        const { filename } = req.params;
        const path = require('path');
        const filePath = path.join(__dirname, '../uploads/reports', filename);
        const fs = require('fs');

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ message: 'Xóa file thành công' });
        } else {
            res.status(404).json({ message: 'File không tồn tại' });
        }
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ message: 'Lỗi khi xóa file', error: error.message });
    }
};

// Xuất báo cáo ra PDF
exports.exportReportToPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');

        const report = await Report.findByPk(id, {
            include: [
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan', 'mota'] },
                { model: User, as: 'creator', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: User, as: 'reviewer', attributes: ['id', 'manv', 'hoten', 'sdt', 'chucvu'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] }
            ]
        });

        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        // Tạo PDF document với font hỗ trợ Unicode
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bao-cao-${report.id}-${Date.now()}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Sử dụng font hỗ trợ tiếng Việt
        try {
            // Thử các font theo thứ tự ưu tiên (ưu tiên font local để đảm bảo hiển thị tiếng Việt)
            const fontPaths = [
                path.join(__dirname, '../fonts/DejaVuSans.ttf'), // Font tự download (ưu tiên)
                'C:/Windows/Fonts/times.ttf',      // Times New Roman
                'C:/Windows/Fonts/arial.ttf',       // Arial
                'C:/Windows/Fonts/calibri.ttf'     // Calibri
            ];

            let fontLoaded = false;
            for (const fontPath of fontPaths) {
                if (fs.existsSync(fontPath)) {
                    try {
                        doc.font(fontPath);
                        fontLoaded = true;
                        console.log('Using font:', fontPath);
                        break;
                    } catch (fontError) {
                        console.warn('Failed to load font:', fontPath, fontError.message);
                        // Continue to next font
                    }
                }
            }

            if (!fontLoaded) {
                console.warn('No Unicode font found, text may not display correctly');
                doc.font('Helvetica');
            }
        } catch (error) {
            console.error('Error loading font:', error);
            doc.font('Helvetica');
        }

        // Header với border
        doc.rect(50, 50, doc.page.width - 100, 60).stroke();
        doc.fontSize(22).text('BÁO CÁO DỰ ÁN', 50, 70, {
            align: 'center',
            width: doc.page.width - 100
        });
        doc.moveDown(2);

        // Thông tin dự án - Box
        doc.fontSize(11);
        const startY = doc.y;
        doc.rect(50, startY, doc.page.width - 100, 120).stroke();
        doc.text(`Dự án: ${report.duan?.tenduan || 'N/A'}`, 60, startY + 10);
        doc.text(`Tiêu đề: ${report.title}`, 60, startY + 30);
        doc.text(`Loại báo cáo: ${getReportTypeLabel(report.reportType)}`, 60, startY + 50);
        doc.text(`Trạng thái: ${getStatusLabel(report.status)}`, 60, startY + 70);
        doc.text(`Ngày báo cáo: ${new Date(report.reportDate).toLocaleDateString('vi-VN')}`, 60, startY + 90);
        doc.y = startY + 130;

        // Người tạo
        doc.fontSize(11);
        doc.text(`Người tạo: ${report.creator?.hoten || 'N/A'} (${report.creator?.manv || 'N/A'})`, 50);
        if (report.creator?.chucvu) {
            doc.text(`Chức vụ: ${report.creator.chucvu}`, 50);
        }
        doc.moveDown();

        // Nhóm (nếu có)
        if (report.group) {
            doc.text(`Nhóm: ${report.group.name}`, 50);
            doc.moveDown();
        }

        // Nội dung
        doc.fontSize(13).text('NỘI DUNG:', 50, undefined, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(report.content || 'Không có nội dung', 50, undefined, {
            align: 'justify',
            width: doc.page.width - 100
        });
        doc.moveDown();

        // Thông tin review (nếu có)
        if (report.reviewedBy && report.reviewer) {
            doc.fontSize(13).text('THÔNG TIN DUYỆT:', 50, undefined, { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11);
            doc.text(`Người duyệt: ${report.reviewer.hoten} (${report.reviewer.manv})`, 50);
            if (report.reviewedAt) {
                doc.text(`Ngày duyệt: ${new Date(report.reviewedAt).toLocaleDateString('vi-VN')}`, 50);
            }
            if (report.reviewNote) {
                doc.text(`Ghi chú: ${report.reviewNote}`, 50);
            }
            doc.moveDown();
        }

        // File đính kèm
        if (report.attachments && report.attachments.length > 0) {
            doc.fontSize(13).text('FILE ĐÍNH KÈM:', 50, undefined, { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11);
            report.attachments.forEach((file, index) => {
                doc.text(`${index + 1}. ${file.originalname} (${formatFileSize(file.size)})`, 60);
            });
        }

        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(9).text(
                `Xuất lúc: ${new Date().toLocaleString('vi-VN')} - Trang ${i + 1} / ${pages.count}`,
                50,
                doc.page.height - 50,
                { align: 'center', width: doc.page.width - 100 }
            );
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error exporting report to PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Lỗi khi xuất PDF', error: error.message });
        }
    }
};

// Helper functions
function getReportTypeLabel(type) {
    const labels = {
        'tien_do': 'Tiến độ',
        'van_de': 'Vấn đề',
        'hoan_thanh': 'Hoàn thành',
        'tong_ket': 'Tổng kết',
        'khac': 'Khác'
    };
    return labels[type] || type;
}

function getStatusLabel(status) {
    const labels = {
        'draft': 'Nháp',
        'submitted': 'Đã gửi',
        'reviewed': 'Đã xem',
        'approved': 'Đã duyệt'
    };
    return labels[status] || status;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
