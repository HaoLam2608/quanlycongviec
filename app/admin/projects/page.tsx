"use client"
import { useEffect, useState } from "react"
import type React from "react"

import Link from "next/link"
import { FolderKanban, ArrowRight, Clock, CheckCircle2, Plus, User } from "lucide-react"
import Modal from "@/components/admin/Modal"
import { createProject, fetchProjects, fetchUsers } from "@/axios/api"

export default function ProjectsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        managerId: "",
        startDate: "",
        endDate: "",
        status: "Chưa bắt đầu",
    })

    const [users, setUsers] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [projectsData, usersData] = await Promise.all([
                    fetchProjects(),
                    fetchUsers()
                ])
                setProjects(projectsData)
                setUsers(usersData)
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createProject({
                tenduan: formData.name,
                mota: formData.description,
                ngaybatdau: formData.startDate,
                ngayketthuc: formData.endDate,
                status: formData.status,
                userId: formData.managerId
            })
            const data = await fetchProjects()
            setProjects(data)
            setIsCreateModalOpen(false)
            setFormData({ name: "", description: "", managerId: "", startDate: "", endDate: "", status: "Chưa bắt đầu" })
        } catch (err) {
            console.error("Lỗi tạo dự án:", err)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        Quản lý dự án
                    </h1>
                    <p className="text-muted-foreground">Theo dõi tiến độ và quản lý tất cả dự án</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Tạo dự án mới
                </button>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map((project: any) => (
                        <Link key={project.id} href={`/admin/projects/${project.id}`}>
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
                            placeholder="Tên dự án"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Mô tả</label>
                        <textarea
                            placeholder="Mô tả"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Người quản lý dự án *</label>
                        {/* Chọn người đảm nhận */}
                        <select
                            value={formData.managerId}
                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                            className="w-full border rounded p-2"
                            required
                        >
                            <option value="">-- Chọn người đảm nhận --</option>
                            {Array.isArray(users) && users.map((u: any) => (
                                <option key={u.id} value={u.id}>
                                    {u.hoten} ({u.manv})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày bắt đầu *</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Ngày kết thúc *</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full border rounded p-2"
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
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                        >
                            Tạo dự án
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
