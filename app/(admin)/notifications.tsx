import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/axios/config';
import NotificationFormModal from './components/NotificationFormModal';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsManagement() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notifications/admin/all');

            if (response.data) {
                // Backend trả về { success, data, pagination }
                setNotifications(response.data.data || response.data);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thông báo');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleDeleteNotification = (notification: Notification) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa thông báo "${notification.title}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/notifications/admin/${notification.id}`);
                            Alert.alert('Thành công', 'Xóa thông báo thành công');
                            loadNotifications();
                        } catch (error: any) {
                            console.error('Error deleting notification:', error);
                            const message = error.response?.data?.message || 'Không thể xóa thông báo';
                            Alert.alert('Lỗi', message);
                        }
                    },
                },
            ]
        );
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task':
                return 'checkmark-circle';
            case 'project':
                return 'folder';
            case 'approval':
                return 'checkmark-done';
            case 'system':
                return 'information-circle';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'task':
                return '#3b82f6';
            case 'project':
                return '#10b981';
            case 'approval':
                return '#ec4899';
            case 'system':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    const NotificationCard = ({ notification }: { notification: Notification }) => {
        const color = getNotificationColor(notification.type);
        
        return (
            <View style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
                <View style={[styles.notificationIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons 
                        name={getNotificationIcon(notification.type) as any} 
                        size={24} 
                        color={color} 
                    />
                </View>
                <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {!notification.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
                <View style={styles.notificationActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            setEditingNotification(notification);
                            setShowFormModal(true);
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color="#f59e0b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDeleteNotification(notification)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Thông báo</Text>
                <Text style={styles.subtitle}>
                    {notifications.filter(n => !n.isRead).length} thông báo chưa đọc
                </Text>
            </View>

            {/* Notifications List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#f59e0b" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>Chưa có thông báo</Text>
                    </View>
                ) : (
                    notifications.map((notification) => (
                        <NotificationCard key={notification.id} notification={notification} />
                    ))
                )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => {
                    setEditingNotification(null);
                    setShowFormModal(true);
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Form Modal */}
            <NotificationFormModal
                visible={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingNotification(null);
                }}
                onSuccess={() => {
                    setShowFormModal(false);
                    setEditingNotification(null);
                    loadNotifications();
                }}
                notification={editingNotification}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
    notificationActions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        backgroundColor: '#fee2e2',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 16,
    },
});
