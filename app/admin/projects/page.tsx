"use client"
import { useEffect, useState } from "react"
import type React from "react"

import Link from "next/link"
import { FolderKanban, ArrowRight, Clock, CheckCircle2, Plus, User, Search, Filter } from "lucide-react"
import Modal from "@/components/admin/Modal"
import { createProject, fetchProjects, fetchUsers } from "@/axios/api"
import api from "@/axios/config"

export default function ProjectsPage() {
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

    // Pagination and filter state
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage] = useState(6)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        const loadData = async () => {
            try {
                setLoading(true)
                const [projectsResponse, usersData] = await Promise.all([
                    api.get("/duan/getAll", {
                        params: {
                            page: currentPage,
                            limit: itemsPerPage,
                            search: searchTerm || undefined,
                            status: statusFilter === 'all' ? undefined : statusFilter
                        }
                    }),
                    fetchUsers()
                ])

                if (projectsResponse.data.success) {
                    setProjects(projectsResponse.data.data)
                    if (projectsResponse.data.pagination) {
                        setTotalPages(projectsResponse.data.pagination.totalPages)
                        setTotalItems(projectsResponse.data.pagination.total)
                    }
                } else {
                    // Fallback for old API format
                    setProjects(projectsResponse.data)
                }
                setUsers(usersData)
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [isClient, currentPage, statusFilter])

    // Reset to page 1 when search term changes
    useEffect(() => {
        if (!isClient) return;
        if (currentPage !== 1) {
            setCurrentPage(1)
        } else {
            const loadData = async () => {
                try {
                    setLoading(true)
                    const projectsResponse = await api.get("/duan/getAll", {
                        params: {
                            page: 1,
                            limit: itemsPerPage,
                            search: searchTerm || undefined,
                            status: statusFilter === 'all' ? undefined : statusFilter
                        }
                    })

                    if (projectsResponse.data.success) {
                        setProjects(projectsResponse.data.data)
                        if (projectsResponse.data.pagination) {
                            setTotalPages(projectsResponse.data.pagination.totalPages)
                            setTotalItems(projectsResponse.data.pagination.total)
                        }
                    } else {
                        setProjects(projectsResponse.data)
                    }
                } catch (err) {
                    console.error("Lỗi tải dữ liệu:", err)
                } finally {
                    setLoading(false)
                }
            }
            loadData()
        }
    }, [searchTerm])

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
            // Reload với phân trang
            const projectsResponse = await api.get("/duan/getAll", {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: searchTerm || undefined,
                    status: statusFilter === 'all' ? undefined : statusFilter
                }
            })

            if (projectsResponse.data.success) {
                setProjects(projectsResponse.data.data)
                if (projectsResponse.data.pagination) {
                    setTotalPages(projectsResponse.data.pagination.totalPages)
                    setTotalItems(projectsResponse.data.pagination.total)
                }
            }
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

            {/* Search and Filter */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dự án..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="chua_bat_dau">Chưa bắt đầu</option>
                        <option value="dang_chay">Đang chạy</option>
                        <option value="da_hoan_thanh">Đã hoàn thành</option>
                        <option value="da_dong">Đã đóng</option>
                    </select>
                </div>
                {totalItems > 0 && (
                    <div className="mt-3 text-sm text-muted-foreground">
                        Hiển thị <span className="font-medium text-foreground">{projects.length}</span> / <span className="font-medium text-foreground">{totalItems}</span> dự án
                    </div>
                )}
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

            {/* Empty State */}
            {!loading && projects.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
                    <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Không có dự án nào</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Không tìm thấy dự án phù hợp với bộ lọc'
                            : 'Tạo dự án đầu tiên để bắt đầu'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all inline-flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Tạo dự án mới
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            Trang <span className="font-medium text-foreground">{currentPage}</span> / <span className="font-medium text-foreground">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
                                            className={`px-4 py-2 rounded-lg transition-all font-medium ${currentPage === pageNum
                                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                                                    : 'bg-background border border-border hover:bg-secondary'
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
                                className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
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
