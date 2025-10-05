"use client"
import { useState, useEffect } from "react"
import RoleForm from "@/components/admin/RoleForm"
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react"
import { getRoles, roleAPI } from "@/axios/adminApi"

interface Role {
    id: number
    name: string
    description: string
    userCount: number
    permissions: Array<{
        id: number
        name: string
        description: string
    }>
}

export default function RolesPage() {
    const [openModal, setOpenModal] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(false)
    const [editRole, setEditRole] = useState<Role | null>(null)

    useEffect(() => {
        loadRoles()
    }, [])

    const loadRoles = async () => {
        setLoading(true)
        try {
            const data = await getRoles()
            setRoles(data.roles)
        } catch (error: any) {
            console.error('Load roles error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (role: Role) => {
        setEditRole(role)
        setOpenModal(true)
    }

    const handleDelete = async (roleId: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
            try {
                await roleAPI.deleteRole(roleId)
                loadRoles()
            } catch (error: any) {
                console.error('Delete role error:', error)
            }
        }
    }

    

    const handleModalClose = () => {
        setOpenModal(false)
        setEditRole(null)
    }

    const getRoleColor = (index: number) => {
        const colors = [
            "from-purple-500 to-pink-600",
            "from-blue-500 to-indigo-600", 
            "from-orange-500 to-red-600",
            "from-green-500 to-emerald-600",
            "from-yellow-500 to-orange-600",
            "from-teal-500 to-cyan-600"
        ]
        return colors[index % colors.length]
    }

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
                {loading ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                        Đang tải dữ liệu...
                    </div>
                ) : roles.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                        Chưa có vai trò nào
                    </div>
                ) : (
                    roles.map((role, index) => (
                        <div
                            key={role.id}
                            className="relative group bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-sm"
                        >
                            <div className="relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(index)} flex items-center justify-center shadow-md`}
                                    >
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleEdit(role)}
                                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(role.id)}
                                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-2">{role.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{role.description}</p>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users size={16} />
                                        <span className="font-medium">{role.userCount}</span>
                                        <span>người dùng</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {role.permissions.length} quyền
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Role Form Modal */}
            <RoleForm
                isOpen={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setEditRole(null);
                }}
                onSuccess={loadRoles}
                editRole={editRole}
            />
        </div>
    )
}
