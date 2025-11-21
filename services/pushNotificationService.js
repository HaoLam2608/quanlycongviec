const { Expo } = require('expo-server-sdk');
const { DeviceToken } = require('../models');
const { Op } = require('sequelize');

const expo = new Expo();

/**
 * Gửi push notification đến các thiết bị của users
 */
async function sendPushToUsers(userIds, title, body, data = {}) {
    try {
        console.log('📤 [sendPushToUsers] Starting, userIds:', userIds);

        if (!Array.isArray(userIds) || userIds.length === 0) {
            console.log('📤 [sendPushToUsers] No users to send push notification');
            return { success: false, sent: 0 };
        }

        // Lấy tất cả device tokens của users
        const devices = await DeviceToken.findAll({
            where: {
                userId: { [Op.in]: userIds },
                isActive: true
            }
        });

        console.log('📤 [sendPushToUsers] Found devices:', devices.length);
        if (devices.length > 0) {
            console.log('📤 [sendPushToUsers] Sample device:', {
                userId: devices[0].userId,
                token: devices[0].expoPushToken.substring(0, 20) + '...',
                platform: devices[0].platform
            });
        }

        if (devices.length === 0) {
            console.log('📤 [sendPushToUsers] No active devices found for users');
            return { success: true, sent: 0 };
        }

        const messages = [];

        for (const device of devices) {
            // Kiểm tra push token hợp lệ
            if (!Expo.isExpoPushToken(device.expoPushToken)) {
                console.log(`📤 [sendPushToUsers] Invalid push token: ${device.expoPushToken}`);
                continue;
            }

            messages.push({
                to: device.expoPushToken,
                sound: 'default',
                title,
                body,
                data,
                priority: 'high',
                channelId: 'default'
            });
        }

        console.log('📤 [sendPushToUsers] Prepared messages:', messages.length);

        if (messages.length === 0) {
            console.log('📤 [sendPushToUsers] No valid messages to send');
            return { success: true, sent: 0 };
        }

        // Gửi notifications theo chunks
        const chunks = expo.chunkPushNotifications(messages);
        let totalSent = 0;

        console.log('📤 [sendPushToUsers] Sending chunks:', chunks.length);

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                totalSent += ticketChunk.length;
                console.log(`✅ [sendPushToUsers] Sent ${ticketChunk.length} push notifications`);
                console.log('✅ [sendPushToUsers] Tickets:', JSON.stringify(ticketChunk, null, 2));
            } catch (error) {
                console.error('❌ [sendPushToUsers] Error sending push notification chunk:', error);
            }
        }

        console.log('✅ [sendPushToUsers] Total sent:', totalSent);
        return { success: true, sent: totalSent };
    } catch (error) {
        console.error('❌ [sendPushToUsers] Error:', error);
        return { success: false, sent: 0, error: error.message };
    }
}

/**
 * Gửi thông báo khi có task mới được giao
 */
async function sendTaskAssignmentPush(userId, taskName, assignerName) {
    return await sendPushToUsers(
        [userId],
        '📋 Bạn có công việc mới',
        `${assignerName} đã giao cho bạn: "${taskName}"`,
        { type: 'task_assignment', screen: 'member-tasks' }
    );
}

/**
 * Gửi thông báo chung đến nhiều users
 */
async function sendGeneralNotificationPush(userIds, title, content) {
    return await sendPushToUsers(
        userIds,
        title,
        content,
        { type: 'general', screen: 'member-dashboard' }
    );
}

/**
 * Gửi thông báo deadline sắp đến
 */
async function sendDeadlineReminderPush(userId, taskName, daysLeft) {
    let emoji = '📅';
    let urgency = 'sắp đến hạn';

    if (daysLeft === 0) {
        emoji = '🔴';
        urgency = 'đến hạn hôm nay';
    } else if (daysLeft === 1) {
        emoji = '🚨';
        urgency = 'đến hạn ngày mai';
    } else if (daysLeft <= 3) {
        emoji = '⚠️';
        urgency = `còn ${daysLeft} ngày`;
    }

    return await sendPushToUsers(
        [userId],
        `${emoji} Nhắc nhở deadline`,
        `"${taskName}" ${urgency}`,
        { type: 'deadline_reminder', screen: 'member-tasks', daysLeft }
    );
}

module.exports = {
    sendPushToUsers,
    sendTaskAssignmentPush,
    sendGeneralNotificationPush,
    sendDeadlineReminderPush
};
