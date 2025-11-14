"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { groupAPI } from "@/axios/adminApi";
import { fetchProjects } from "@/axios/api";
import { Users, User, FolderKanban, ArrowLeft, Mail, Calendar, CheckCircle2, Clock } from "lucide-react";

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-lg font-medium text-gray-600">Đang tải thông tin nhóm...</p>
                </div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-12 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Lỗi</h2>
                    <p className="text-gray-600 mb-6">{error || "Không tìm thấy nhóm"}</p>
                    <Link
                        href="/manager/groups"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    const activeProjects = group.groupProjects?.filter((gp: any) => gp.status === 'active') || [];
    const completedProjects = group.groupProjects?.filter((gp: any) => gp.status === 'completed') || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Back Button */}
                <Link
                    href="/manager/groups"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-md border border-gray-100"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách nhóm
                </Link>

                {/* Group Header Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 p-8">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-4xl font-extrabold text-white">{group.name}</h1>
                                    {group.status === 'closed' && (
                                        <span className="px-4 py-1.5 bg-gray-700 text-white rounded-xl text-sm font-semibold">
                                            Đã đóng
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/90 text-lg">{group.description || 'Không có mô tả'}</p>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                                        <Users className="w-4 h-4 text-white" />
                                        <span className="text-white font-semibold">{group.members?.length || 0} thành viên</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                                        <FolderKanban className="w-4 h-4 text-white" />
                                        <span className="text-white font-semibold">{activeProjects.length} dự án</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leader Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-gray-900">Leader</h2>
                        </div>
                        {group.leader ? (
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <span className="text-xl font-bold text-white">
                                        {group.leader.hoten.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{group.leader.hoten}</div>
                                    <div className="text-sm text-gray-500 truncate">{group.leader.manv}</div>
                                    {group.leader.email && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{group.leader.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                                <User className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-400 italic">Chưa có leader</p>
                            </div>
                        )}
                    </div>

                    {/* Members Section */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-gray-900">Thành viên</h2>
                            <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {group.members?.length || 0}
                            </span>
                        </div>
                        {group.members && group.members.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                                {group.members.map((m: any) => (
                                    <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                            <span className="text-sm font-bold text-white">
                                                {m.hoten.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 text-sm truncate">{m.hoten}</div>
                                            <div className="text-xs text-gray-500 truncate">{m.manv}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-gray-200">
                                <Users className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-400 italic">Chưa có thành viên</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Projects Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <FolderKanban className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold text-gray-900">Dự án</h2>
                    </div>

                    {/* Active Projects */}
                    {activeProjects.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-green-600" />
                                <h3 className="text-sm font-semibold text-gray-700">Đang tham gia ({activeProjects.length})</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeProjects.map((gp: any) => {
                                    const project = projects.find((p: any) => p.id === gp.projectId);
                                    return (
                                        <div key={gp.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-all">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                    <FolderKanban className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-1" title={project?.tenduan}>
                                                        {project?.tenduan || `Dự án #${gp.projectId}`}
                                                    </h4>
                                                    {project?.mota && (
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{project.mota}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                                            Đang hoạt động
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Completed Projects */}
                    {completedProjects.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-gray-600" />
                                <h3 className="text-sm font-semibold text-gray-700">Đã hoàn thành ({completedProjects.length})</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {completedProjects.map((gp: any) => {
                                    const project = projects.find((p: any) => p.id === gp.projectId);
                                    return (
                                        <div key={gp.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center flex-shrink-0 shadow-md">
                                                    <FolderKanban className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-1" title={project?.tenduan}>
                                                        {project?.tenduan || `Dự án #${gp.projectId}`}
                                                    </h4>
                                                    {project?.mota && (
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{project.mota}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-2 py-0.5 bg-gray-500 text-white rounded text-xs font-semibold flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Hoàn thành
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* No Projects */}
                    {activeProjects.length === 0 && completedProjects.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-gray-200">
                            <FolderKanban className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-400 italic">Nhóm chưa tham gia dự án nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
