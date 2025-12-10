const fs = require('fs').promises;
const path = require('path');
const emailService = require('../services/emailService');
const deadlineReminderService = require('../services/deadlineReminderService');

const SETTINGS_FILE = path.join(__dirname, '..', 'config', 'systemSettings.json');

// Helper: read settings
const readSettings = async () => {
    try {
        const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading settings file:', err);
        return {};
    }
};

// Helper: write settings
const writeSettings = async (obj) => {
    try {
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(obj, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing settings file:', err);
        throw err;
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await readSettings();
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ message: 'Không thể đọc cài đặt hệ thống', error: err.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const incoming = req.body || {};
        const current = await readSettings();
        const updated = { ...current, ...incoming };

        await writeSettings(updated);
        res.json({ message: 'Cập nhật cài đặt thành công', settings: updated });
    } catch (err) {
        res.status(500).json({ message: 'Không thể lưu cài đặt', error: err.message });
    }
};

// trigger a test notification (email/system) — here we simulate and log
exports.sendTestNotification = async (req, res) => {
    try {
        const { type = 'system', to } = req.body || {};
        const settings = await readSettings();

        // Simulate: if email notification and to provided, log that we'd send email
        if (type === 'email') {
            if (!to) return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email để test' });
            console.log(`Sending test EMAIL to ${to} using settings:`, settings.email);

            try {
                await emailService.sendTestEmail(to);
                return res.json({ message: `Test email đã được gửi tới ${to}` });
            } catch (emailError) {
                console.error('Error sending test email:', emailError);
                return res.status(500).json({ message: 'Lỗi khi gửi test email', error: emailError.message });
            }
        }

        // system notification
        console.log('Simulating system notification (test) — settings:', settings);
        return res.json({ message: 'Test thông báo hệ thống đã chạy (xem logs server)' });
    } catch (err) {
        console.error('Error in sendTestNotification:', err);
        res.status(500).json({ message: 'Lỗi khi gửi thử thông báo', error: err.message });
    }
};

// Get deadline reminder settings and status
exports.getDeadlineSettings = async (req, res) => {
    try {
        const settings = deadlineReminderService.getSettings();
        const status = deadlineReminderService.getStatus();
        res.json({ settings, status });
    } catch (err) {
        console.error('Error getting deadline settings:', err);
        res.status(500).json({ message: 'Lỗi khi lấy cài đặt nhắc deadline', error: err.message });
    }
};

// Update deadline reminder settings
exports.updateDeadlineSettings = async (req, res) => {
    try {
        const { enabled, reminderTime, reminderDays, notifyAssignee, notifyManager } = req.body;
        
        const newSettings = {};
        if (typeof enabled !== 'undefined') newSettings.enabled = enabled;
        if (reminderTime) newSettings.reminderTime = reminderTime;
        if (reminderDays) newSettings.reminderDays = reminderDays;
        if (typeof notifyAssignee !== 'undefined') newSettings.notifyAssignee = notifyAssignee;
        if (typeof notifyManager !== 'undefined') newSettings.notifyManager = notifyManager;

        const updated = deadlineReminderService.updateSettings(newSettings);
        res.json({ message: 'Cập nhật cài đặt nhắc deadline thành công', settings: updated });
    } catch (err) {
        console.error('Error updating deadline settings:', err);
        res.status(500).json({ message: 'Lỗi khi cập nhật cài đặt nhắc deadline', error: err.message });
    }
};

// Manually trigger deadline reminder check
exports.runDeadlineCheck = async (req, res) => {
    try {
        const result = await deadlineReminderService.runNow();
        res.json({ 
            message: 'Đã chạy kiểm tra deadline thành công', 
            notificationsSent: result 
        });
    } catch (err) {
        console.error('Error running deadline check:', err);
        res.status(500).json({ message: 'Lỗi khi chạy kiểm tra deadline', error: err.message });
    }
};
