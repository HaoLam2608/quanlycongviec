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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage] = useState(10)

    const [newNotification, setNewNotification] = useState({
        title: "",
        content: "",
        type: "announcement" as 'system' | 'project' | 'task' | 'announcement',
        targetRole: "all" as string,
        status: "draft" as 'draft' | 'published'
    })

    useEffect(() => {
        loadNotifications()
    }, [currentPage, typeFilter, statusFilter])

    // Reset to page 1 when search term changes
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1)
        } else {
            loadNotifications()
        }
    }, [searchTerm])

    const loadNotifications = async () => {
        try {
            setLoading(true)
            const response = await notificationAdminAPI.getAll({
                page: currentPage,
                limit: itemsPerPage,
                type: typeFilter === 'all' ? undefined : typeFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: searchTerm || undefined
            })

            if (response.success) {
                setNotifications(response.data)
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages)
                    setTotalItems(response.pagination.total)
                }
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
        total: totalItems,
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
        <div className="space-y-4 md:space-y-6 p-4 md:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 md:gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-600 flex items-center justify-center">
                            <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white" />
                        </div>
                        Quản lý thông báo
                    </h1>
                    <p className="text-sm md:text-base text-gray-600">Tạo và quản lý thông báo cho toàn bộ hệ thống</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
                <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">Tổng thông báo</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <Bell className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">Đã xuất bản</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{stats.published}</p>
                        </div>
                        <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">Bản nháp</p>
                            <p className="text-xl md:text-2xl font-bold text-yellow-600 mt-1">{stats.draft}</p>
                        </div>
                        <Edit3 className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
                    </div>
                </div>
            </div>

            {/* Filters and Create Button */}
            <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 mb-4 md:mb-8">
                <div className="flex flex-col gap-3 md:gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thông báo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 md:pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="system">Hệ thống</option>
                            <option value="project">Dự án</option>
                            <option value="task">Nhiệm vụ</option>
                            <option value="announcement">Thông báo</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="draft">Bản nháp</option>
                        </select>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg text-sm md:text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            <span>Tạo thông báo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications Table */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thông báo
                                </th>
                                <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loại
                                </th>
                                <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Độ ưu tiên
                                </th>
                                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Đối tượng
                                </th>
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {notifications.map((notification) => (
                                <tr key={notification.id} className="hover:bg-gray-50">
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        <div>
                                            <div className="font-medium text-sm md:text-base text-gray-900 line-clamp-1">{notification.title}</div>
                                            <div className="text-xs md:text-sm text-gray-500 mt-1 max-w-xs line-clamp-1">
                                                {notification.content}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                                            {getTypeIcon(notification.type)}
                                            {notification.type}
                                        </span>
                                    </td>
                                    <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                            {notification.priority}
                                        </span>
                                    </td>
                                    <td className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900 capitalize">{notification.targetAudience}</span>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => togglePublishStatus(notification.id)}
                                                disabled={actionLoading === notification.id}
                                                className={`inline-flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-medium transition-colors ${isPublished(notification)
                                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                    } ${actionLoading === notification.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={isPublished(notification) ? "Click để chuyển về bản nháp" : "Click để xuất bản"}
                                            >
                                                {actionLoading === notification.id ? (
                                                    <>
                                                        <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                                                        <span className="hidden md:inline">Đang xử lý</span>
                                                    </>
                                                ) : isPublished(notification) ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="hidden md:inline">Đã xuất bản</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Edit3 className="w-3 h-3" />
                                                        <span className="hidden md:inline">Bản nháp</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </td>

                                    <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                        <div className="flex items-center text-xs md:text-sm text-gray-900">
                                            <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mr-1" />
                                            {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-1 md:gap-2">
                                            <button
                                                onClick={() => setViewingNotification(notification)}
                                                className="p-1 md:p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded text-xs md:text-sm"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingNotification(notification)}
                                                className="p-1 md:p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs md:text-sm"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="p-1 md:p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded text-xs md:text-sm"
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

                {notifications.length === 0 && (
                    <div className="p-6 md:p-12 text-center">
                        <Bell className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Không có thông báo</h3>
                        <p className="text-sm md:text-base text-gray-500 mb-3 md:mb-4">Tạo thông báo đầu tiên để bắt đầu</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm md:text-base hover:bg-blue-700 transition-colors"
                        >
                            Tạo thông báo
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-3">
                        <div className="text-xs md:text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{notifications.length}</span> / <span className="font-medium">{totalItems}</span> thông báo
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trước
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1.5 text-xs md:text-sm rounded-lg transition-colors ${currentPage === pageNum
                                                    ? 'bg-blue-600 text-white font-medium'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(isCreateModalOpen || editingNotification) && (
                <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-3 md:p-2">
                    <div className="bg-white rounded-lg md:rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
                        <div className="p-3 md:p-4 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                                    {editingNotification ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false)
                                        setEditingNotification(null)
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                                        Tiêu đề *
                                    </label>
                                    <input
                                        type="text"
                                        value={newNotification.title}
                                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập tiêu đề thông báo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                                        Nội dung *
                                    </label>
                                    <textarea
                                        value={newNotification.content}
                                        onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập nội dung thông báo"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Loại thông báo</label>
                                        <select
                                            value={newNotification.type}
                                            onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="system">Hệ thống</option>
                                            <option value="project">Dự án</option>
                                            <option value="task">Nhiệm vụ</option>
                                            <option value="announcement">Thông báo</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Trạng thái</label>
                                        <select
                                            value={newNotification.status}
                                            onChange={(e) => setNewNotification({ ...newNotification, status: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="draft">Bản nháp</option>
                                            <option value="published">Xuất bản</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                                            Đối tượng
                                        </label>
                                        <select
                                            value={newNotification.targetRole}
                                            onChange={(e) => setNewNotification({ ...newNotification, targetRole: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                        <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 md:gap-3">
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setEditingNotification(null)
                                }}
                                className="flex-1 px-4 py-2.5 md:py-2 border border-gray-300 text-gray-700 rounded-lg text-sm md:text-base hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={createNotification}
                                disabled={!newNotification.title || !newNotification.content}
                                className="flex-1 px-4 py-2.5 md:py-2 bg-blue-600 text-white rounded-lg text-sm md:text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
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
                <div className="fixed inset-0 bg-slate-900/0 flex items-center justify-center z-50 p-3 md:p-4 transition-opacity">
                    <div className="bg-white rounded-lg md:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-3 md:p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg md:text-xl font-bold text-gray-900">Chi tiết thông báo</h2>
                                <button
                                    onClick={() => setViewingNotification(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 md:p-6">
                            <div className="space-y-4 md:space-y-6">
                                <div>
                                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{viewingNotification.title}</h3>
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{viewingNotification.content}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Loại</label>
                                        <span className={`inline-flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-medium ${getTypeColor(viewingNotification.type)}`}>
                                            {getTypeIcon(viewingNotification.type)}
                                            {viewingNotification.type}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Độ ưu tiên</label>
                                        <span className={`inline-flex px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-medium ${getPriorityColor(viewingNotification.priority)}`}>
                                            {viewingNotification.priority}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Đối tượng</label>
                                        <span className="text-sm capitalize">{viewingNotification.targetAudience}</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Trạng thái</label>
                                        <span className={`inline-flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-medium ${isPublished(viewingNotification) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                            }`}>
                                            {isPublished(viewingNotification) ? <CheckCircle className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                                            {isPublished(viewingNotification) ? "Đã xuất bản" : "Bản nháp"}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Ngày tạo</label>
                                        <span className="text-sm">{formatDistanceToNow(new Date(viewingNotification.createdAt), { addSuffix: true, locale: vi })}</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Tác giả</label>
                                        <span className="text-sm">{viewingNotification.author?.hoten || viewingNotification.author?.manv || 'System'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 border-t border-gray-200">
                            <button
                                onClick={() => setViewingNotification(null)}
                                className="w-full px-4 py-2.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg text-sm md:text-base hover:bg-gray-200 transition-colors font-medium"
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