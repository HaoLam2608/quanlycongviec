import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    // Bell Button
    bellButton: {
        position: 'relative',
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // Main Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '60%',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    unreadCount: {
        fontSize: 12,
        color: '#6B7280',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#EFF6FF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    markAllText: {
        fontSize: 12,
        color: '#1D4ED8',
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
    },

    // Tab Navigation
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        margin: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    activeTabButton: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#2563EB',
    },
    tabBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Notification List
    notificationList: {
        flex: 1,
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
    },
    loadingText: {
        color: '#6B7280',
        marginTop: 8,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 4,
    },

    // Notification Item
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: 'white',
    },
    unreadNotificationItem: {
        backgroundColor: '#EFF6FF',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#6B7280',
        flexShrink: 0,
    },
    notificationText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        marginBottom: 4,
    },
    notificationAuthor: {
        fontSize: 12,
        color: '#6B7280',
    },

    // Footer
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    viewAllButton: {
        alignItems: 'center',
        padding: 12,
    },
    viewAllText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },

    // Detail Modal
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    detailContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        maxWidth: '100%',
        width: '100%',
        maxHeight: '80%',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeLabel: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        padding: 16,
        paddingBottom: 8,
    },
    detailContent: {
        maxHeight: 300,
    },
    detailText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    detailMeta: {
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    metaValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },

    // Assignment Actions
    assignmentActions: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    assignmentQuestion: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: '#10B981',
    },
    acceptButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    prepareDeclineButton: {
        backgroundColor: '#F3F4F6',
    },
    prepareDeclineText: {
        color: '#374151',
        fontWeight: '500',
        fontSize: 14,
    },
    declineSection: {
        gap: 8,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    declineButton: {
        backgroundColor: '#EF4444',
        alignSelf: 'flex-end',
        flex: 0,
        paddingHorizontal: 24,
    },
    declineButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },

    // Status Messages
    statusContainer: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    acceptedStatus: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    declinedStatus: {
        fontSize: 14,
        color: '#DC2626',
        fontWeight: '500',
    },
    loadingStatus: {
        fontSize: 14,
        color: '#6B7280',
    },
});