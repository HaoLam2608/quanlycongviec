const backupService = require('../services/backupService');

// Get backup settings
exports.getBackupSettings = async (req, res) => {
    try {
        const settings = backupService.getSettings();
        
        // Không trả về password trong response
        const safeSettings = {
            ...settings,
            database: {
                ...settings.database,
                password: settings.database.password ? '********' : ''
            }
        };

        res.json({
            success: true,
            data: safeSettings
        });
    } catch (error) {
        console.error('Error getting backup settings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cấu hình backup',
            error: error.message
        });
    }
};

// Update backup settings
exports.updateBackupSettings = async (req, res) => {
    try {
        const { enabled, schedule, retentionDays, database } = req.body;

        const updatedSettings = backupService.updateSettings({
            enabled,
            schedule,
            retentionDays,
            database
        });

        res.json({
            success: true,
            message: 'Cập nhật cấu hình backup thành công',
            data: updatedSettings
        });
    } catch (error) {
        console.error('Error updating backup settings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cấu hình backup',
            error: error.message
        });
    }
};

// Trigger manual backup
exports.triggerBackup = async (req, res) => {
    try {
        console.log('🎯 Manual backup triggered by admin:', req.user.id);
        
        const result = await backupService.performBackup();

        res.json({
            success: true,
            message: 'Backup thành công',
            data: result
        });
    } catch (error) {
        console.error('Error triggering backup:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thực hiện backup',
            error: error.message
        });
    }
};

// Get list of backups
exports.getBackupList = async (req, res) => {
    try {
        const backups = backupService.getBackupList();

        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        console.error('Error getting backup list:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách backup',
            error: error.message
        });
    }
};

// Download backup file
exports.downloadBackup = async (req, res) => {
    try {
        const { fileName } = req.params;
        const backupDir = backupService.backupDir;
        const filePath = require('path').join(backupDir, fileName);

        // Kiểm tra file tồn tại
        if (!require('fs').existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File backup không tồn tại'
            });
        }

        // Kiểm tra file có phải là backup file không
        if (!fileName.startsWith('backup_') || !fileName.endsWith('.sql')) {
            return res.status(400).json({
                success: false,
                message: 'File không hợp lệ'
            });
        }

        res.download(filePath, fileName);
    } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải backup',
            error: error.message
        });
    }
};

// Delete backup file
exports.deleteBackup = async (req, res) => {
    try {
        const { fileName } = req.params;
        const backupDir = backupService.backupDir;
        const filePath = require('path').join(backupDir, fileName);

        // Kiểm tra file tồn tại
        if (!require('fs').existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File backup không tồn tại'
            });
        }

        // Kiểm tra file có phải là backup file không
        if (!fileName.startsWith('backup_') || !fileName.endsWith('.sql')) {
            return res.status(400).json({
                success: false,
                message: 'File không hợp lệ'
            });
        }

        require('fs').unlinkSync(filePath);

        res.json({
            success: true,
            message: 'Xóa backup thành công'
        });
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa backup',
            error: error.message
        });
    }
};

// Restore database from backup
exports.restoreBackup = async (req, res) => {
    try {
        const { fileName } = req.body;

        if (!fileName) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file backup'
            });
        }

        console.log('🔄 Database restore triggered by admin:', req.user.id, 'File:', fileName);

        const result = await backupService.restoreBackup(fileName);

        res.json({
            success: true,
            message: 'Khôi phục database thành công',
            data: result
        });
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi khôi phục database',
            error: error.message
        });
    }
};
