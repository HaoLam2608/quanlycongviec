const cron = require('node-cron');
const { Task, Subtask, User, DuAn, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

/**
 * ========================================
 * DEADLINE REMINDER SERVICE
 * ========================================
 * Tự động nhắc deadline cho tasks sắp đến hạn
 * Sử dụng node-cron để schedule jobs
 * ========================================
 */

class DeadlineReminderService {
    constructor() {
        this.cronJob = null;
        this.settingsPath = path.join(__dirname, '../config/systemSettings.json');
        this.isRunning = false;
    }

    /**
     * Đọc settings từ file
     */
    getSettings() {
        try {
            const data = fs.readFileSync(this.settingsPath, 'utf8');
            const settings = JSON.parse(data);
            return settings.deadlineReminder || {
                enabled: true,
                reminderTime: '08:00',
                reminderDays: [1, 3, 7],
                notifyAssignee: true,
                notifyManager: true
            };
        } catch (error) {
            console.error('❌ Error reading settings:', error);
            return {
                enabled: true,
                reminderTime: '08:00',
                reminderDays: [1, 3, 7],
                notifyAssignee: true,
                notifyManager: true
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
            settings.deadlineReminder = {
                ...settings.deadlineReminder,
                ...newSettings
            };
            fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
            
            // Restart cron job với settings mới
            this.stop();
            this.start();
            
            return settings.deadlineReminder;
        } catch (error) {
            console.error('❌ Error updating settings:', error);
            throw error;
        }
    }

    /**
     * Tìm tasks sắp đến hạn (gửi cho teamleader)
     */
    async findUpcomingDeadlines() {
        const settings = this.getSettings();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasks = [];

        for (const days of settings.reminderDays) {
            // Tính ngày cần nhắc (ví dụ: ngày mai nếu days = 1)
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + days);
            
            // Start of target day: 00:00:00
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            // End of target day: 23:59:59.999
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            console.log(`🔍 Searching for tasks with deadline on ${startOfDay.toISOString()} to ${endOfDay.toISOString()} (${days} days from now)`);

            const dayTasks = await Task.findAll({
                where: {
                    ngayKetThuc: {
                        [Op.gte]: startOfDay,
                        [Op.lte]: endOfDay
                    },
                    trangThai: {
                        [Op.ne]: 'Hoàn thành'
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'nguoiDuocGiao',
                        attributes: ['id', 'hoten', 'email']
                    },
                    {
                        model: User,
                        as: 'nguoiGiao',
                        attributes: ['id', 'hoten', 'email']
                    },
                    {
                        model: DuAn,
                        as: 'duan',
                        attributes: ['id', 'tenduan']
                    }
                ]
            });

            tasks.push(...dayTasks.map(t => ({ ...t.toJSON(), daysUntil: days, itemType: 'task' })));
        }

        return tasks;
    }

    /**
     * Tìm subtasks sắp đến hạn (gửi cho employee)
     */
    async findUpcomingSubtaskDeadlines() {
        const settings = this.getSettings();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const subtasks = [];

        for (const days of settings.reminderDays) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + days);
            
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            console.log(`🔍 Searching for subtasks with deadline on ${startOfDay.toISOString()} to ${endOfDay.toISOString()} (${days} days from now)`);

            const daySubtasks = await Subtask.findAll({
                where: {
                    ngayKetThuc: {
                        [Op.gte]: startOfDay,
                        [Op.lte]: endOfDay
                    },
                    trangThai: {
                        [Op.ne]: 'Hoàn thành'
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'nguoiThucHien',
                        attributes: ['id', 'hoten', 'email']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'hoten', 'email']
                    },
                    {
                        model: Task,
                        as: 'task',
                        attributes: ['id', 'tentask'],
                        include: [{
                            model: DuAn,
                            as: 'duan',
                            attributes: ['id', 'tenduan']
                        }]
                    }
                ]
            });

            subtasks.push(...daySubtasks.map(st => ({ ...st.toJSON(), daysUntil: days, itemType: 'subtask' })));
        }

        return subtasks;
    }

    /**
     * Gửi notifications cho tasks và subtasks sắp đến hạn
     */
    async sendDeadlineReminders() {
        const settings = this.getSettings();
        
        if (!settings.enabled) {
            console.log('⏸️ Deadline reminders are disabled');
            return;
        }

        console.log('🔔 Running deadline reminder job...');

        try {
            // Lấy cả tasks và subtasks
            const tasks = await this.findUpcomingDeadlines();
            const subtasks = await this.findUpcomingSubtaskDeadlines();
            
            const totalItems = tasks.length + subtasks.length;
            
            if (totalItems === 0) {
                console.log('✅ No upcoming deadlines found');
                return;
            }

            console.log(`📋 Found ${tasks.length} tasks and ${subtasks.length} subtasks with upcoming deadlines`);

            let notificationCount = 0;

            // Xử lý TASKS - gửi cho TEAMLEADER
            for (const task of tasks) {
                const daysText = task.daysUntil === 1 ? 'ngày mai' : `${task.daysUntil} ngày nữa`;
                const deadlineDate = new Date(task.ngayKetThuc).toLocaleDateString('vi-VN');
                
                // Tạo notification chung
                const notification = await Notification.create({
                    title: `⏰ Nhắc deadline Task: ${task.tentask}`,
                    content: `Task "${task.tentask}" sẽ đến hạn ${daysText} (${deadlineDate}).\nDự án: ${task.duan?.tenduan || 'N/A'}\nTrạng thái: ${task.trangThai}\nTiến độ: ${task.tienDo}%`,
                    type: 'deadline_reminder',
                    priority: task.daysUntil === 1 ? 'high' : 'medium',
                    status: 'published',
                    targetAudience: 'direct',
                    authorId: task.nguoiGiaoId || 1,
                    publishedAt: new Date()
                });

                console.log(`📝 Created notification ${notification.id} for task ${task.id}`);

                // Chỉ gửi cho người được giao task
                if (task.nguoiDuocGiaoId) {
                    await sequelize.models.UserNotification.create({
                        userId: task.nguoiDuocGiaoId,
                        notificationId: notification.id,
                        isRead: false,
                        meta: JSON.stringify({
                            taskId: task.id,
                            daysUntil: task.daysUntil,
                            deadline: task.ngayKetThuc,
                            itemType: 'task'
                        })
                    });
                    console.log(`✉️ Sent task reminder to assignee: ${task.nguoiDuocGiao?.hoten || task.nguoiDuocGiaoId}`);
                    notificationCount++;
                }
            }

            // Xử lý SUBTASKS - chỉ gửi cho người thực hiện
            for (const subtask of subtasks) {
                const daysText = subtask.daysUntil === 1 ? 'ngày mai' : `${subtask.daysUntil} ngày nữa`;
                const deadlineDate = new Date(subtask.ngayKetThuc).toLocaleDateString('vi-VN');
                
                // Tạo notification chung
                const notification = await Notification.create({
                    title: `⏰ Nhắc deadline Subtask: ${subtask.tenSubtask}`,
                    content: `Subtask "${subtask.tenSubtask}" sẽ đến hạn ${daysText} (${deadlineDate}).\nTask: ${subtask.task?.tentask || 'N/A'}\nDự án: ${subtask.task?.duan?.tenduan || 'N/A'}\nTrạng thái: ${subtask.trangThai}`,
                    type: 'deadline_reminder',
                    priority: subtask.daysUntil === 1 ? 'high' : 'medium',
                    status: 'published',
                    targetAudience: 'direct',
                    authorId: subtask.createdBy || 1,
                    publishedAt: new Date()
                });

                console.log(`📝 Created notification ${notification.id} for subtask ${subtask.id}`);

                // Chỉ gửi cho người thực hiện subtask
                if (subtask.nguoiThucHienId) {
                    await sequelize.models.UserNotification.create({
                        userId: subtask.nguoiThucHienId,
                        notificationId: notification.id,
                        isRead: false,
                        meta: JSON.stringify({
                            subtaskId: subtask.id,
                            taskId: subtask.taskId,
                            daysUntil: subtask.daysUntil,
                            deadline: subtask.ngayKetThuc,
                            itemType: 'subtask'
                        })
                    });
                    console.log(`✉️ Sent subtask reminder to employee: ${subtask.nguoiThucHien?.hoten || subtask.nguoiThucHienId}`);
                    notificationCount++;
                }
            }

            console.log(`✅ Sent ${notificationCount} notifications for ${totalItems} items (${tasks.length} tasks, ${subtasks.length} subtasks)`);
        } catch (error) {
            console.error('❌ Error sending deadline reminders:', error);
        }
    }

    /**
     * Khởi động cron job
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Deadline reminder service is already running');
            return;
        }

        const settings = this.getSettings();
        
        if (!settings.enabled) {
            console.log('⏸️ Deadline reminders are disabled in settings');
            return;
        }

        // Parse time (format: "HH:MM")
        const [hour, minute] = settings.reminderTime.split(':');
        
        // Cron pattern: "minute hour * * *"
        // Ví dụ: "0 8 * * *" = chạy lúc 8:00 AM mỗi ngày
        const cronPattern = `${minute} ${hour} * * *`;

        this.cronJob = cron.schedule(cronPattern, async () => {
            await this.sendDeadlineReminders();
        }, {
            timezone: 'Asia/Ho_Chi_Minh'
        });

        this.isRunning = true;
        console.log(`✅ Deadline reminder service started - Running at ${settings.reminderTime} daily`);
        console.log(`📅 Will check deadlines: ${settings.reminderDays.join(', ')} days before`);
    }

    /**
     * Dừng cron job
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            this.isRunning = false;
            console.log('⏹️ Deadline reminder service stopped');
        }
    }

    /**
     * Chạy thử ngay (manual trigger)
     */
    async runNow() {
        console.log('🚀 Manual trigger: Running deadline reminders now...');
        await this.sendDeadlineReminders();
    }

    /**
     * Lấy trạng thái hiện tại
     */
    getStatus() {
        const settings = this.getSettings();
        return {
            isRunning: this.isRunning,
            settings: settings,
            nextRun: this.cronJob ? 'Scheduled' : 'Not scheduled'
        };
    }
}

// Singleton instance
const deadlineReminderService = new DeadlineReminderService();

module.exports = deadlineReminderService;
