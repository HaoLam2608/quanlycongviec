"use client"
import { useState, useEffect } from "react"
import {
    Bell,
    Plus,
    Edit3,
    Trash2,
    Eye,
    EyeOff,
    Calendar,
    User,
    AlertCircle,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Send,
    Save,
    X
} from "lucide-react"
import { notificationAdminAPI, type Notification, type CreateNotificationRequest, type UpdateNotificationRequest } from '@/axios/notificationAPI'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
    const [viewingNotification, setViewingNotification] = useState<Notification | null>(null)

    const [newNotification, setNewNotification] = useState({
        title: "",
        content: "",
        type: "announcement" as 'system' | 'project' | 'task' | 'announcement',
        targetRole: "all" as string,
        status: "draft" as 'draft' | 'published'
    })

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        try {
            setLoading(true)
            const response = await notificationAdminAPI.getAll({
                page: 1,
                limit: 50,
                type: typeFilter === 'all' ? undefined : typeFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: searchTerm || undefined
            })

            if (response.success) {
                setNotifications(response.data)
            }
        } catch (error) {
            console.error("Error loading notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "system": return "bg-blue-100 text-blue-800"
            case "project": return "bg-green-100 text-green-800"
            case "task": return "bg-orange-100 text-orange-800"
            case "announcement": return "bg-purple-100 text-purple-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "bg-red-100 text-red-800"
            case "high": return "bg-orange-100 text-orange-800"
            case "medium": return "bg-yellow-100 text-yellow-800"
            case "low": return "bg-green-100 text-green-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "system": return <Bell className="w-4 h-4" />
            case "project": return <CheckCircle className="w-4 h-4" />
            case "task": return <AlertCircle className="w-4 h-4" />
            case "announcement": return <Bell className="w-4 h-4" />
            default: return <Bell className="w-4 h-4" />
        }
    }

    // Helper function to check if notification is published
    const isPublished = (notification: Notification) => notification.status === 'published'

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === "all" || notification.type === typeFilter
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "published" && notification.status === "published") ||
            (statusFilter === "draft" && notification.status === "draft")

        return matchesSearch && matchesType && matchesStatus
    })

    const createNotification = async () => {
        try {
            const notificationData: CreateNotificationRequest = {
                title: newNotification.title,
                content: newNotification.content,
                type: newNotification.type as 'system' | 'project' | 'task' | 'announcement',
                targetRole: [newNotification.targetRole]
            }

            const response = await notificationAdminAPI.create(notificationData)

            if (response.success) {
                // If status is published, publish it immediately
                if (newNotification.status === 'published') {
                    await notificationAdminAPI.toggleStatus(response.data.id, 'publish')
                }

                await loadNotifications() // Refresh the list
                setIsCreateModalOpen(false)
                setNewNotification({
                    title: "",
                    content: "",
                    type: "announcement",
                    targetRole: "all",
                    status: "draft"
                })
                alert("Thông báo đã được tạo thành công!")
            }
        } catch (error) {
            console.error("Error creating notification:", error)
            alert("Có lỗi xảy ra khi tạo thông báo!")
        }
    }

    const togglePublishStatus = async (id: string) => {
        try {
            setActionLoading(id)
            const notification = notifications.find(n => n.id === id)
            if (!notification) return

            const action = notification.status === 'published' ? 'unpublish' : 'publish'
            const confirmMessage = action === 'publish'
                ? 'Bạn có chắc chắn muốn xuất bản thông báo này? Tất cả người dùng sẽ nhận được thông báo.'
                : 'Bạn có chắc chắn muốn hủy xuất bản thông báo này?'

            if (!confirm(confirmMessage)) return

            const response = await notificationAdminAPI.toggleStatus(id, action)

            if (response.success) {
                await loadNotifications() // Refresh the list
                alert(`Thông báo đã được ${action === 'publish' ? 'xuất bản' : 'hủy xuất bản'} thành công!`)
            }
        } catch (error) {
            console.error("Error toggling publish status:", error)
            alert("Có lỗi xảy ra khi thay đổi trạng thái thông báo!")
        } finally {
            setActionLoading(null)
        }
    }

    const deleteNotification = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
            try {
                const response = await notificationAdminAPI.delete(id)
                if (response.success) {
                    await loadNotifications() // Refresh the list
                    alert("Thông báo đã được xóa!")
                }
            } catch (error) {
                console.error("Error deleting notification:", error)
                alert("Có lỗi xảy ra khi xóa thông báo!")
            }
        }
    }

    const stats = {
        total: notifications.length,
        published: notifications.filter(n => n.status === "published").length,
        draft: notifications.filter(n => n.status === "draft").length
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông báo...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý thông báo</h1>
                <p className="text-gray-600">Tạo và quản lý thông báo cho toàn bộ hệ thống</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Tổng thông báo</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <Bell className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Đã xuất bản</p>
                            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Bản nháp</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                        </div>
                        <Edit3 className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>


            </div>

            {/* Filters and Create Button */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm thông báo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="system">Hệ thống</option>
                            <option value="project">Dự án</option>
                            <option value="task">Nhiệm vụ</option>
                            <option value="announcement">Thông báo</option>
                        </select>                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="draft">Bản nháp</option>
                        </select>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Tạo thông báo
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thông báo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loại
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Độ ưu tiên
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Đối tượng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredNotifications.map((notification) => (
                                <tr key={notification.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{notification.title}</div>
                                            <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                                {notification.content}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                                            {getTypeIcon(notification.type)}
                                            {notification.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                            {notification.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900 capitalize">{notification.targetAudience}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => togglePublishStatus(notification.id)}
                                                disabled={actionLoading === notification.id}
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${isPublished(notification)
                                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                    } ${actionLoading === notification.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={isPublished(notification) ? "Click để chuyển về bản nháp" : "Click để xuất bản"}
                                            >
                                                {actionLoading === notification.id ? (
                                                    <>
                                                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                                        Đang xử lý...
                                                    </>
                                                ) : isPublished(notification) ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Đã xuất bản
                                                    </>
                                                ) : (
                                                    <>
                                                        <Edit3 className="w-3 h-3" />
                                                        Bản nháp
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                                            {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setViewingNotification(notification)}
                                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingNotification(notification)}
                                                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                                title="Xóa thông báo"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredNotifications.length === 0 && (
                    <div className="p-12 text-center">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông báo</h3>
                        <p className="text-gray-500 mb-4">Tạo thông báo đầu tiên để bắt đầu</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tạo thông báo
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(isCreateModalOpen || editingNotification) && (
                <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingNotification ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false)
                                        setEditingNotification(null)
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề *
                                    </label>
                                    <input
                                        type="text"
                                        value={newNotification.title}
                                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập tiêu đề thông báo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nội dung *
                                    </label>
                                    <textarea
                                        value={newNotification.content}
                                        onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                                        rows={5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập nội dung thông báo"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại thông báo</label>
                                        <select
                                            value={newNotification.type}
                                            onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="system">Hệ thống</option>
                                            <option value="project">Dự án</option>
                                            <option value="task">Nhiệm vụ</option>
                                            <option value="announcement">Thông báo</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                        <select
                                            value={newNotification.status}
                                            onChange={(e) => setNewNotification({ ...newNotification, status: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="draft">Bản nháp</option>
                                            <option value="published">Xuất bản</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Đối tượng
                                        </label>
                                        <select
                                            value={newNotification.targetRole}
                                            onChange={(e) => setNewNotification({ ...newNotification, targetRole: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">Tất cả</option>
                                            <option value="admin">Admin</option>
                                            <option value="manager">Manager</option>
                                            <option value="member">Member</option>
                                        </select>
                                    </div>


                                </div>


                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setEditingNotification(null)
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={createNotification}
                                disabled={!newNotification.title || !newNotification.content}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {editingNotification ? "Cập nhật" : "Tạo thông báo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewingNotification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Chi tiết thông báo</h2>
                                <button
                                    onClick={() => setViewingNotification(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{viewingNotification.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{viewingNotification.content}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(viewingNotification.type)}`}>
                                            {getTypeIcon(viewingNotification.type)}
                                            {viewingNotification.type}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(viewingNotification.priority)}`}>
                                            {viewingNotification.priority}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng</label>
                                        <span className="capitalize">{viewingNotification.targetAudience}</span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isPublished(viewingNotification) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                            }`}>
                                            {isPublished(viewingNotification) ? <CheckCircle className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                                            {isPublished(viewingNotification) ? "Đã xuất bản" : "Bản nháp"}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                                        <span>{formatDistanceToNow(new Date(viewingNotification.createdAt), { addSuffix: true, locale: vi })}</span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                                        <span>{viewingNotification.author?.hoten || viewingNotification.author?.manv || 'System'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setViewingNotification(null)}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}