const admin = require('firebase-admin');
const { DeviceToken } = require('../models');
const { Op } = require('sequelize');
const path = require('path');

// Khởi tạo Firebase Admin SDK
// const serviceAccountPath = path.join(__dirname, '..', '..', 'mobileqlcv-firebase-adminsdk-fbsvc-b4a4a229c7.json');
const serviceAccountPath = path.join(process.cwd(), 'mobileqlcv-firebase-adminsdk-fbsvc-b4a4a229c7.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

/**
 * Gửi push notification đến các thiết bị của users qua Firebase
 */
async function sendPushToUsersViaFirebase(userIds, title, body, data = {}) {
    try {
        console.log('🔥 [Firebase] Starting, userIds:', userIds);

        if (!Array.isArray(userIds) || userIds.length === 0) {
            console.log('🔥 [Firebase] No users to send push notification');
            return { success: false, sent: 0 };
        }

        // Lấy tất cả device tokens của users
        const devices = await DeviceToken.findAll({
            where: {
                userId: { [Op.in]: userIds },
                isActive: true
            }
        });

        console.log('🔥 [Firebase] Found devices:', devices.length);
        if (devices.length === 0) {
            console.log('🔥 [Firebase] No active devices found for users');
            return { success: true, sent: 0 };
        }

        // Lấy FCM tokens từ database
        // Token có thể là FCM token trực tiếp hoặc ExponentPushToken[xxx]
        const fcmTokens = devices.map(device => {
            const token = device.expoPushToken;
            // Nếu là ExponentPushToken, extract phần bên trong
            const match = token.match(/ExponentPushToken\[(.*)\]/);
            if (match) {
                console.log('⚠️ [Firebase] Token là Expo format, extract FCM token');
                return match[1];
            }
            // Nếu không, coi như đã là FCM token
            return token;
        });

        console.log('🔥 [Firebase] FCM tokens:', fcmTokens.length);

        // Tạo message payload
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                ...data,
                type: data.type || 'general',
                screen: data.screen || 'member-dashboard'
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    sound: 'default',
                    priority: 'high'
                }
            }
        };

        // Gửi đến từng token
        let successCount = 0;
        let failureCount = 0;
        const results = [];
        const invalidTokens = [];

        for (let i = 0; i < fcmTokens.length; i++) {
            const token = fcmTokens[i];
            const device = devices[i];

            try {
                const response = await admin.messaging().send({
                    ...message,
                    token: token
                });
                console.log('✅ [Firebase] Sent to token:', token.substring(0, 20) + '...', 'Response:', response);
                successCount++;
                results.push({ token, success: true, response });
            } catch (error) {
                console.error('❌ [Firebase] Failed to send to token:', token.substring(0, 20) + '...', 'Error:', error.message);
                failureCount++;
                results.push({ token, success: false, error: error.message });

                // Nếu lỗi là token không hợp lệ, đánh dấu để xóa
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered' ||
                    error.message.includes('not a valid FCM registration token')) {
                    invalidTokens.push(device.id);
                }
            }
        }

        // Xóa các token không hợp lệ khỏi database
        if (invalidTokens.length > 0) {
            console.log(`🗑️ [Firebase] Cleaning up ${invalidTokens.length} invalid tokens`);
            await DeviceToken.destroy({
                where: { id: { [Op.in]: invalidTokens } }
            });
        }

        console.log(`✅ [Firebase] Total: ${successCount} success, ${failureCount} failed`);

        return {
            success: true,
            sent: successCount,
            failed: failureCount,
            results
        };
    } catch (error) {
        console.error('❌ [Firebase] Error:', error);
        return { success: false, sent: 0, error: error.message };
    }
}

/**
 * Gửi thông báo khi có task mới được giao
 */
async function sendTaskAssignmentPushViaFirebase(userId, taskName, assignerName) {
    return await sendPushToUsersViaFirebase(
        [userId],
        '📋 Bạn có công việc mới',
        `${assignerName} đã giao cho bạn: "${taskName}"`,
        { type: 'task_assignment', screen: 'member-tasks' }
    );
}

/**
 * Gửi thông báo chung đến nhiều users
 */
async function sendGeneralNotificationPushViaFirebase(userIds, title, content) {
    return await sendPushToUsersViaFirebase(
        userIds,
        title,
        content,
        { type: 'general', screen: 'member-dashboard' }
    );
}

module.exports = {
    sendPushToUsersViaFirebase,
    sendTaskAssignmentPushViaFirebase,
    sendGeneralNotificationPushViaFirebase
};
