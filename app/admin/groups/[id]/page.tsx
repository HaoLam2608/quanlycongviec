
"use client";



import { useEffect, useState } from "react";
import Link from "next/link";
import { groupAPI } from "@/axios/adminApi";
import { fetchProjects } from "@/axios/api";
import { Users, User, FolderKanban } from "lucide-react";

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

    if (loading) return <div className="text-center py-10">Đang tải...</div>;
    if (error || !group) return <div className="text-center py-10 text-red-500">{error || "Không tìm thấy nhóm"}</div>;

    return (
        <div className="max-w-3xl mx-auto py-10 space-y-8">
            <Link href="/admin/groups" className="text-blue-600 hover:underline flex items-center gap-1 mb-2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Quay lại danh sách nhóm
            </Link>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-indigo-900 mb-1">{group.name}</h1>
                        <p className="text-gray-500 text-sm">{group.description || 'Không có mô tả'}</p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex-1">
                        <div className="mb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold text-gray-700">Leader:</span>
                            {group.leader ? (
                                <span className="ml-1 text-indigo-700 font-medium">{group.leader.hoten} <span className="text-xs text-gray-400">({group.leader.manv})</span></span>
                            ) : (
                                <span className="italic text-gray-400 ml-1">Chưa có leader</span>
                            )}
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700 flex items-center gap-2"><Users className="w-5 h-5 text-purple-500" />Thành viên:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {group.members && group.members.length > 0 ? (
                                    group.members.map((m: any) => (
                                        <span key={m.id} className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold border border-indigo-200">
                                            {m.hoten} <span className="ml-1 text-gray-400">({m.manv})</span>
                                        </span>
                                    ))
                                ) : (
                                    <span className="italic text-gray-400">Chưa có thành viên</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <span className="font-semibold text-gray-700 flex items-center gap-2"><FolderKanban className="w-5 h-5 text-green-500" />Dự án đã/đang tham gia:</span>
                        {group.groupProjects && group.groupProjects.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 mt-2">
                                {group.groupProjects.map((gp: any) => {
                                    const project = projects.find((p: any) => p.id === gp.projectId);
                                    return (
                                        <div key={gp.id} className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-indigo-700 truncate" title={project?.tenduan || `Dự án #${gp.projectId}`}>{project?.tenduan || `Dự án #${gp.projectId}`}</span>
                                                {gp.status === 'active' && <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Đang tham gia</span>}
                                                {gp.status === 'completed' && <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">Đã hoàn thành</span>}
                                            </div>
                                            {project?.mota && <div className="text-xs text-gray-500 truncate">{project.mota}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="italic text-gray-400 mt-1">Chưa tham gia dự án nào</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
