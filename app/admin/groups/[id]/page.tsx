
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { groupAPI } from "@/axios/adminApi";
import { fetchProjects } from "@/axios/api";
import { Users, User, FolderKanban } from "lucide-react";

// Custom scrollbar styles
const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #a855f7, #ec4899);
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #9333ea, #db2777);
    }
`;

export default function GroupDetailPage({ params }: { params: { id: string } }) {
    const groupId = params.id;
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [groupRes, projectsRes] = await Promise.all([
                    groupAPI.getGroup(Number(groupId)),
                    fetchProjects()
                ]);
                setGroup(groupRes.data.group);
                setProjects(projectsRes.duans || projectsRes.projects || projectsRes || []);
            } catch (err: any) {
                setError("Không tìm thấy nhóm hoặc không có quyền xem");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [groupId]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto py-10">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
                            <div className="flex-1">
                                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-96"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-48 bg-gray-200 rounded-xl"></div>
                            <div className="h-48 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error || !group) {
        return (
            <div className="max-w-6xl mx-auto py-10">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-red-800 mb-2">Không tìm thấy nhóm</h2>
                    <p className="text-red-600 mb-6">{error || "Nhóm không tồn tại hoặc bạn không có quyền xem"}</p>
                    <Link href="/admin/groups" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{scrollbarStyles}</style>
            <div className="max-w-6xl mx-auto py-8 space-y-6">
                {/* Back Button */}
            <Link href="/admin/groups" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="group-hover:-translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại danh sách nhóm
            </Link>

            {/* Header Card */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
                <div className="relative z-10 flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border-2 border-white/30">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h1 className="text-4xl font-extrabold mb-2 drop-shadow-lg">{group.name}</h1>
                                <p className="text-white/90 text-lg">{group.description || 'Không có mô tả'}</p>
                            </div>
                            {group.status === 'closed' && (
                                <span className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg">
                                    Đã đóng
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leader Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Trưởng nhóm</h2>
                    </div>
                    {group.leader ? (
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <span className="text-2xl font-bold text-white">
                                    {group.leader.hoten.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-900">{group.leader.hoten}</div>
                                <div className="text-sm text-gray-600 font-mono">Mã NV: {group.leader.manv}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                            <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">Chưa có trưởng nhóm</p>
                        </div>
                    )}
                </div>

                {/* Members Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Thành viên</h2>
                        </div>
                        <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl font-bold text-sm border border-purple-200">
                            {group.members?.length || 0} người
                        </span>
                    </div>
                    {group.members && group.members.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {group.members.map((m: any, index: number) => (
                                <div key={m.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                                        <span className="text-sm font-bold text-white">
                                            {m.hoten.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">{m.hoten}</div>
                                        <div className="text-xs text-gray-600 font-mono">Mã: {m.manv}</div>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-purple-600 border border-purple-200">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">Chưa có thành viên</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Projects Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <FolderKanban className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Dự án tham gia</h2>
                </div>
                {group.groupProjects && group.groupProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.groupProjects.map((gp: any) => {
                            const project = projects.find((p: any) => p.id === gp.projectId);
                            return (
                                <div key={gp.id} className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 hover:border-green-300 hover:shadow-lg transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
                                            <FolderKanban className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-2" title={project?.tenduan || `Dự án #${gp.projectId}`}>
                                                {project?.tenduan || `Dự án #${gp.projectId}`}
                                            </h3>
                                            {project?.mota && (
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{project.mota}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                {gp.status === 'active' ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-md">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white mr-2 animate-pulse"></div>
                                                        Đang tham gia
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-400 text-white">
                                                        Đã hoàn thành
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                        <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa tham gia dự án</h3>
                        <p className="text-sm text-gray-500">Nhóm này chưa được gán vào dự án nào</p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
