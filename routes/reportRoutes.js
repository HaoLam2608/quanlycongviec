const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/auth');
const upload = require('../config/multerConfig');

// Tạo báo cáo mới
router.post('/', authenticate, reportController.createReport);

// Lấy tất cả báo cáo (admin)
router.get('/', authenticate, reportController.getAllReports);

// Lấy báo cáo theo dự án
router.get('/duan/:duanId', authenticate, reportController.getReportsByDuAn);

// Thống kê báo cáo theo dự án
router.get('/duan/:duanId/statistics', authenticate, reportController.getReportStatistics);

// Xuất báo cáo ra PDF
router.get('/:id/export/pdf', authenticate, reportController.exportReportToPdf);

// Lấy chi tiết một báo cáo
router.get('/:id', authenticate, reportController.getReport);

// Cập nhật báo cáo
router.put('/:id', authenticate, reportController.updateReport);

// Gửi báo cáo (draft -> submitted)
router.patch('/:id/submit', authenticate, reportController.submitReport);

// Xem xét báo cáo (admin/manager)
router.patch('/:id/review', authenticate, reportController.reviewReport);

// Upload file đính kèm
router.post('/attachments/upload', authenticate, upload.single('file'), reportController.uploadAttachment);

// Tải file đính kèm
router.get('/attachments/:filename', authenticate, reportController.downloadAttachment);

// Xóa file đính kèm
router.delete('/attachments/:filename', authenticate, reportController.deleteAttachment);

// Xóa báo cáo
router.delete('/:id', authenticate, reportController.deleteReport);

module.exports = router;
