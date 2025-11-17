import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import notificationService from '../services/notificationService';

interface NotificationSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    notificationEnabled: boolean;
    onToggleNotification: (enabled: boolean) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
    visible,
    onClose,
    notificationEnabled,
    onToggleNotification,
}) => {
    const handleToggleNotification = async (value: boolean) => {
        if (value) {
            const hasPermission = await notificationService.requestPermissions();
            if (hasPermission) {
                onToggleNotification(true);
                Alert.alert('Thành công', 'Đã bật thông báo deadline');
            } else {
                Alert.alert(
                    'Cần cấp quyền',
                    'Vui lòng vào Cài đặt > Ứng dụng > Mobile_qlcv > Thông báo để bật quyền thông báo'
                );
            }
        } else {
            // Hủy tất cả thông báo đã lên lịch
            await notificationService.cancelAllScheduledNotifications();
            onToggleNotification(false);
            Alert.alert('Đã tắt', 'Đã tắt tất cả thông báo deadline');
        }
    };

    const handleViewScheduledNotifications = async () => {
        const scheduled = await notificationService.getAllScheduledNotifications();

        if (scheduled.length === 0) {
            Alert.alert('Thông báo', 'Chưa có thông báo nào được lên lịch');
            return;
        }

        const message = scheduled
            .slice(0, 5)
            .map((notif, index) => {
                const trigger = notif.trigger as any;
                const date = trigger?.date ? new Date(trigger.date) : null;
                return `${index + 1}. ${notif.content.title}\n   ⏰ ${date ? date.toLocaleString('vi-VN') : 'Không rõ'}`;
            })
            .join('\n\n');

        Alert.alert(
            `${scheduled.length} thông báo đã lên lịch`,
            message + (scheduled.length > 5 ? '\n\n...' : ''),
            [{ text: 'Đóng' }]
        );
    };

    const handleTestNotification = async () => {
        await notificationService.sendImmediateNotification(
            '🔔 Thông báo test',
            'Đây là thông báo thử nghiệm. Bạn sẽ nhận được thông báo như thế này khi có deadline sắp tới!'
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Cài đặt thông báo</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Main Toggle */}
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIcon}>
                                    <Ionicons
                                        name="notifications"
                                        size={24}
                                        color={notificationEnabled ? '#667eea' : '#9CA3AF'}
                                    />
                                </View>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingTitle}>Thông báo deadline</Text>
                                    <Text style={styles.settingDescription}>
                                        Nhận nhắc nhở khi công việc sắp đến hạn
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={notificationEnabled}
                                onValueChange={handleToggleNotification}
                                trackColor={{ false: '#D1D5DB', true: '#667eea' }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        {notificationEnabled && (
                            <>
                                {/* Notification Schedule Info */}
                                <View style={styles.infoCard}>
                                    <Text style={styles.infoTitle}>📅 Lịch nhắc nhở</Text>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoBullet}>•</Text>
                                        <Text style={styles.infoText}>7 ngày trước deadline</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoBullet}>•</Text>
                                        <Text style={styles.infoText}>3 ngày trước deadline</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoBullet}>•</Text>
                                        <Text style={styles.infoText}>1 ngày trước deadline</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoBullet}>•</Text>
                                        <Text style={styles.infoText}>Vào ngày deadline</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleViewScheduledNotifications}
                                >
                                    <Ionicons name="list-outline" size={20} color="#667eea" />
                                    <Text style={styles.actionButtonText}>
                                        Xem thông báo đã lên lịch
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color="#667eea" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleTestNotification}
                                >
                                    <Ionicons name="flash-outline" size={20} color="#667eea" />
                                    <Text style={styles.actionButtonText}>Gửi thông báo thử</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#667eea" />
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Help Text */}
                        <View style={styles.helpCard}>
                            <Ionicons name="information-circle-outline" size={20} color="#667eea" />
                            <Text style={styles.helpText}>
                                Thông báo sẽ được gửi tự động dựa trên deadline của các công việc được giao cho bạn.
                                Bạn có thể tắt thông báo bất kỳ lúc nào.
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    modalBody: {
        padding: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 16,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    infoCard: {
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoBullet: {
        fontSize: 16,
        color: '#667eea',
        marginRight: 8,
        fontWeight: '700',
    },
    infoText: {
        fontSize: 14,
        color: '#4B5563',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 12,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 15,
        color: '#667eea',
        fontWeight: '600',
        marginLeft: 12,
    },
    helpCard: {
        flexDirection: 'row',
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    helpText: {
        flex: 1,
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 20,
        marginLeft: 12,
    },
});
