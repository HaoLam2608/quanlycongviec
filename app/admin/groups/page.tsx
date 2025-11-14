"use client";
import { useEffect, useState } from 'react';
import { Plus, Users, FolderKanban, RefreshCw, Edit, Search, ChevronRight, UserCheck } from 'lucide-react';
import GroupForm from '@/components/admin/GroupForm';
import { getGroups, updateGroup, groupAPI, closeGroup } from '@/axios/adminApi';
import { useToastContext } from '@/components/providers/toast-provider';
import { showConfirm } from '@/lib/notifications';
import api from '@/axios/config';
import Link from 'next/link';

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
    const [searchQuery, setSearchQuery] = useState<string>('');
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

    // Filter groups by search query
    const filteredGroups = groups.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.leader?.hoten.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (g: Group) => { setEditGroup(g); setOpenModal(true); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Quản lý nhóm</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Tổ chức và quản lý các nhóm theo dự án</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => loadGroups()}
                                disabled={loading}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm flex items-center gap-2 transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                <span>Làm mới</span>
                            </button>
                            <button
                                onClick={() => { setEditGroup(null); setOpenModal(true); }}
                                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} />
                                <span>Thêm nhóm</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhóm theo tên, mô tả hoặc leader..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                            />
                        </div>
                        <div className="relative min-w-[200px]">
                            <FolderKanban className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={duanFilter}
                                onChange={e => setDuanFilter(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none cursor-pointer outline-none"
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
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">Tổng số: <span className="text-blue-600 font-bold">{filteredGroups.length}</span> nhóm</span>
                        {duanFilter && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">Lọc theo dự án</span>}
                        {searchQuery && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">Đang tìm kiếm</span>}
                    </div>
                </div>

                {/* Groups Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                <Users className="w-10 h-10 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Không tìm thấy nhóm</h3>
                                <p className="text-sm text-gray-500">
                                    {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Không có nhóm nào phù hợp với bộ lọc hiện tại'}
                                </p>
                            </div>
                            {!searchQuery && !duanFilter && (
                                <button
                                    onClick={() => { setEditGroup(null); setOpenModal(true); }}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 text-sm mt-2"
                                >
                                    <Plus size={18} />
                                    <span>Tạo nhóm đầu tiên</span>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGroups.map(g => {
                            const activeProjects = Array.isArray(g.groupProjects) ? g.groupProjects.filter((gp: any) => gp.status === 'active') : []
                            return (
                                <div key={g.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group">
                                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 p-6 pb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <Users className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-white line-clamp-1" title={g.name}>{g.name}</h3>
                                                    <p className="text-xs text-white/80 line-clamp-1">{g.description || 'Không có mô tả'}</p>
                                                </div>
                                            </div>
                                            {g.status === 'closed' && (
                                                <span className="px-3 py-1 bg-gray-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap">
                                                    Đã đóng
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 space-y-4">
                                        {/* Leader */}
                                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                                <span className="text-sm font-bold text-white">
                                                    {g.leader?.hoten ? g.leader.hoten.charAt(0).toUpperCase() : '?'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 font-medium">Leader</div>
                                                <div className="text-sm font-semibold text-gray-900 truncate">
                                                    {g.leader?.hoten || <span className="text-gray-400 italic">Chưa có leader</span>}
                                                </div>
                                            </div>
                                            <UserCheck className="w-5 h-5 text-blue-500" />
                                        </div>

                                        {/* Members Count */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-gray-600" />
                                                <span className="text-sm font-medium text-gray-700">Thành viên</span>
                                            </div>
                                            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-bold">
                                                {g.members?.length || 0}
                                            </span>
                                        </div>

                                        {/* Active Projects */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                                <FolderKanban className="w-4 h-4 text-green-600" />
                                                <span>Dự án đang tham gia</span>
                                            </div>
                                            {activeProjects.length > 0 ? (
                                                <div className="space-y-2 max-h-24 overflow-y-auto">
                                                    {activeProjects.map((gp: any) => {
                                                        const project = projects.find((p: any) => p.id === gp.projectId)
                                                        return (
                                                            <div key={gp.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                                <span className="text-xs font-medium text-green-800 truncate flex-1" title={project?.tenduan}>
                                                                    {project?.tenduan || `Dự án #${gp.projectId}`}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 italic p-2 bg-gray-50 rounded-lg">Chưa gán dự án</div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <Link 
                                                href={`/admin/groups/${g.id}`}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg group-hover:scale-105"
                                            >
                                                <span>Xem chi tiết</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                            {g.status !== 'closed' && (
                                                <button
                                                    onClick={() => handleEdit(g)}
                                                    className="px-4 py-3 bg-white border-2 border-blue-200 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2"
                                                    title="Chỉnh sửa nhóm"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
