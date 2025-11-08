"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderKanban, ArrowRight, User } from "lucide-react"
import { fetchProjectsByManager } from "@/axios/api"

export default function PMProjectsPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                // read manager identifier from localStorage (manv)
                const manv = typeof window !== "undefined" ? localStorage.getItem('manv') : null
                if (!manv) {
                    setProjects([])
                    return
                }
                const data = await fetchProjectsByManager(manv)
                setProjects(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error("Lỗi khi tải dự án:", err)
                setProjects([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003D82] to-[#0052A3] flex items-center justify-center shadow-lg">
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        Dự án của tôi
                    </h1>
                    <p className="text-muted-foreground">Danh sách các dự án bạn là người quản lý</p>
                </div>
            </div>

            {loading ? (
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
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
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
                                            Quản lý: <span className="font-medium text-foreground">{project.nguoiDamNhan?.hoten || 'Chưa phân công'}</span>
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
        </div>
    )
}
