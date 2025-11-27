'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Circle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { notificationUserAPI, type Notification } from '@/axios/notificationAPI'
import { useRouter } from 'next/navigation'

interface NotificationBellProps {
    userRole: 'admin' | 'manager' | 'member' | 'teamleader'
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

            // no task-specific fetch — we keep only general and assignment notifications
        } catch (error: any) {
            console.error('❌ Error fetching notifications:', error)
            // Gracefully handle errors without crashing the app
            if (error?.response?.status === 403) {
                console.warn('⚠️ Permission denied for notifications - user may not have access')
            } else if (error?.response?.status === 401) {
                console.warn('⚠️ Authentication failed for notifications - token may be invalid')
            } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
                console.warn('⚠️ Backend server not running - notifications unavailable')
            }
            setNotifications([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Add delay to ensure token is set after login redirect
        const timer = setTimeout(() => {
            // Check if user is authenticated before fetching
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
            if (token) {
                fetchNotifications()
            } else {
                console.warn('⚠️ No token found, skipping notification fetch')
                setLoading(false)
            }
        }, 1200) // Increased delay to ensure token is ready

        return () => clearTimeout(timer)
    }, [])

    // router for navigation when clicking task notifications
    const router = useRouter()

    // Calculate unread count using isRead from server (only general + assignments)
    const unreadCount = notifications.filter(n => !n.isRead).length

    // Helper: robustly detect assignment notifications across possible meta shapes
    // Only include assignments where current user is the assignee
    const isAssignmentNotification = (n: any) => {
        const meta = n.userMeta || n.meta || (n.userMeta && n.userMeta.meta) || null;
        if (!meta) return false;
        // common keys: assignmentId, assignment_id, or nested assignment object
        if (meta.assignmentId || meta.assignment_id) return true;
        if (meta.assignment && (meta.assignment.id || meta.assignmentId)) return true;
        return false;
    }

    // If backend sometimes omits meta but uses a title/content convention, also detect by text
    // Only include assignments where current user is the assignee (not manager assignments)
    const looksLikeAssignmentByText = (n: any) => {
        try {
            const title = (n.title || '').toString().toLowerCase();
            const content = (n.content || '').toString().toLowerCase();
            // Only include direct assignment to user, not manager/approval requests
            if (title.includes('giao việc') || title.includes('đề nghị giao việc')) {
                // Exclude notifications for manager approvals
                if (!title.includes('yêu cầu') && !content.includes('yêu cầu')) return true;
            }
        } catch (err) {
            // ignore
        }
        return false;
    }

    // Separate notifications into general and assignments using the robust detector
    // Filter out request-to-join notifications from assignments tab (those are for manager approvals)
    const assignmentNotifications = notifications.filter(n => {
        const isAssignment = isAssignmentNotification(n) || looksLikeAssignmentByText(n);
        if (!isAssignment) return false;

        // Exclude request-to-join notifications (requestToJoin metadata)
        const meta = n.userMeta || n.meta || {};
        if (meta.requestToJoin) return false;

        return true;
    })
    // General notifications: only show announcement and system types
    const generalNotifications = notifications.filter(n => {
        const isAssignment = isAssignmentNotification(n) || looksLikeAssignmentByText(n);
        if (isAssignment) return false;
        // Only include announcement and system types
        return n.type === 'announcement' || n.type === 'system';
    })
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
            // Pick unread notifications based on active tab
            let unreadNotifications: Notification[] = []
            if (activeTab === 'general') unreadNotifications = generalNotifications.filter(n => !n.isRead)
            else if (activeTab === 'assignments') unreadNotifications = assignmentNotifications.filter(n => !n.isRead)

            const promises = unreadNotifications.map(n => notificationUserAPI.markAsRead(n.id))
            await Promise.all(promises)

            // Update local state for both lists
            setNotifications(prev =>
                prev.map(n => {
                    const shouldMarkRead = unreadNotifications.some(un => un.id === n.id)
                    return shouldMarkRead ? { ...n, isRead: true } : n
                })
            )
            // no taskNotifications to update
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id)
        }

        // If this is an assignment notification, fetch assignment status and show modal
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
            // Show the modal for this assignment notification
            setSelectedNotification(notification)
            return
        }

        // For non-assignment notifications with task metadata, redirect to appropriate tasks page
        const relatedTaskId = notification.userMeta?.taskId || notification.userMeta?.relatedTaskId
        const relatedSubtaskId = notification.userMeta?.subtaskId || notification.userMeta?.relatedSubtaskId
        const relatedCommentId = notification.userMeta?.relatedId || notification.userMeta?.commentId

        if (relatedTaskId || relatedSubtaskId) {
            const params = new URLSearchParams()
            if (relatedTaskId) params.set('taskId', String(relatedTaskId))
            if (relatedSubtaskId) params.set('subtaskId', String(relatedSubtaskId))
            if (relatedCommentId) params.set('commentId', String(relatedCommentId))
            // navigate and close the panel
            setIsOpen(false)
            // Route based on user role
            const baseRoute = userRole === 'admin' ? '/admin' :
                userRole === 'manager' ? '/manager' :
                    userRole === 'teamleader' ? '/teamlead' : '/member'
            router.push(`${baseRoute}/tasks?${params.toString()}`)
            return
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

    // Manager accepts a member's request-to-join
    const handleAcceptRequest = async () => {
        if (!selectedNotification) return
        const meta: any = (selectedNotification as any).userMeta || (selectedNotification as any).meta
        if (!meta) return
        try {
            setProcessingAction(true)
            const payload: any = {
                taskId: meta.taskId,
                subtaskId: meta.subtaskId,
                requesterId: meta.requesterId
            }
            await notificationUserAPI.acceptRequest(payload)
            // refresh and close
            fetchNotifications()
            setSelectedNotification(null)
            setDeclineReason('')
        } catch (err) {
            console.error('Error accepting request-to-join', err)
        } finally {
            setProcessingAction(false)
        }
    }

    const handleDeclineRequest = async () => {
        if (!selectedNotification) return
        const meta: any = (selectedNotification as any).userMeta || (selectedNotification as any).meta
        if (!meta) return
        if (!declineReason.trim()) {
            alert('Vui lòng nhập lý do từ chối')
            return
        }
        try {
            setProcessingAction(true)
            const payload: any = {
                taskId: meta.taskId,
                subtaskId: meta.subtaskId,
                requesterId: meta.requesterId,
                reason: declineReason
            }
            await notificationUserAPI.declineRequest(payload)
            fetchNotifications()
            setSelectedNotification(null)
            setDeclineReason('')
        } catch (err) {
            console.error('Error declining request-to-join', err)
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
                    id="notification-bell-button"
                >
                    <Bell className="w-5 h-5" />
                    {(generalUnreadCount + assignmentUnreadCount) > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {(generalUnreadCount + assignmentUnreadCount) > 9 ? '9+' : (generalUnreadCount + assignmentUnreadCount)}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="fixed right-4 top-16 w-96 bg-white rounded-xl shadow-2xl border z-[9999] max-h-[70vh] overflow-hidden ring-1 ring-black/5">
                        <div className="p-3.5 border-b bg-white/60 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-900">Thông báo</h3>
                                    <span className="text-xs text-gray-500">{unreadCount} chưa đọc</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {((activeTab === 'general' ? generalUnreadCount : assignmentUnreadCount)) > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-100 hover:bg-blue-100"
                                            disabled={loading}
                                        >
                                            Đánh dấu đã đọc
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        aria-label="Đóng thông báo"
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="mt-3 flex rounded-md overflow-hidden bg-gray-50">
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'general'
                                        ? 'bg-white text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-100'
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
                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'assignments'
                                        ? 'bg-white text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Công việc được giao
                                    {assignmentUnreadCount > 0 && (
                                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                            {assignmentUnreadCount > 9 ? '9+' : assignmentUnreadCount}
                                        </span>
                                    )}
                                </button>
                                {/* 'Công việc' tab removed - we keep only general + assignment notifications */}
                            </div>
                        </div>

                        <div className="max-h-[55vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                                    <p>Đang tải thông báo...</p>
                                </div>
                            ) : activeNotifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium text-gray-700">Không có thông báo</p>
                                    <p className="text-sm text-gray-500 mt-1">Bạn sẽ nhận được thông báo khi có hoạt động liên quan.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {activeNotifications.map((notification) => {
                                        const isRead = notification.isRead
                                        const displayType = notification.type
                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`flex gap-3 px-4 py-3 items-start hover:bg-gray-50 cursor-pointer transition-colors ${!isRead ? 'bg-blue-50' : 'bg-white'}`}
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${displayType === 'system' ? 'bg-blue-50 text-blue-600' : displayType === 'project' ? 'bg-green-50 text-green-600' : displayType === 'task' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.content}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}</div>
                                                            <div className="text-xs text-gray-400 mt-1">{notification.author?.hoten || notification.author?.manv || 'System'}</div>
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
                                        router.push('/notifications')
                                    }}
                                    className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded"
                                >
                                    Xem tất cả
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Notification Detail Modal */}
            {selectedNotification && (
                <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl ring-1 ring-black/10">
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
                                        {getTypeLabel(selectedNotification.userMeta && selectedNotification.userMeta.relatedType === 'comment' ? 'announcement' : selectedNotification.type)}
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

                            {/* Request-to-join actions (if a member requested to join this task/subtask) */}
                            {/* Removed for manager and teamleader - they should use the approvals page */}
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}