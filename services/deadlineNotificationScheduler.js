const cron = require('node-cron');
const { Subtask, Task, User } = require('../models');
const { Op } = require('sequelize');
const { sendPushToUsersViaFirebase } = require('./firebasePushService');

/**
 * Kiểm tra và gửi thông báo deadline cho các subtask
 */
async function checkAndSendDeadlineNotifications() {
    try {
        console.log('🔔 [Deadline Scheduler] Checking deadlines...');
        const now = new Date();

        // Lấy tất cả subtasks chưa hoàn thành
        const subtasks = await Subtask.findAll({
            where: {
                trangThai: {
                    [Op.notIn]: ['Hoàn thành', 'Đã hủy']
                },
                ngayKetThuc: {
                    [Op.gte]: now // Deadline chưa qua
                },
                nguoiThucHienId: {
                    [Op.not]: null
                }
            },
            include: [
                {
                    model: Task,
                    as: 'task',
                    attributes: ['id', 'tenTask']
                }
            ]
        });

        console.log(`🔔 [Deadline Scheduler] Found ${subtasks.length} active subtasks`);

        const notifications = [];

        for (const subtask of subtasks) {
            const deadline = new Date(subtask.ngayKetThuc);

            // Set deadline và now về đầu ngày để so sánh chính xác
            const deadlineDate = new Date(deadline);
            deadlineDate.setHours(0, 0, 0, 0);

            const nowDate = new Date(now);
            nowDate.setHours(0, 0, 0, 0);

            // Tính số ngày chênh lệch (chính xác theo ngày, không theo giờ)
            const daysLeft = Math.round((deadlineDate - nowDate) / (1000 * 60 * 60 * 24));

            console.log(`📊 [Deadline Scheduler] Subtask "${subtask.tenSubtask}": deadline=${deadline.toISOString()}, daysLeft=${daysLeft}`);

            let shouldNotify = false;
            let title = '';
            let body = '';
            let priority = 'medium';

            // Check điều kiện gửi thông báo
            if (daysLeft === 7) {
                // 7 ngày trước deadline
                shouldNotify = true;
                title = '📅 Nhắc nhở: Deadline còn 7 ngày';
                body = `"${subtask.tenSubtask}" sẽ hết hạn vào ${deadline.toLocaleDateString('vi-VN')}`;
                priority = 'medium';
            } else if (daysLeft === 3) {
                // 3 ngày trước deadline
                shouldNotify = true;
                title = '⚠️ Cảnh báo: Deadline còn 3 ngày';
                body = `"${subtask.tenSubtask}" sắp hết hạn. Hãy hoàn thành càng sớm càng tốt!`;
                priority = 'high';
            } else if (daysLeft === 1) {
                // 1 ngày trước deadline
                shouldNotify = true;
                title = '🚨 Khẩn cấp: Deadline còn 1 ngày!';
                body = `"${subtask.tenSubtask}" sẽ hết hạn vào ngày mai!`;
                priority = 'high';
            } else if (daysLeft === 0) {
                // Hôm nay là deadline
                shouldNotify = true;
                title = '🔴 HÔM NAY LÀ DEADLINE!';
                body = `"${subtask.tenSubtask}" hết hạn hôm nay. Hãy hoàn thành ngay!`;
                priority = 'high';
            }

            if (shouldNotify) {
                notifications.push({
                    userId: subtask.nguoiThucHienId,
                    title,
                    body,
                    priority,
                    subtaskId: subtask.id,
                    taskId: subtask.taskId,
                    daysLeft
                });
            }
        }

        console.log(`🔔 [Deadline Scheduler] ${notifications.length} notifications to send`);

        // Gửi từng notification
        for (const notif of notifications) {
            try {
                const result = await sendPushToUsersViaFirebase(
                    [notif.userId],
                    notif.title,
                    notif.body,
                    {
                        type: 'deadline_reminder',
                        screen: 'member-tasks',
                        subtaskId: String(notif.subtaskId),
                        taskId: String(notif.taskId),
                        daysLeft: String(notif.daysLeft),
                        priority: notif.priority
                    }
                );

                console.log(`✅ [Deadline Scheduler] Sent to user ${notif.userId}:`, result);
            } catch (error) {
                console.error(`❌ [Deadline Scheduler] Failed to send to user ${notif.userId}:`, error);
            }
        }

        return {
            success: true,
            checked: subtasks.length,
            sent: notifications.length
        };
    } catch (error) {
        console.error('❌ [Deadline Scheduler] Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Khởi động scheduler - chạy mỗi ngày lúc 9:00 sáng
 */
function startDeadlineScheduler() {
    // Chạy mỗi ngày lúc 9:00 sáng
    cron.schedule('0 9 * * *', async () => {
        console.log('🕐 [Deadline Scheduler] Running daily check at 9:00 AM');
        await checkAndSendDeadlineNotifications();
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    });

    // Chạy thêm lúc 6:00 sáng cho deadline hôm nay
    cron.schedule('0 6 * * *', async () => {
        console.log('🕐 [Deadline Scheduler] Running morning check at 6:00 AM');
        await checkAndSendDeadlineNotifications();
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    });

    console.log('✅ [Deadline Scheduler] Started - Will run at 6:00 AM and 9:00 AM daily');
}

module.exports = {
    checkAndSendDeadlineNotifications,
    startDeadlineScheduler
};
