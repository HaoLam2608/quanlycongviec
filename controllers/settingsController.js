const fs = require('fs').promises;
const path = require('path');
const emailService = require('../services/emailService');

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
