"use client";
import { useEffect, useState } from 'react';
import { Plus, Users, FolderKanban, RefreshCw, Edit } from 'lucide-react';
import GroupForm from '@/components/admin/GroupForm';
import { getGroups, updateGroup, groupAPI, closeGroup } from '@/axios/adminApi';
import { useToastContext } from '@/components/providers/toast-provider';
import { showConfirm } from '@/lib/notifications';
import api from '@/axios/config';

interface GroupProject {
    id: number;
    projectId: number;
    status: string;
    project?: { id: number; tenduan: string };
}
interface Group {
    id: number;
    name: string;
    description?: string;
    duan?: { id: number; tenduan: string };
    duanId?: number;
    leader?: { id: number; hoten: string; manv: string };
    leaderId?: number;
    members?: { id: number; hoten: string; manv: string }[];
    groupProjects?: GroupProject[];
    status?: string;
}

export default function GroupsPage() {
    const { showSuccess, showError, showWarning } = useToastContext();
    const [groups, setGroups] = useState<Group[]>([]);

    const handleCloseGroup = async (id: number) => {
        const confirmed = await showConfirm('Bạn có chắc chắn muốn đóng nhóm này?');
        if (!confirmed) return;
        try {
            await closeGroup(id);
            showSuccess('Đã đóng nhóm thành công');
            loadGroups();
        } catch (e: any) {
            const errorMessage = e.response?.data?.message || e.message || 'Lỗi đóng nhóm';
            showError(errorMessage);
        }
    };
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editGroup, setEditGroup] = useState<Group | null>(null);
    const [duanFilter, setDuanFilter] = useState<string>('');
    const [projects, setProjects] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    const loadGroups = async () => {
        setLoading(true);
        try {
            const res = await getGroups(duanFilter ? { duanId: Number(duanFilter) } : undefined);
            console.log('Loaded groups:', res.groups);
            setGroups(res.groups || []);
        } catch (e: any) {
            const errorMessage = e.response?.data?.message || e.message || 'Lỗi tải nhóm';
            showError(errorMessage);
        } finally { setLoading(false); }
    };

    const loadProjects = async () => {
        try { const r = await api.get('/duan/getAll'); setProjects(r.data.duans || r.data || []); } catch { }
    };

    useEffect(() => { loadProjects(); }, []);
    useEffect(() => { loadGroups(); }, [duanFilter]);

    // Xóa handleDelete - không cho phép xóa nhóm

    const handleEdit = (g: Group) => { setEditGroup(g); setOpenModal(true); };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
                        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Users className="w-6 h-6 text-white" />
                        </span>
                        Quản lý nhóm
                    </h1>
                    <p className="text-muted-foreground">Tổ chức và quản lý các nhóm theo dự án</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={duanFilter}
                            onChange={e => setDuanFilter(e.target.value)}
                            className="px-4 py-2.5 pr-10 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả dự án</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.tenduan}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={() => loadGroups()}
                        className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium text-sm flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <RefreshCw size={16} />
                        <span>Làm mới</span>
                    </button>
                    <button
                        onClick={() => { setEditGroup(null); setOpenModal(true); }}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all flex items-center gap-2 text-sm"
                    >
                        <Plus size={16} />
                        <span>Thêm nhóm</span>
                    </button>
                </div>
            </div>

            {message && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-800">Có lỗi xảy ra</h4>
                        <p className="text-sm text-red-700 mt-1">{message}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
                                    <div>
                                        <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-10 h-10 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa có nhóm</h3>
                            <p className="text-sm text-gray-500">Tạo nhóm đầu tiên để bắt đầu quản lý dự án</p>
                        </div>
                        <button
                            onClick={() => { setEditGroup(null); setOpenModal(true); }}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 transition-all flex items-center gap-2 text-sm mt-2"
                        >
                            <Plus size={18} />
                            <span>Tạo nhóm đầu tiên</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(g => (
                        <div key={g.id} className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1 shadow-sm relative overflow-hidden">
                            {/* Status Badge */}
                            {g.status === 'closed' && (
                                <div className="absolute top-0 right-0 bg-gradient-to-bl from-gray-500 to-gray-600 text-white px-4 py-1 rounded-bl-xl text-xs font-bold shadow-lg">
                                    Đã đóng
                                </div>
                            )}
                            
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <a href={`/admin/groups/${g.id}`} className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 block mb-1">
                                        {g.name}
                                    </a>
                                    <p className="text-xs text-gray-500 line-clamp-2">{g.description || 'Không có mô tả'}</p>
                                </div>
                            </div>

                            {/* Projects */}
                            <div className="mb-4 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <FolderKanban className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dự án</span>
                                </div>
                                <div className="space-y-2">
                                    {Array.isArray(g.groupProjects) && g.groupProjects.filter(gp => gp.status === 'active').length > 0 ? (
                                        g.groupProjects.filter(gp => gp.status === 'active').slice(0, 2).map((gp) => (
                                            <div key={gp.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2 border border-green-200">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                    <span className="text-sm font-medium text-gray-900 truncate flex-1" title={projects.find(p => p.id === gp.projectId)?.tenduan || `Dự án #${gp.projectId}`}>
                                                        {projects.find(p => p.id === gp.projectId)?.tenduan || `Dự án #${gp.projectId}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-400 italic py-1">Chưa tham gia dự án</div>
                                    )}
                                    {Array.isArray(g.groupProjects) && g.groupProjects.filter(gp => gp.status === 'active').length > 2 && (
                                        <div className="text-xs text-indigo-600 font-medium">
                                            +{g.groupProjects.filter(gp => gp.status === 'active').length - 2} dự án khác
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Leader & Members */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                        <span className="text-sm font-bold text-white">
                                            {g.leader?.hoten ? g.leader.hoten.charAt(0).toUpperCase() : '?'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Leader</div>
                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                            {g.leader?.hoten || <span className="text-gray-400 italic">Chưa có leader</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Thành viên</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200">
                                        {g.members?.length || 0} người
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                <a 
                                    href={`/admin/groups/${g.id}`}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm text-center hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105"
                                >
                                    Xem chi tiết
                                </a>
                                {g.status !== 'closed' && (
                                    <button
                                        onClick={() => handleEdit(g)}
                                        className="px-4 py-2.5 bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all hover:scale-105 flex items-center gap-2"
                                        title="Chỉnh sửa nhóm"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <GroupForm isOpen={openModal} onClose={() => setOpenModal(false)} onSuccess={loadGroups} editGroup={editGroup || undefined} />
        </div>
    );
}
