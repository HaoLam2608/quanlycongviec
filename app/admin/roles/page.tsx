"use client"
import { useState, useEffect } from "react"
import RoleForm from "@/components/admin/RoleForm"
import PermissionForm from "@/components/admin/PermissionForm"
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react"
import { deleteRole, getRoles, roleAPI } from "@/axios/adminApi"
import { showConfirm, showSuccess, showError } from "@/lib/notifications"

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
    const [openPermModal, setOpenPermModal] = useState(false)
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
        const confirmed = await showConfirm('Bạn có chắc chắn muốn xóa vai trò này?')
        if (confirmed) {
            try {
                await deleteRole(roleId)
                showSuccess('Đã xóa vai trò thành công!')
                loadRoles()
            } catch (error: any) {
                console.error('Delete role error:', error)
                showError(error.message || 'Có lỗi xảy ra khi xóa vai trò')
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
                <button
                    onClick={() => setOpenPermModal(true)}
                    className="ml-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-200 transition-all"
                >
                    Thêm quyền
                </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-secondary"></div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-secondary"></div>
                                        <div className="w-8 h-8 rounded-lg bg-secondary"></div>
                                    </div>
                                </div>
                                <div className="h-6 w-32 bg-secondary rounded mb-2"></div>
                                <div className="h-4 w-full bg-secondary rounded mb-4"></div>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="h-4 w-24 bg-secondary rounded"></div>
                                    <div className="h-8 w-12 bg-secondary rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </>
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

            <PermissionForm isOpen={openPermModal} onClose={() => setOpenPermModal(false)} onSuccess={() => { setOpenPermModal(false); loadRoles(); }} />
        </div>
    )
}
