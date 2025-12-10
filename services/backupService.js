const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * ========================================
 * DATABASE BACKUP SERVICE
 * ========================================
 * Tự động backup database MySQL theo lịch
 * Sử dụng mysqldump
 * ========================================
 */

class BackupService {
    constructor() {
        this.cronJob = null;
        this.settingsPath = path.join(__dirname, '../config/systemSettings.json');
        this.dbConfigPath = path.join(__dirname, '../config/config.json');
        this.backupDir = path.join(__dirname, '../backups');
        this.isRunning = false;

        // Đảm bảo thư mục backup tồn tại
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Đọc cấu hình database từ config.json theo môi trường
     */
    getDatabaseConfig() {
        try {
            const env = process.env.NODE_ENV || 'development';
            const configData = fs.readFileSync(this.dbConfigPath, 'utf8');
            const config = JSON.parse(configData);
            const dbConfig = config[env];
            
            return {
                host: dbConfig.host || 'localhost',
                port: dbConfig.port || 3306,
                user: dbConfig.username || 'root',
                password: dbConfig.password || '',
                name: dbConfig.database || 'qlcv'
            };
        } catch (error) {
            console.error('⚠️ Error reading database config, using defaults:', error.message);
            // Fallback to environment variables or defaults
            return {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                name: process.env.DB_NAME || 'qlcv'
            };
        }
    }

    /**
     * Đọc settings từ file
     */
    getSettings() {
        try {
            const data = fs.readFileSync(this.settingsPath, 'utf8');
            const settings = JSON.parse(data);
            const dbConfig = this.getDatabaseConfig();
            
            return settings.backup || {
                enabled: true,
                schedule: '0 2 * * *', // 2:00 AM mỗi ngày
                retentionDays: 7, // Giữ backup trong 7 ngày
                database: dbConfig
            };
        } catch (error) {
            console.error('❌ Error reading settings:', error);
            const dbConfig = this.getDatabaseConfig();
            return {
                enabled: true,
                schedule: '0 2 * * *',
                retentionDays: 7,
                database: dbConfig
            };
        }
    }

    /**
     * Cập nhật settings
     */
    updateSettings(newSettings) {
        try {
            const data = fs.readFileSync(this.settingsPath, 'utf8');
            const settings = JSON.parse(data);
            settings.backup = {
                ...settings.backup,
                ...newSettings
            };
            fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
            
            // Restart cron job với settings mới
            this.stop();
            this.start();
            
            return settings.backup;
        } catch (error) {
            console.error('❌ Error updating settings:', error);
            throw error;
        }
    }

    /**
     * Tạo tên file backup
     */
    getBackupFileName() {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, '')
            .replace('T', '_');
        return `backup_${timestamp}.sql`;
    }

    /**
     * Thực hiện backup database
     */
    async performBackup() {
        const settings = this.getSettings();
        
        if (!settings.enabled) {
            console.log('⏸️ Database backup is disabled');
            return;
        }

        console.log('💾 Starting database backup...');

        try {
            const fileName = this.getBackupFileName();
            const filePath = path.join(this.backupDir, fileName);
            
            const { host, port, user, password, name } = settings.database;

            // Sử dụng mysqldump để backup
            // Đường dẫn mysqldump cho XAMPP (Windows)
            const mysqldumpPath = process.platform === 'win32' 
                ? 'C:\\xampp\\mysql\\bin\\mysqldump.exe'
                : 'mysqldump'; // Linux/Mac dùng PATH
            
            let command;
            
            if (password) {
                command = `"${mysqldumpPath}" -h ${host} -P ${port} -u ${user} -p${password} ${name} > "${filePath}"`;
            } else {
                command = `"${mysqldumpPath}" -h ${host} -P ${port} -u ${user} ${name} > "${filePath}"`;
            }

            await execPromise(command);

            const stats = fs.statSync(filePath);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log(`✅ Backup completed successfully`);
            console.log(`📁 File: ${fileName}`);
            console.log(`📊 Size: ${fileSizeMB} MB`);

            // Xóa các backup cũ
            await this.cleanOldBackups(settings.retentionDays);

            return {
                success: true,
                fileName,
                filePath,
                size: fileSizeMB
            };
        } catch (error) {
            console.error('❌ Error performing backup:', error);
            throw error;
        }
    }

    /**
     * Xóa các backup cũ hơn retentionDays
     */
    async cleanOldBackups(retentionDays) {
        try {
            const files = fs.readdirSync(this.backupDir);
            const now = Date.now();
            const maxAge = retentionDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

            let deletedCount = 0;

            for (const file of files) {
                if (!file.startsWith('backup_') || !file.endsWith('.sql')) {
                    continue;
                }

                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtime.getTime();

                if (age > maxAge) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`🗑️ Deleted old backup: ${file}`);
                }
            }

            if (deletedCount > 0) {
                console.log(`🧹 Cleaned up ${deletedCount} old backup(s)`);
            }
        } catch (error) {
            console.error('❌ Error cleaning old backups:', error);
        }
    }

    /**
     * Lấy danh sách backups
     */
    getBackupList() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = [];

            for (const file of files) {
                if (!file.startsWith('backup_') || !file.endsWith('.sql')) {
                    continue;
                }

                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);

                backups.push({
                    fileName: file,
                    filePath,
                    size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                    createdAt: stats.mtime,
                    age: this.getFileAge(stats.mtime)
                });
            }

            // Sắp xếp theo thời gian tạo (mới nhất trước)
            backups.sort((a, b) => b.createdAt - a.createdAt);

            return backups;
        } catch (error) {
            console.error('❌ Error getting backup list:', error);
            return [];
        }
    }

    /**
     * Tính tuổi của file
     */
    getFileAge(mtime) {
        const now = Date.now();
        const age = now - mtime.getTime();
        const days = Math.floor(age / (24 * 60 * 60 * 1000));
        const hours = Math.floor((age % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

        if (days > 0) {
            return `${days} ngày trước`;
        } else if (hours > 0) {
            return `${hours} giờ trước`;
        } else {
            return 'Vừa xong';
        }
    }

    /**
     * Restore database từ backup file
     */
    async restoreBackup(fileName) {
        const settings = this.getSettings();
        const filePath = path.join(this.backupDir, fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error('Backup file not found');
        }

        console.log(`🔄 Restoring database from ${fileName}...`);

        try {
            const { host, port, user, password, name } = settings.database;

            // Đường dẫn mysql cho XAMPP (Windows)
            const mysqlPath = process.platform === 'win32' 
                ? 'C:\\xampp\\mysql\\bin\\mysql.exe'
                : 'mysql'; // Linux/Mac dùng PATH
            
            let command;
            
            if (password) {
                command = `"${mysqlPath}" -h ${host} -P ${port} -u ${user} -p${password} ${name} < "${filePath}"`;
            } else {
                command = `"${mysqlPath}" -h ${host} -P ${port} -u ${user} ${name} < "${filePath}"`;
            }

            await execPromise(command);

            console.log(`✅ Database restored successfully from ${fileName}`);

            return {
                success: true,
                fileName
            };
        } catch (error) {
            console.error('❌ Error restoring backup:', error);
            throw error;
        }
    }

    /**
     * Khởi động cron job
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Backup service is already running');
            return;
        }

        const settings = this.getSettings();

        if (!settings.enabled) {
            console.log('⏸️ Database backup is disabled');
            return;
        }

        // Validate cron expression
        if (!cron.validate(settings.schedule)) {
            console.error('❌ Invalid cron schedule:', settings.schedule);
            return;
        }

        this.cronJob = cron.schedule(settings.schedule, async () => {
            await this.performBackup();
        });

        this.isRunning = true;
        console.log(`✅ Database backup service started`);
        console.log(`⏰ Schedule: ${settings.schedule}`);
        console.log(`📦 Retention: ${settings.retentionDays} days`);
    }

    /**
     * Dừng cron job
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
        }
        this.isRunning = false;
        console.log('⏹️ Database backup service stopped');
    }
}

// Singleton instance
const backupService = new BackupService();

module.exports = backupService;
