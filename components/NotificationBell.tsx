import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { STORAGE_KEYS } from '../constants/api';
import {
    acceptAssignment,
    declineAssignment,
    getAssignmentDetails,
    getMyNotifications,
    markNotificationAsRead
} from '../src/axios/api';
import { Notification } from '../types/member';
import { styles } from './styles/NotificationBell.styles';

interface NotificationBellProps {
    userRole?: 'admin' | 'manager' | 'member';
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'system':
            return 'information-circle-outline';
        case 'project':
            return 'folder-outline';
        case 'task':
            return 'checkmark-circle-outline';
        case 'announcement':
            return 'megaphone-outline';
        default:
            return 'notifications-outline';
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'system':
            return '#3B82F6'; // Blue
        case 'project':
            return '#10B981'; // Green
        case 'task':
            return '#F59E0B'; // Orange
        case 'announcement':
            return '#8B5CF6'; // Purple
        default:
            return '#6B7280'; // Gray
    }
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'system':
            return 'Hệ thống';
        case 'project':
            return 'Dự án';
        case 'task':
            return 'Nhiệm vụ';
        case 'announcement':
            return 'Thông báo';
        default:
            return 'Khác';
    }
};

const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
};

export default function NotificationBell({ userRole = 'member' }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'assignments'>('general');
    const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
    const [assignmentAssigneeName, setAssignmentAssigneeName] = useState<string | null>(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            console.log('🔔 Fetching notifications...');
            const response = await getMyNotifications({ limit: 20 });

            if (response && response.success && response.data) {
                console.log('📋 Total notifications:', response.data.length);
                setNotifications(response.data);
            }
        } catch (error: any) {
            // Better error handling similar to web frontend
            console.error('❌ Error fetching notifications:', error);
            if (error?.response?.status === 403) {
                console.warn('⚠️ Permission denied for notifications - user may not have access');
            } else if (error?.response?.status === 401) {
                console.warn('⚠️ Authentication failed for notifications - token may be invalid');
            } else if (error?.code === 'ECONNREFUSED' || (error?.message && error.message.includes('Network Error'))) {
                console.warn('⚠️ Backend server not running - notifications unavailable');
            }
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Delay and check token (similar behavior to web client) before fetching
        const timer = setTimeout(async () => {
            try {
                const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                if (token) {
                    fetchNotifications();
                } else {
                    console.warn('⚠️ No token found, skipping notification fetch');
                }
            } catch (err) {
                console.warn('Error checking token for notifications fetch', err);
                // still attempt fetch as fallback
                fetchNotifications();
            }
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Separate notifications into general and assignments
    const assignmentNotifications = notifications.filter(n => n.userMeta?.assignmentId);
    const generalNotifications = notifications.filter(n => !n.userMeta?.assignmentId);

    const activeNotifications = activeTab === 'assignments' ? assignmentNotifications : generalNotifications;
    const generalUnreadCount = generalNotifications.filter(n => !n.isRead).length;
    const assignmentUnreadCount = assignmentNotifications.filter(n => !n.isRead).length;

    const markAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = (activeTab === 'general' ? generalNotifications : assignmentNotifications)
                .filter(n => !n.isRead);

            // run in parallel like web frontend
            const promises = unreadNotifications.map(n => markNotificationAsRead(n.id));
            await Promise.all(promises);

            setNotifications(prev =>
                prev.map(n => {
                    const shouldMarkRead = unreadNotifications.some(un => un.id === n.id);
                    return shouldMarkRead ? { ...n, isRead: true } : n;
                })
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // If this is an assignment notification, fetch assignment status
        if (notification.userMeta?.assignmentId) {
            try {
                const assignmentResponse = await getAssignmentDetails(String(notification.userMeta.assignmentId));
                if (assignmentResponse && assignmentResponse.success) {
                    setAssignmentStatus(assignmentResponse.data.status);
                    const assignee = assignmentResponse.data.assignee;
                    const assigneeName = assignee?.hoten || assignee?.manv || null;
                    setAssignmentAssigneeName(assigneeName);
                }
            } catch (error) {
                console.error('Error fetching assignment status:', error);
                setAssignmentStatus(null);
                setAssignmentAssigneeName(null);
            }
        } else {
            setAssignmentStatus(null);
            setAssignmentAssigneeName(null);
        }

        setSelectedNotification(notification);
        setDetailModalVisible(true);
    };

    const handleAccept = async () => {
        if (!selectedNotification) return;
        const assignmentId = selectedNotification.userMeta?.assignmentId;
        if (!assignmentId) return;

        try {
            setProcessingAction(true);
            await acceptAssignment(String(assignmentId));
            fetchNotifications();
            setDetailModalVisible(false);
            setSelectedNotification(null);
            setAssignmentStatus(null);
            setAssignmentAssigneeName(null);
            setDeclineReason('');
            Alert.alert('Thành công', 'Đã chấp nhận công việc');
        } catch (error) {
            console.error('Error accepting assignment:', error);
            Alert.alert('Lỗi', 'Không thể chấp nhận công việc');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleDecline = async () => {
        if (!selectedNotification) return;
        const assignmentId = selectedNotification.userMeta?.assignmentId;
        if (!assignmentId) return;
        if (!declineReason.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setProcessingAction(true);
            await declineAssignment(String(assignmentId), { reason: declineReason });
            fetchNotifications();
            setDetailModalVisible(false);
            setSelectedNotification(null);
            setAssignmentStatus(null);
            setAssignmentAssigneeName(null);
            setDeclineReason('');
            Alert.alert('Thành công', 'Đã từ chối công việc');
        } catch (error) {
            console.error('Error declining assignment:', error);
            Alert.alert('Lỗi', 'Không thể từ chối công việc');
        } finally {
            setProcessingAction(false);
        }
    };

    return (
        <>
            {/* Notification Bell Button */}
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={styles.bellButton}
                disabled={loading}
            >
                <Ionicons name="notifications-outline" size={24} color="#374151" />
                {(generalUnreadCount + assignmentUnreadCount) > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {(generalUnreadCount + assignmentUnreadCount) > 9
                                ? '9+'
                                : (generalUnreadCount + assignmentUnreadCount)
                            }
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Notification List Modal */}
            <Modal
                visible={isOpen}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Text style={styles.title}>Thông báo</Text>
                                <Text style={styles.unreadCount}>{unreadCount} chưa đọc</Text>
                            </View>
                            <View style={styles.headerRight}>
                                {(activeTab === 'general' ? generalUnreadCount : assignmentUnreadCount) > 0 && (
                                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                                        <Text style={styles.markAllText}>Đánh dấu đã đọc</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                                    <Ionicons name="close" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Tab Navigation */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                onPress={() => setActiveTab('general')}
                                style={[
                                    styles.tabButton,
                                    activeTab === 'general' && styles.activeTabButton
                                ]}
                            >
                                <Text style={[
                                    styles.tabText,
                                    activeTab === 'general' && styles.activeTabText
                                ]}>
                                    Thông báo chung
                                </Text>
                                {generalUnreadCount > 0 && (
                                    <View style={styles.tabBadge}>
                                        <Text style={styles.tabBadgeText}>
                                            {generalUnreadCount > 9 ? '9+' : generalUnreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setActiveTab('assignments')}
                                style={[
                                    styles.tabButton,
                                    activeTab === 'assignments' && styles.activeTabButton
                                ]}
                            >
                                <Text style={[
                                    styles.tabText,
                                    activeTab === 'assignments' && styles.activeTabText
                                ]}>
                                    Thông báo giao việc
                                </Text>
                                {assignmentUnreadCount > 0 && (
                                    <View style={styles.tabBadge}>
                                        <Text style={styles.tabBadgeText}>
                                            {assignmentUnreadCount > 9 ? '9+' : assignmentUnreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Notification List */}
                        <ScrollView style={styles.notificationList}>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>Đang tải thông báo...</Text>
                                </View>
                            ) : activeNotifications.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="notifications-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyTitle}>Không có thông báo</Text>
                                    <Text style={styles.emptyText}>
                                        Bạn sẽ nhận được thông báo khi có hoạt động liên quan.
                                    </Text>
                                </View>
                            ) : (
                                activeNotifications.map((notification) => {
                                    const isRead = notification.isRead;
                                    const typeColor = getTypeColor(notification.type);

                                    return (
                                        <TouchableOpacity
                                            key={notification.id}
                                            onPress={() => handleNotificationClick(notification)}
                                            style={[
                                                styles.notificationItem,
                                                !isRead && styles.unreadNotificationItem
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.iconContainer,
                                                    { backgroundColor: typeColor + '20' }
                                                ]}
                                            >
                                                <Ionicons
                                                    name={getNotificationIcon(notification.type) as any}
                                                    size={20}
                                                    color={typeColor}
                                                />
                                            </View>

                                            <View style={styles.notificationContent}>
                                                <View style={styles.notificationHeader}>
                                                    <Text style={styles.notificationTitle} numberOfLines={1}>
                                                        {notification.title}
                                                    </Text>
                                                    <Text style={styles.notificationTime}>
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.notificationText} numberOfLines={2}>
                                                    {notification.content}
                                                </Text>
                                                <Text style={styles.notificationAuthor}>
                                                    {notification.author?.hoten || notification.author?.manv || 'System'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <View style={styles.footer}>
                                <TouchableOpacity style={styles.viewAllButton}>
                                    <Text style={styles.viewAllText}>Xem tất cả thông báo</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Notification Detail Modal */}
            <Modal
                visible={detailModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.detailOverlay}>
                    <View style={styles.detailContainer}>
                        {selectedNotification && (
                            <>
                                <View style={styles.detailHeader}>
                                    <View style={styles.typeContainer}>
                                        <Ionicons
                                            name={getNotificationIcon(selectedNotification.type) as any}
                                            size={16}
                                            color={getTypeColor(selectedNotification.type)}
                                        />
                                        <Text style={styles.typeLabel}>
                                            {getTypeLabel(selectedNotification.type)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setDetailModalVisible(false);
                                            setSelectedNotification(null);
                                            setAssignmentStatus(null);
                                            setAssignmentAssigneeName(null);
                                            setDeclineReason('');
                                        }}
                                        style={styles.closeButton}
                                    >
                                        <Ionicons name="close" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.detailTitle}>{selectedNotification.title}</Text>

                                <ScrollView style={styles.detailContent}>
                                    <Text style={styles.detailText}>{selectedNotification.content}</Text>

                                    <View style={styles.detailMeta}>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Người gửi:</Text>
                                            <Text style={styles.metaValue}>
                                                {selectedNotification.author?.hoten || selectedNotification.author?.manv || 'System'}
                                            </Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Thời gian:</Text>
                                            <Text style={styles.metaValue}>
                                                {formatTimeAgo(selectedNotification.createdAt)}
                                            </Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Loại:</Text>
                                            <Text style={styles.metaValue}>
                                                {getTypeLabel(selectedNotification.type)}
                                            </Text>
                                        </View>
                                    </View>
                                </ScrollView>

                                {/* Assignment Actions */}
                                {selectedNotification.userMeta?.assignmentId && (
                                    <View style={styles.assignmentActions}>
                                        {assignmentStatus === 'pending' ? (
                                            <>
                                                <Text style={styles.assignmentQuestion}>
                                                    Bạn có muốn nhận công việc này?
                                                </Text>
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity
                                                        onPress={handleAccept}
                                                        disabled={processingAction}
                                                        style={[styles.actionButton, styles.acceptButton]}
                                                    >
                                                        <Text style={styles.acceptButtonText}>Chấp nhận</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => setDeclineReason('')}
                                                        disabled={processingAction}
                                                        style={[styles.actionButton, styles.prepareDeclineButton]}
                                                    >
                                                        <Text style={styles.prepareDeclineText}>Chuẩn bị từ chối</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={styles.declineSection}>
                                                    <TextInput
                                                        value={declineReason}
                                                        onChangeText={setDeclineReason}
                                                        placeholder="Lý do từ chối (nếu có)"
                                                        style={styles.reasonInput}
                                                        multiline={true}
                                                        numberOfLines={3}
                                                    />
                                                    <TouchableOpacity
                                                        onPress={handleDecline}
                                                        disabled={processingAction}
                                                        style={[styles.actionButton, styles.declineButton]}
                                                    >
                                                        <Text style={styles.declineButtonText}>Từ chối</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </>
                                        ) : assignmentStatus === 'accepted' ? (
                                            <View style={styles.statusContainer}>
                                                <Text style={styles.acceptedStatus}>
                                                    ✅ {assignmentAssigneeName
                                                        ? `${assignmentAssigneeName} đã chấp nhận công việc này`
                                                        : 'Đã chấp nhận công việc này'
                                                    }
                                                </Text>
                                            </View>
                                        ) : assignmentStatus === 'declined' ? (
                                            <View style={styles.statusContainer}>
                                                <Text style={styles.declinedStatus}>
                                                    ❌ {assignmentAssigneeName
                                                        ? `${assignmentAssigneeName} đã từ chối công việc này`
                                                        : 'Đã từ chối công việc này'
                                                    }
                                                </Text>
                                            </View>
                                        ) : (
                                            <View style={styles.statusContainer}>
                                                <Text style={styles.loadingStatus}>Đang tải trạng thái...</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}