"use client"
import { useState } from "react"
import Modal from "@/components/admin/Modal"
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react"

export default function RolesPage() {
    const [openModal, setOpenModal] = useState(false)

    const roles = [
        {
            name: "Admin",
            description: "Toàn quyền hệ thống, quản lý tất cả chức năng",
            users: 5,
            color: "from-purple-500 to-pink-600",
        },
        {
            name: "Nhân viên",
            description: "Quyền truy cập cơ bản, quản lý công việc được giao",
            users: 24,
            color: "from-blue-500 to-indigo-600",
        },
        {
            name: "Quản lý dự án",
            description: "Quản lý dự án và phân công công việc cho team",
            users: 8,
            color: "from-orange-500 to-red-600",
        },
        {
            name: "Khách",
            description: "Chỉ xem, không có quyền chỉnh sửa",
            users: 12,
            color: "from-green-500 to-emerald-600",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        Quản lý phân quyền
                    </h1>
                    <p className="text-muted-foreground">Cấu hình vai trò và quyền truy cập trong hệ thống</p>
                </div>
                <button
                    onClick={() => setOpenModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 flex items-center gap-2 hover:scale-105"
                >
                    <Plus size={20} />
                    Thêm vai trò
                </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role, index) => (
                    <div
                        key={index}
                        className="relative group bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-sm"
                    >
                        <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-md`}
                                >
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                        <Edit size={16} />
                                    </button>
                                    <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">{role.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{role.description}</p>

                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Users size={16} />
                                    <span className="font-medium">{role.users}</span>
                                </div>
                                <span className="text-muted-foreground">người dùng</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Thêm vai trò mới">
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tên vai trò</label>
                        <input
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Nhập tên vai trò"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Mô tả</label>
                        <textarea
                            rows={4}
                            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Mô tả vai trò và quyền hạn"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 hover:scale-105"
                    >
                        Tạo vai trò
                    </button>
                </form>
            </Modal>
        </div>
    )
}
