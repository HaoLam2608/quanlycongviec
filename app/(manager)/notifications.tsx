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
    TextInput,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/axios/config';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<string>('all'); // 'all', 'unread', 'task', 'project', 'approval', 'system'

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notifications/user');

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

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await api.post(`/notifications/${notificationId}/mark-read`);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            Alert.alert('Thành công', 'Đã đánh dấu tất cả là đã đọc');
        } catch (error) {
            console.error('Error marking all as read:', error);
            Alert.alert('Lỗi', 'Không thể đánh dấu thông báo');
        }
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
                return '#f59e0b';
            case 'system':
                return '#8b5cf6';
            default:
                return '#6b7280';
        }
    };

    // Filter and search logic
    const filteredNotifications = notifications.filter(notification => {
        // Filter by type or read status
        const matchesFilter = filter === 'all' || 
            filter === 'unread' && !notification.isRead ||
            notification.type === filter;
        
        // Filter by search query
        const matchesSearch = searchQuery.trim() === '' || 
            notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesFilter && matchesSearch;
    });

    const NotificationCard = ({ notification }: { notification: Notification }) => {
        const color = getNotificationColor(notification.type);
        
        return (
            <TouchableOpacity
                style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}
                onPress={() => !notification.isRead && markAsRead(notification.id)}
            >
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
                    <Text style={styles.notificationMessage} numberOfLines={3}>
                        {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Thông báo</Text>
                    <Text style={styles.subtitle}>
                        {unreadCount > 0 
                            ? `${unreadCount} thông báo chưa đọc` 
                            : 'Không có thông báo mới'}
                    </Text>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
                        <Ionicons name="checkmark-done" size={20} color="#f59e0b" />
                        <Text style={styles.markAllText}>Đọc tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm thông báo..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={18} color="#6b7280" />
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Compact Filter Dropdown */}
                <View style={styles.filterDropdownContainer}>
                    <Ionicons name="filter" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={{ flex: 1 }}
                    >
                        <TouchableOpacity
                            style={[styles.compactFilterTab, filter === 'all' && styles.compactFilterTabActive]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[styles.compactFilterText, filter === 'all' && styles.compactFilterTextActive]}>
                                Tất cả
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.compactFilterTab, filter === 'unread' && styles.compactFilterTabActive]}
                            onPress={() => setFilter('unread')}
                        >
                            <Text style={[styles.compactFilterText, filter === 'unread' && styles.compactFilterTextActive]}>
                                Chưa đọc
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.compactFilterTab, filter === 'task' && styles.compactFilterTabActive]}
                            onPress={() => setFilter('task')}
                        >
                            <Text style={[styles.compactFilterText, filter === 'task' && styles.compactFilterTextActive]}>
                                Công việc
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.compactFilterTab, filter === 'project' && styles.compactFilterTabActive]}
                            onPress={() => setFilter('project')}
                        >
                            <Text style={[styles.compactFilterText, filter === 'project' && styles.compactFilterTextActive]}>
                                Dự án
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.compactFilterTab, filter === 'approval' && styles.compactFilterTabActive]}
                            onPress={() => setFilter('approval')}
                        >
                            <Text style={[styles.compactFilterText, filter === 'approval' && styles.compactFilterTextActive]}>
                                Duyệt
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.compactFilterTab, filter === 'system' && styles.compactFilterTabActive]}
                            onPress={() => setFilter('system')}
                        >
                            <Text style={[styles.compactFilterText, filter === 'system' && styles.compactFilterTextActive]}>
                                Hệ thống
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>

            {/* Notifications List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={['#f59e0b']}
                        tintColor="#f59e0b"
                    />
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
                        <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                        <Text style={styles.emptyText}>Thông báo mới sẽ xuất hiện ở đây</Text>
                    </View>
                ) : filteredNotifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery.trim() !== '' 
                                ? `Không có thông báo nào khớp với "${searchQuery}"`
                                : filter === 'unread'
                                ? 'Không có thông báo chưa đọc'
                                : `Không có thông báo loại "${filter}"`
                            }
                        </Text>
                    </View>
                ) : (
                    filteredNotifications.map((notification) => (
                        <NotificationCard key={notification.id} notification={notification} />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fef3c7',
        borderRadius: 8,
    },
    markAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f59e0b',
    },
    searchContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        padding: 0,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    filterDropdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    compactFilterTab: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: 'transparent',
        marginRight: 6,
    },
    compactFilterTabActive: {
        backgroundColor: '#f59e0b',
    },
    compactFilterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    compactFilterTextActive: {
        color: '#fff',
    },
    filterScrollContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        marginRight: 6,
    },
    filterTabActive: {
        backgroundColor: '#f59e0b',
    },
    filterText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        backgroundColor: '#fffbeb',
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
        backgroundColor: '#f59e0b',
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
