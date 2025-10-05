"use client"
import { useState, useEffect } from "react"
import UserForm from "@/components/admin/UserForm"
import { UserPlus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { getUsers, deleteUser } from "@/axios/adminApi"

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
}

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

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
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                await deleteUser(userId)
                loadUsers()
            } catch (error: any) {
                alert(error.message || 'Có lỗi xảy ra khi xóa người dùng')
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        Quản lý người dùng
                    </h1>
                    <p className="text-muted-foreground">Quản lý tất cả người dùng trong hệ thống</p>
                </div>
                <button
                    onClick={() => setOpenModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2 hover:scale-105"
                >
                    <UserPlus size={20} />
                    Thêm người dùng
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                    type="text"
                    placeholder="Tìm kiếm người dùng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                />
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-secondary/50">
                                <th className="text-left p-4 text-sm font-semibold text-foreground">Người dùng</th>
                                <th className="text-left p-4 text-sm font-semibold text-foreground">Chức vụ</th>
                                <th className="text-left p-4 text-sm font-semibold text-foreground">Vai trò</th>
                                <th className="text-left p-4 text-sm font-semibold text-foreground">SĐT</th>
                                <th className="text-right p-4 text-sm font-semibold text-foreground">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
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
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                                                    {user.hoten.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{user.hoten}</div>
                                                    <div className="text-sm text-muted-foreground">{user.manv}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.chucvu}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${user.role.name === "admin"
                                                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                        : user.role.name === "manager"
                                                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                                                            : "bg-blue-100 text-blue-700 border border-blue-200"
                                                    }`}
                                            >
                                                {user.role.name}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.sdt || 'Chưa có'}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 size={18} />
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
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} kết quả
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium">
                            Trang {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.pages}
                            className="p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <UserForm 
                isOpen={openModal}
                onClose={handleModalClose}
                onSuccess={loadUsers}
                editUser={editUser}
            />
        </div>
    )
}
