"use client";
import { useEffect, useState } from 'react';
import { Plus, Users, FolderKanban, RefreshCw, Edit } from 'lucide-react';
import GroupForm from '@/components/admin/GroupForm';
import { getGroups, updateGroup, groupAPI, closeGroup } from '@/axios/adminApi';
import { useToastContext } from '@/components/providers/toast-provider';
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
        if (!window.confirm('Bạn có chắc chắn muốn đóng nhóm này?')) return;
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

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg shadow-black/5">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">Nhóm</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">Dự án</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">Leader</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">Thành viên</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 tracking-wide">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            <span className="text-gray-500 text-sm">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Users className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">Chưa có nhóm</h3>
                                                <p className="text-xs text-gray-500 mt-1">Tạo nhóm đầu tiên để bắt đầu</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : groups.map(g => (
                                <tr key={g.id} className="hover:bg-slate-50/50 transition-all duration-150 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Users className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 text-sm truncate" title={g.description || g.name}>
                                                    <a href={`/admin/groups/${g.id}`} className="hover:underline text-blue-700">{g.name}</a>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 space-y-1">
                                            {Array.isArray(g.groupProjects) && g.groupProjects.filter(gp => gp.status === 'active').length > 0 ? (
                                                g.groupProjects.filter(gp => gp.status === 'active').map((gp) => (
                                                    <div key={gp.id} className="flex items-center gap-2">
                                                        <span className="truncate max-w-[160px]" title={projects.find(p => p.id === gp.projectId)?.tenduan || `Dự án #${gp.projectId}`}>{projects.find(p => p.id === gp.projectId)?.tenduan || `Dự án #${gp.projectId}`}</span>
                                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Đang tham gia</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 italic">Chưa gán dự án</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-semibold text-indigo-700">
                                                    {g.leader?.hoten ? g.leader.hoten.charAt(0).toUpperCase() : '?'}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-700 truncate">
                                                {g.leader?.hoten || <span className="text-gray-400 italic">Chưa có leader</span>}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {g.members?.length || 0} thành viên
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            {g.status !== 'closed' ? (
                                                <button
                                                    onClick={() => handleEdit(g)}
                                                    className="p-2.5 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700 transition-all duration-150 hover:scale-110 border border-blue-200 hover:border-blue-300"
                                                    title="Chỉnh sửa nhóm"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            ) : (
                                                <span title="Nhóm đã đóng" className="p-2.5 rounded-lg text-gray-400 border border-gray-200 bg-gray-50 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6V9a6 6 0 10-12 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2zm-2 0H8V9a4 4 0 118 0v2z" />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <GroupForm isOpen={openModal} onClose={() => setOpenModal(false)} onSuccess={loadGroups} editGroup={editGroup || undefined} />
        </div>
    );
}
