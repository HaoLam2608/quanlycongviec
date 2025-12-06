"use client"
import { useState, useEffect } from "react"
import UserFormEnhanced from "@/components/admin/UserFormEnhanced"
import { UserPlus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { getUsers, deleteUser } from "@/axios/adminApi"
import { showConfirm, showSuccess, showError } from "@/lib/notifications"

interface User {
    id: number
    manv: string
    hoten: string
    chucvu: string
    sdt: string
    role: {
        id: number
        name: string
    }
    createdAt: string
    avatarUrl?: string
    avatar?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}
const API_URL = "https://taskhadflow-api.nibies.space"
export default function UsersPage() {
    const [openModal, setOpenModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    })
    const [loading, setLoading] = useState(false)
    const [editUser, setEditUser] = useState<User | null>(null)

    useEffect(() => {
        loadUsers()
    }, [pagination.page, searchQuery])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await getUsers({
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery
            })
            setUsers(data.users)
            setPagination(data.pagination)
        } catch (error: any) {
            console.error('Load users error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: User) => {
        setEditUser(user)
        setOpenModal(true)
    }

    const handleDelete = async (userId: number) => {
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa người dùng này?')
        if (confirmed) {
            try {
                await deleteUser(userId)
                showSuccess('Đã xóa người dùng thành công!')
                loadUsers()
            } catch (error: any) {
                showError(error.message || 'Có lỗi xảy ra khi xóa người dùng')
            }
        }
    }

    const handleModalClose = () => {
        setOpenModal(false)
        setEditUser(null)
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    return (
        <div className="space-y-4 md:space-y-6 p-4 md:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2 md:gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <UserPlus className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white" />
                        </div>
                        Quản lý người dùng
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">Quản lý tất cả người dùng trong hệ thống</p>
                </div>
                <button
                    onClick={() => setOpenModal(true)}
                    className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
                >
                    <UserPlus size={18} className="md:w-5 md:h-5" />
                    <span>Thêm người dùng</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Tìm kiếm người dùng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-card border border-border rounded-lg md:rounded-xl text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                />
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-secondary/50">
                                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-foreground">Người dùng</th>
                                <th className="hidden sm:table-cell text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-foreground">Chức vụ</th>
                                <th className="hidden md:table-cell text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-foreground">Vai trò</th>
                                <th className="hidden lg:table-cell text-left p-3 md:p-4 text-xs md:text-sm font-semibold text-foreground">SĐT</th>
                                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-semibold text-foreground">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // Skeleton loading state
                                <>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="border-b border-border">
                                            <td className="p-3 md:p-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 animate-pulse"></div>
                                                    <div>
                                                        <div className="h-3 md:h-4 bg-gray-200 rounded w-24 md:w-32 mb-1 md:mb-2 animate-pulse"></div>
                                                        <div className="h-2 md:h-3 bg-gray-200 rounded w-16 md:w-20 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell p-3 md:p-4">
                                                <div className="h-3 md:h-4 bg-gray-200 rounded w-20 md:w-24 animate-pulse"></div>
                                            </td>
                                            <td className="hidden md:table-cell p-3 md:p-4">
                                                <div className="h-5 md:h-6 bg-gray-200 rounded-full w-16 md:w-20 animate-pulse"></div>
                                            </td>
                                            <td className="hidden lg:table-cell p-3 md:p-4">
                                                <div className="h-3 md:h-4 bg-gray-200 rounded w-24 md:w-28 animate-pulse"></div>
                                            </td>
                                            <td className="p-3 md:p-4">
                                                <div className="flex items-center justify-end gap-1 md:gap-2">
                                                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                                                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        Không có dữ liệu người dùng
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                    >
                                        <td className="p-3 md:p-4">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 overflow-hidden flex-shrink-0">
                                                    {user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.startsWith('/users/') ? (
                                                        <img
                                                            src={`${API_URL}${user.avatarUrl}`}
                                                            alt={user.hoten}
                                                            className="object-cover w-full h-full"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/placeholder-user.jpg';
                                                            }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src="/placeholder-user.jpg"
                                                            alt={user.hoten}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm md:text-base text-foreground truncate">{user.hoten}</div>
                                                    <div className="text-xs md:text-sm text-muted-foreground truncate">{user.manv}</div>
                                                    {/* Show role and position on mobile */}
                                                    <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                                                        <span className="text-xs text-muted-foreground">{user.chucvu}</span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role?.name === "admin"
                                                                ? "bg-purple-100 text-purple-700"
                                                                : user.role?.name === "manager"
                                                                    ? "bg-orange-100 text-orange-700"
                                                                    : "bg-blue-100 text-blue-700"
                                                                }`}
                                                        >
                                                            {user.role?.name || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell p-3 md:p-4 text-sm md:text-base text-muted-foreground">{user.chucvu}</td>
                                        <td className="hidden md:table-cell p-3 md:p-4">
                                            <span
                                                className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${user.role?.name === "admin"
                                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                    : user.role?.name === "manager"
                                                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                                                        : "bg-blue-100 text-blue-700 border border-blue-200"
                                                    }`}
                                            >
                                                {user.role?.name || "Không xác định"}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell p-3 md:p-4 text-sm md:text-base text-muted-foreground">{user.sdt || 'Chưa có'}</td>
                                        <td className="p-3 md:p-4">
                                            <div className="flex items-center justify-end gap-1 md:gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit size={16} className="md:w-[18px] md:h-[18px]" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1.5 md:p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 mt-4 md:mt-6">
                    <div className="text-xs md:text-sm text-muted-foreground text-center sm:text-left">
                        <span className="hidden sm:inline">Hiển thị {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} kết quả</span>
                        <span className="sm:hidden">{((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="p-1.5 md:p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} className="md:w-5 md:h-5" />
                        </button>
                        <span className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium whitespace-nowrap">
                            Trang {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.pages}
                            className="p-1.5 md:p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} className="md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            )}

            <UserFormEnhanced
                isOpen={openModal}
                onClose={handleModalClose}
                onSuccess={loadUsers}
                editUser={editUser}
            />
        </div>
    )
}
