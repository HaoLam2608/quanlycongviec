"use client"
import { useEffect, useState } from "react"
import type React from "react"

import Link from "next/link"
import { FolderKanban, ArrowRight, Clock, Plus, User } from "lucide-react"
import Modal from "@/components/admin/Modal"
import { createProject, fetchProjectsByManager, fetchUsers } from "@/axios/api"

export default function PMProjectsPage() {
    const formatDate = (value: any) => {
        if (!value) return "—"
        try {
            const d = new Date(value)
            if (isNaN(d.getTime())) return "—"
            return d.toLocaleDateString("vi-VN")
        } catch (e) {
            return "—"
        }
    }

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        managerId: "",
        startDate: "",
        endDate: "",
        status: "chua_bat_dau",
    })

    const [users, setUsers] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        const load = async () => {
            setLoading(true)
            try {
                const manv = typeof window !== "undefined" ? localStorage.getItem('manv') : null
                if (!manv) {
                    setProjects([])
                    setLoading(false)
                    return
                }
                const [projectsData, usersData] = await Promise.all([
                    fetchProjectsByManager(manv),
                    fetchUsers()
                ])
                setProjects(Array.isArray(projectsData) ? projectsData : [])
                setUsers(usersData)
            } catch (err) {
                console.error("Lỗi khi tải dự án:", err)
                setProjects([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [isClient])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            await createProject({
                tenduan: formData.name,
                mota: formData.description,
                ngaybatdau: formData.startDate,
                ngayketthuc: formData.endDate,
                status: formData.status,
                userId: formData.managerId
            })
            // Reload projects
            const manv = typeof window !== "undefined" ? localStorage.getItem('manv') : null
            if (manv) {
                const data = await fetchProjectsByManager(manv)
                setProjects(Array.isArray(data) ? data : [])
            }
            setIsCreateModalOpen(false)
            setFormData({ name: "", description: "", managerId: "", startDate: "", endDate: "", status: "chua_bat_dau" })
        } catch (err) {
            console.error("Lỗi tạo dự án:", err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003D82] to-[#0052A3] flex items-center justify-center shadow-lg">
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        Quản lý dự án
                    </h1>
                    <p className="text-muted-foreground">Theo dõi tiến độ và quản lý các dự án của bạn</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#003D82] to-[#0052A3] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Tạo dự án mới
                </button>
            </div>

            {/* Projects Grid */}
            {(!isClient || loading) ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                                        <div className="h-5 bg-gray-200 rounded-full w-24 animate-pulse"></div>
                                    </div>
                                    <div className="h-7 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                                </div>
                                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="p-6 bg-card border border-border rounded-2xl">Chưa có dự án được phân công cho bạn.</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map((project: any) => (
                        <Link key={project.id} href={`/manager/projects/${project.id}`}>
                            <div className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                                                PJ-{project.id}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === "da_hoan_thanh"
                                                    ? "bg-green-100 text-green-700 border border-green-200"
                                                    : project.status === "dang_chay"
                                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                        : project.status === "da_dong"
                                                            ? "bg-gray-200 text-gray-700 border border-gray-300"
                                                            : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                                    }`}
                                            >
                                                {project.status === "da_hoan_thanh"
                                                    ? "Đã hoàn thành"
                                                    : project.status === "dang_chay"
                                                        ? "Đang chạy"
                                                        : project.status === "da_dong"
                                                            ? "Đã đóng"
                                                            : "Chưa bắt đầu"}
                                            </span>

                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-2">{project.tenduan}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <User size={14} />
                                            Quản lý:{" "}
                                            <span className="font-medium text-foreground">
                                                {project.nguoiDamNhan?.hoten || "Chưa phân công"}
                                            </span>
                                        </p>
                                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span>Bắt đầu: <span className="font-medium text-foreground">{formatDate(project.ngaybatdau)}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span>Kết thúc: <span className="font-medium text-foreground">{formatDate(project.ngayketthuc)}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">{project.mota}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo dự án mới">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Tên dự án *</label>
                        <input
                            type="text"
                            placeholder="Nhập tên dự án..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Mô tả dự án</label>
                        <textarea
                            placeholder="Mô tả chi tiết về dự án..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Người quản lý dự án *</label>
                        <select
                            value={formData.managerId}
                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            required
                        >
                            <option value="">-- Chọn người quản lý --</option>
                            {loading ? (
                                <option disabled>Đang tải danh sách người dùng...</option>
                            ) : Array.isArray(users) && users.length > 0 ? (
                                users
                                    .filter((u: any) => {
                                        return u.role?.name === 'admin' || u.role?.name === 'manager';
                                    })
                                    .map((u: any) => (
                                        <option key={u.id} value={u.id}>
                                            {u.hoten} ({u.manv}) - {u.chucvu}
                                        </option>
                                    ))
                            ) : (
                                <option disabled>Không có dữ liệu người dùng</option>
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày bắt đầu *</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày kết thúc *</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                required
                                min={formData.startDate} // Không cho chọn ngày kết thúc trước ngày bắt đầu
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#003D82] to-[#0052A3] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo dự án'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
