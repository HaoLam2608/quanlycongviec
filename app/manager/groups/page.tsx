"use client"
import { useEffect, useState } from 'react'
import { Users, FolderKanban, RefreshCw } from 'lucide-react'
import { getGroups } from '@/axios/adminApi'
import api from '@/axios/config'
import Link from 'next/link'

export default function ManagerGroupsPage() {
    const [groups, setGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [duanFilter, setDuanFilter] = useState<string>('')
    const [projects, setProjects] = useState<any[]>([])

    const loadGroups = async () => {
        setLoading(true)
        try {
            const res = await getGroups(duanFilter ? { duanId: Number(duanFilter) } : undefined)
            setGroups(res.groups || [])
        } catch (e: any) {
            console.error('Lỗi tải nhóm', e)
            setGroups([])
        } finally { setLoading(false) }
    }

    const loadProjects = async () => {
        try { const r = await api.get('/duan/getAll'); setProjects(r.data.duans || r.data || []) } catch { }
    }

    useEffect(() => { loadProjects() }, [])
    useEffect(() => { loadGroups() }, [duanFilter])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
                        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Users className="w-6 h-6 text-white" />
                        </span>
                        Nhóm làm việc
                    </h1>
                    <p className="text-muted-foreground">Danh sách các nhóm có sẵn</p>
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
                    {/* No create button for manager */}
                </div>
            </div>

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
                                <>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                                                    <div>
                                                        <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-6 bg-gray-200 rounded-full w-28 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse ml-auto"></div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Users className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">Chưa có nhóm</h3>
                                                <p className="text-xs text-gray-500 mt-1">Không có nhóm nào phù hợp</p>
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
                                                    <Link href={`/manager/groups/${g.id}`} className="hover:underline text-blue-700">{g.name}</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 space-y-1">
                                            {Array.isArray(g.groupProjects) && g.groupProjects.filter((gp: any) => gp.status === 'active').length > 0 ? (
                                                g.groupProjects.filter((gp: any) => gp.status === 'active').map((gp: any) => (
                                                    <div key={gp.id} className="flex items-center gap-2">
                                                        <span className="truncate max-w-[160px]" title={projects.find((p: any) => p.id === gp.projectId)?.tenduan || `Dự án #${gp.projectId}`}>{projects.find((p: any) => p.id === gp.projectId)?.tenduan || `Dự án #${gp.projectId}`}</span>
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
                                            <Link href={`/manager/groups/${g.id}`} className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-medium hover:from-blue-600 hover:to-indigo-700 transition-all">Xem chi tiết</Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
