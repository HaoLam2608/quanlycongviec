import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../../src/axios/config';
import NotificationFormModal from './components/NotificationFormModal';

interface Notification {
    id: number;
    type: string;
    title: string;
    content: string;
    message?: string;
    isRead: boolean;
    status: string;
    priority: string;
    createdAt: string;
}

export default function NotificationsManagement() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchText, setSearchText] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailNotification, setDetailNotification] = useState<Notification | null>(null);

    useEffect(() => {
        loadNotifications();
    }, [selectedType, selectedStatus, searchText]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    // load notifications with optional filters; backend supports `type`, `status` and `search`
    const loadNotifications = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (selectedType && selectedType !== 'all') params.type = selectedType;
            if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
            if (searchText && searchText.trim()) params.search = searchText.trim();

            const response = await api.get('/notifications/admin/all', { params });
            if (response.data) {
                setNotifications(response.data.data || response.data);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thông báo');
        } finally {
            setLoading(false);
        }
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

        const handleMarkAllRead = async () => {
            try {
                const res = await api.post('/notifications/mark-all-read');
                // If API returns success, update local state
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
            } catch (error: any) {
                console.error('Error marking all read:', error);
                const msg = error?.response?.data?.message || error?.message || 'Không thể đánh dấu tất cả là đã đọc';
                Alert.alert('Lỗi', msg);
            }
        };
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
            case 'announcement':
                return 'megaphone';
            default:
                return 'notifications';
        }
    };

    // Move mark-all-read handler to component scope (was accidentally nested)
    const handleMarkAllRead = async () => {
        try {
            const res = await api.post('/notifications/mark-all-read');
            // If API returns success, update local state
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error: any) {
            console.error('Error marking all read:', error);
            const msg = error?.response?.data?.message || error?.message || 'Không thể đánh dấu tất cả là đã đọc';
            Alert.alert('Lỗi', msg);
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
            case 'announcement':
                return '#8b5cf6';
            default:
                return '#6b7280';
        }
    };

    const NotificationCard = ({ notification }: { notification: Notification }) => {
        const color = getNotificationColor(notification.type);
        const displayMessage = notification.content || notification.message || '';
        
        // Get status badge
        const getStatusBadge = () => {
            if (notification.status === 'published') {
                return (
                    <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
                        <Text style={[styles.statusText, { color: '#10b981' }]}>Đã xuất bản</Text>
                    </View>
                );
            }
            return (
                <View style={[styles.statusBadge, { backgroundColor: '#6b728020' }]}>
                    <Text style={[styles.statusText, { color: '#6b7280' }]}>Bản nháp</Text>
                </View>
            );
        };

        // Get priority badge
        const getPriorityBadge = () => {
            const priorityColors: Record<string, string> = {
                high: '#ef4444',
                medium: '#f59e0b',
                low: '#6b7280'
            };
            const priorityLabels: Record<string, string> = {
                high: 'Cao',
                medium: 'Trung bình',
                low: 'Thấp'
            };
            const color = priorityColors[notification.priority] || '#6b7280';
            const label = priorityLabels[notification.priority] || notification.priority;
            
            return (
                <View style={[styles.priorityBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.priorityText, { color }]}>{label}</Text>
                </View>
            );
        };
        
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={async () => {
                // Open detail modal and mark read
                setDetailNotification(notification);
                setShowDetailModal(true);
                if (!notification.isRead) {
                    try {
                        await api.post(`/notifications/${notification.id}/mark-read`);
                        // Optimistically update local state
                        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                    } catch (e) {
                        console.error('Mark read failed', e);
                    }
                }
            }}>
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
                    <View style={styles.badgeRow}>
                        {getStatusBadge()}
                        {getPriorityBadge()}
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {displayMessage}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {new Date(notification.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
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
            </TouchableOpacity>
        );
    };

    const closeDetail = () => {
        setShowDetailModal(false);
        setDetailNotification(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Thông báo</Text>
                    <Text style={styles.subtitle}>
                        {notifications.length} thông báo
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.markAllBtn}
                        onPress={() => {
                            Alert.alert(
                                'Xác nhận',
                                'Bạn có muốn đánh dấu tất cả thông báo là đã đọc?',
                                [
                                    { text: 'Hủy', style: 'cancel' },
                                    { text: 'Đồng ý', onPress: handleMarkAllRead }
                                ]
                            );
                        }}
                    >
                        <Text style={styles.markAllBtnText}>Đã đọc tất cả</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm thông báo..."
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="#9ca3af"
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={20} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Notifications List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Type Filters */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Loại thông báo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.pill, selectedType === 'all' && styles.pillActive]}
                                onPress={() => setSelectedType('all')}
                            >
                                <Text style={[styles.pillText, selectedType === 'all' && styles.pillTextActive]}>Tất cả</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pill, selectedType === 'task' && styles.pillActive]}
                                onPress={() => setSelectedType('task')}
                            >
                                <Text style={[styles.pillText, selectedType === 'task' && styles.pillTextActive]}>Công việc</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pill, selectedType === 'announcement' && styles.pillActive]}
                                onPress={() => setSelectedType('announcement')}
                            >
                                <Text style={[styles.pillText, selectedType === 'announcement' && styles.pillTextActive]}>Thông báo chung</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>                {/* Status Filters */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Trạng thái</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.pill, selectedStatus === 'all' && styles.pillActive]}
                                onPress={() => setSelectedStatus('all')}
                            >
                                <Text style={[styles.pillText, selectedStatus === 'all' && styles.pillTextActive]}>Tất cả</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pill, selectedStatus === 'published' && styles.pillActive]}
                                onPress={() => setSelectedStatus('published')}
                            >
                                <Text style={[styles.pillText, selectedStatus === 'published' && styles.pillTextActive]}>Đã xuất bản</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pill, selectedStatus === 'draft' && styles.pillActive]}
                                onPress={() => setSelectedStatus('draft')}
                            >
                                <Text style={[styles.pillText, selectedStatus === 'draft' && styles.pillTextActive]}>Bản nháp</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>

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

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent
                onRequestClose={closeDetail}
            >
                <View style={styles.detailModalOverlay}>
                    <View style={styles.detailModalContainer}>
                        <Text style={styles.detailTitle}>{detailNotification?.title}</Text>
                        <View style={styles.detailMeta}>
                            <Text style={styles.detailMetaText}>Loại: {detailNotification?.type}</Text>
                            <Text style={styles.detailMetaText}> • </Text>
                            <Text style={styles.detailMetaText}>Trạng thái: {detailNotification?.status}</Text>
                            <Text style={styles.detailMetaText}> • </Text>
                            <Text style={styles.detailMetaText}>Mức: {detailNotification?.priority}</Text>
                        </View>
                        <ScrollView style={styles.detailContent}>
                            <Text style={styles.detailMessage}>{detailNotification?.content || detailNotification?.message}</Text>
                        </ScrollView>
                        <Text style={styles.detailTime}>{detailNotification ? new Date(detailNotification.createdAt).toLocaleString() : ''}</Text>
                        <View style={styles.detailFooter}>
                            <TouchableOpacity style={styles.detailBtn} onPress={closeDetail}>
                                <Text style={styles.detailBtnText}>Đóng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.detailBtn, { backgroundColor: '#f59e0b' }]}
                                onPress={() => {
                                    if (detailNotification) {
                                        setEditingNotification(detailNotification);
                                        setShowFormModal(true);
                                        closeDetail();
                                    }
                                }}
                            >
                                <Text style={[styles.detailBtnText, { color: '#fff' }]}>Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.detailBtn, { backgroundColor: '#ef4444' }]}
                                onPress={async () => {
                                    if (!detailNotification) return;
                                    await handleDeleteNotification(detailNotification);
                                    closeDetail();
                                }}
                            >
                                <Text style={[styles.detailBtnText, { color: '#fff' }]}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        padding: 0,
    },
    content: {
        flex: 1,
    },
    filterSection: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: '#f3f4f6',
    },
    pillActive: {
        backgroundColor: '#111827',
    },
    pillText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    pillTextActive: {
        color: '#fff',
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 12,
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
        marginBottom: 6,
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
    badgeRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 6,
    },
    statusBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    priorityBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '600',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 11,
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
    headerLeft: {
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    markAllBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    markAllBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827'
    },
    detailModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    detailModalContainer: {
        width: '100%',
        maxWidth: 720,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        maxHeight: '80%'
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    detailMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    detailMetaText: {
        fontSize: 12,
        color: '#6b7280'
    },
    detailContent: {
        marginBottom: 8,
    },
    detailMessage: {
        fontSize: 14,
        color: '#374151'
    },
    detailTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 8,
    },
    detailFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    detailBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6'
    },
    detailBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827'
    },
});
