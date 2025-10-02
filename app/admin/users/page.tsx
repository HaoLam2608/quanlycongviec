"use client"
import { useState } from "react"
import Modal from "@/components/admin/Modal"
import { UserPlus, Search, Edit, Trash2 } from "lucide-react"

export default function UsersPage() {
    const [openModal, setOpenModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const users = [
        {
            name: "Nguyễn Văn A",
            email: "a@example.com",
            role: "Nhân viên",
            status: "Hoạt động",
            avatar: "A",
        },
        {
            name: "Trần Thị B",
            email: "b@example.com",
            role: "Admin",
            status: "Hoạt động",
            avatar: "B",
        },
        {
            name: "Lê Văn C",
            email: "c@example.com",
            role: "Nhân viên",
            status: "Tạm khóa",
            avatar: "C",
        },
    ]

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
                                <th className="text-left p-4 text-sm font-semibold text-foreground">Email</th>
                                <th className="text-left p-4 text-sm font-semibold text-foreground">Vai trò</th>
                                <th className="text-left p-4 text-sm font-semibold text-foreground">Trạng thái</th>
                                <th className="text-right p-4 text-sm font-semibold text-foreground">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                                                {user.avatar}
                                            </div>
                                            <span className="font-medium text-foreground">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{user.email}</td>
                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === "Admin"
                                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                    : "bg-blue-100 text-blue-700 border border-blue-200"
                                                }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === "Hoạt động"
                                                    ? "bg-green-100 text-green-700 border border-green-200"
                                                    : "bg-red-100 text-red-700 border border-red-200"
                                                }`}
                                        >
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                                <Edit size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Thêm người dùng mới">
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tên đầy đủ</label>
                        <input
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Nhập tên đầy đủ"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Vai trò</label>
                        <select className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                            <option>Admin</option>
                            <option>Nhân viên</option>
                            <option>Khách</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105"
                    >
                        Tạo người dùng
                    </button>
                </form>
            </Modal>
        </div>
    )
}
