'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Circle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { notificationUserAPI, type Notification } from '@/axios/notificationAPI'

interface NotificationBellProps {
    userRole: 'admin' | 'manager' | 'member'
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'system':
            return <Info className="w-4 h-4 text-blue-500" />
        case 'project':
            return <Circle className="w-4 h-4 text-green-500" />
        case 'task':
            return <CheckCircle2 className="w-4 h-4 text-orange-500" />
        case 'announcement':
            return <Bell className="w-4 h-4 text-purple-500" />
        default:
            return <Circle className="w-4 h-4 text-gray-500" />
    }
}

const getTypeColor = (type: string) => {
    switch (type) {
        case 'system':
            return 'border-l-blue-500 bg-blue-50'
        case 'project':
            return 'border-l-green-500 bg-green-50'
        case 'task':
            return 'border-l-orange-500 bg-orange-50'
        case 'announcement':
            return 'border-l-purple-500 bg-purple-50'
        default:
            return 'border-l-gray-500 bg-gray-50'
    }
}

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'system':
            return 'Hệ thống'
        case 'project':
            return 'Dự án'
        case 'task':
            return 'Nhiệm vụ'
        case 'announcement':
            return 'Thông báo'
        default:
            return 'Khác'
    }
}

export default function NotificationBell({ userRole }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [declineReason, setDeclineReason] = useState('')
    const [processingAction, setProcessingAction] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'assignments'>('general')
    const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null)
    const [assignmentAssigneeName, setAssignmentAssigneeName] = useState<string | null>(null)

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response = await notificationUserAPI.getMyNotifications({ limit: 20 })
            if (response.success) {
                setNotifications(response.data)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    // Calculate unread count using isRead from server
    const unreadCount = notifications.filter(n => !n.isRead).length

    // Separate notifications into general and assignments
    const assignmentNotifications = notifications.filter(n => n.userMeta?.assignmentId)
    const generalNotifications = notifications.filter(n => !n.userMeta?.assignmentId)

    const activeNotifications = activeTab === 'assignments' ? assignmentNotifications : generalNotifications
    const generalUnreadCount = generalNotifications.filter(n => !n.isRead).length
    const assignmentUnreadCount = assignmentNotifications.filter(n => !n.isRead).length

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationUserAPI.markAsRead(notificationId)
            // Update local state to reflect the change immediately
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            // Mark all unread notifications as read
            const unreadNotifications = (activeTab === 'general' ? generalNotifications : assignmentNotifications)
                .filter(n => !n.isRead)

            const promises = unreadNotifications.map(n => notificationUserAPI.markAsRead(n.id))
            await Promise.all(promises)

            // Update local state
            setNotifications(prev =>
                prev.map(n => {
                    const shouldMarkRead = unreadNotifications.some(un => un.id === n.id)
                    return shouldMarkRead ? { ...n, isRead: true } : n
                })
            )
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id)
        }

        // If this is an assignment notification, fetch assignment status
        if (notification.userMeta?.assignmentId) {
            try {
                const assignmentResponse = await notificationUserAPI.getAssignment(String(notification.userMeta.assignmentId))
                if (assignmentResponse.success) {
                    setAssignmentStatus(assignmentResponse.data.status)
                    const assignee = assignmentResponse.data.assignee
                    const assigneeName = assignee?.hoten || assignee?.manv || null
                    setAssignmentAssigneeName(assigneeName)
                }
            } catch (error) {
                console.error('Error fetching assignment status:', error)
                setAssignmentStatus(null)
                setAssignmentAssigneeName(null)
            }
        } else {
            setAssignmentStatus(null)
            setAssignmentAssigneeName(null)
        }

        setSelectedNotification(notification)
    }

    const handleAccept = async () => {
        if (!selectedNotification) return
        const assignmentId = selectedNotification.userMeta?.assignmentId
        if (!assignmentId) return
        try {
            setProcessingAction(true)
            await notificationUserAPI.acceptAssignment(String(assignmentId))
            // refresh list
            fetchNotifications()
            setSelectedNotification(null)
            setAssignmentStatus(null)
            setAssignmentAssigneeName(null)
            setDeclineReason('')
        } catch (err) {
            console.error('Error accepting assignment', err)
        } finally {
            setProcessingAction(false)
        }
    }

    const handleDecline = async () => {
        if (!selectedNotification) return
        const assignmentId = selectedNotification.userMeta?.assignmentId
        if (!assignmentId) return
        if (!declineReason.trim()) {
            alert('Vui lòng nhập lý do từ chối')
            return
        }
        try {
            setProcessingAction(true)
            await notificationUserAPI.declineAssignment(String(assignmentId), { reason: declineReason })
            fetchNotifications()
            setSelectedNotification(null)
            setAssignmentStatus(null)
            setAssignmentAssigneeName(null)
            setDeclineReason('')
        } catch (err) {
            console.error('Error declining assignment', err)
        } finally {
            setProcessingAction(false)
        }
    }

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                >
                    <Bell className="w-5 h-5" />
                    {(generalUnreadCount + assignmentUnreadCount) > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {(generalUnreadCount + assignmentUnreadCount) > 9 ? '9+' : (generalUnreadCount + assignmentUnreadCount)}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Thông báo</h3>
                                <div className="flex items-center gap-2">
                                    {(activeTab === 'general' ? generalUnreadCount : assignmentUnreadCount) > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                            disabled={loading}
                                        >
                                            Đánh dấu tất cả đã đọc
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex border-b">
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    Thông báo chung
                                    {generalUnreadCount > 0 && (
                                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                            {generalUnreadCount > 9 ? '9+' : generalUnreadCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assignments'
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    Thông báo giao việc
                                    {assignmentUnreadCount > 0 && (
                                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                            {assignmentUnreadCount > 9 ? '9+' : assignmentUnreadCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <p>Đang tải thông báo...</p>
                                </div>
                            ) : (activeTab === 'general' ? generalNotifications : assignmentNotifications).length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p>
                                        {activeTab === 'general'
                                            ? 'Không có thông báo chung nào'
                                            : 'Không có thông báo giao việc nào'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {(activeTab === 'general' ? generalNotifications : assignmentNotifications).map((notification) => {
                                        const isRead = notification.isRead
                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${!isRead ? 'bg-blue-50' : 'bg-white'
                                                    } ${getTypeColor(notification.type)}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {getNotificationIcon(notification.type)}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                                {getTypeLabel(notification.type)}
                                                            </span>
                                                            {!isRead && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                            )}
                                                        </div>
                                                        <p className="font-medium text-sm text-gray-900 mb-1">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 line-clamp-2">
                                                            {notification.content}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xs text-gray-500">
                                                                {formatDistanceToNow(new Date(notification.createdAt), {
                                                                    addSuffix: true,
                                                                    locale: vi
                                                                })}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {notification.author?.hoten || notification.author?.manv || 'System'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 border-t bg-gray-50">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        // Navigate to full notifications page if exists
                                    }}
                                    className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Xem tất cả thông báo
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {getNotificationIcon(selectedNotification.type)}
                                    <span className="text-sm px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                        {getTypeLabel(selectedNotification.type)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedNotification(null)
                                        setAssignmentStatus(null)
                                        setAssignmentAssigneeName(null)
                                        setDeclineReason('')
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                                {selectedNotification.title}
                            </h2>

                            <div className="prose prose-sm max-w-none mb-4">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {selectedNotification.content}
                                </p>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Người gửi:</span>
                                    <span className="text-gray-900">
                                        {selectedNotification.author?.hoten || selectedNotification.author?.manv || 'System'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Thời gian:</span>
                                    <span className="text-gray-900">
                                        {formatDistanceToNow(new Date(selectedNotification.createdAt), {
                                            addSuffix: true,
                                            locale: vi
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Loại:</span>
                                    <span className="text-gray-900">
                                        {getTypeLabel(selectedNotification.type)}
                                    </span>
                                </div>
                            </div>

                            {/* Assignment actions (if notification has assignment meta and status is pending) */}
                            {selectedNotification.userMeta?.assignmentId && (
                                <div className="p-4 border-t space-y-3">
                                    {assignmentStatus === 'pending' ? (
                                        <>
                                            <div className="text-sm text-gray-700">Bạn có muốn nhận công việc này?</div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleAccept}
                                                    disabled={processingAction}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                                                >
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    onClick={() => setDeclineReason('')}
                                                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm"
                                                    disabled={processingAction}
                                                >
                                                    Chuẩn bị từ chối
                                                </button>
                                            </div>

                                            {/* Decline area */}
                                            <div>
                                                <textarea
                                                    value={declineReason}
                                                    onChange={(e) => setDeclineReason(e.target.value)}
                                                    placeholder="Lý do từ chối (nếu có)"
                                                    className="w-full border rounded-md p-2 text-sm"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end mt-2 gap-2">
                                                    <button
                                                        onClick={handleDecline}
                                                        disabled={processingAction}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : assignmentStatus === 'accepted' ? (
                                        <div className="text-sm text-green-700 font-medium">
                                            ✅ {assignmentAssigneeName ? `${assignmentAssigneeName} đã chấp nhận công việc này` : 'Đã chấp nhận công việc này'}
                                        </div>
                                    ) : assignmentStatus === 'declined' ? (
                                        <div className="text-sm text-red-700 font-medium">
                                            ❌ {assignmentAssigneeName ? `${assignmentAssigneeName} đã từ chối công việc này` : 'Đã từ chối công việc này'}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500">
                                            Đang tải trạng thái...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}