"use client"
import { useEffect, useState } from 'react'
import { Users, Mail, Phone, UserCheck, Calendar, ChevronRight, Award, FolderKanban, RefreshCw, Lock, CheckCircle2, ChevronLeft } from 'lucide-react'
import api from '@/axios/config'
import { useToastContext } from '@/components/providers/toast-provider'

interface Member {
    id: number
    hoten: string
    manv: string
    email?: string
    sdt?: string
    chucvu?: string
}

interface GroupProject {
    id: number
    projectId: number
    status: string
    project: { id: number; tenduan: string; moTa?: string }
}

interface GroupInfo {
    id: number
    name: string
    description?: string
    leaderId: number
    status: 'active' | 'closed'
    leader?: Member
    members: Member[]
    groupProjects: GroupProject[]
    createdAt: string
}

export default function TeamLeadGroupPage() {
    const { showError, showSuccess } = useToastContext()
    const [loading, setLoading] = useState(true)
    const [activeGroups, setActiveGroups] = useState<GroupInfo[]>([])
    const [closedGroups, setClosedGroups] = useState<GroupInfo[]>([])
    const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null)
    const [showClosed, setShowClosed] = useState(false)

    useEffect(() => {
        loadGroupsInfo()
    }, [])

    const loadGroupsInfo = async () => {
        setLoading(true)
        try {
            const res = await api.get('/groups/my-group')
            const data = res.data
            
            setActiveGroups(data.activeGroups || [])
            setClosedGroups(data.closedGroups || [])
            
            // Tự động chọn nhóm active đầu tiên
            if (data.activeGroups?.length > 0) {
                setSelectedGroup(data.activeGroups[0])
            } else if (data.groups?.length > 0) {
                setSelectedGroup(data.groups[0])
            }
        } catch (error: any) {
            console.error('Load groups error:', error)
            showError(error.response?.data?.message || 'Lỗi tải thông tin nhóm')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-2xl"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
            </div>
        )
    }

    if (!selectedGroup) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
                    <div className="text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có nhóm</h3>
                        <p className="text-gray-600">Bạn chưa được gán làm trưởng nhóm cho nhóm nào.</p>
                    </div>
                </div>
            </div>
        )
    }

    const activeProjects = selectedGroup.groupProjects?.filter(gp => gp.status === 'active') || []
    const isClosed = selectedGroup.status === 'closed'
    const currentGroups = showClosed ? closedGroups : activeGroups

    return (
        <div className="p-6 space-y-6">
            {/* Group Selector - Tabs with Cards */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Tabs Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex">
                        <button
                            onClick={() => {
                                setShowClosed(false)
                                if (activeGroups.length > 0 && selectedGroup?.status === 'closed') {
                                    setSelectedGroup(activeGroups[0])
                                }
                            }}
                            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                                !showClosed
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Nhóm đang hoạt động
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                !showClosed ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {activeGroups.length}
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setShowClosed(true)
                                if (closedGroups.length > 0 && selectedGroup?.status === 'active') {
                                    setSelectedGroup(closedGroups[0])
                                }
                            }}
                            className={`px-6 py-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                                showClosed
                                    ? 'border-gray-500 text-gray-700 bg-gray-100'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <Lock className="w-4 h-4" />
                            Nhóm đã đóng
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                showClosed ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {closedGroups.length}
                            </span>
                        </button>
                    </div>
                    <button
                        onClick={loadGroupsInfo}
                        className="mr-4 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="text-sm">Làm mới</span>
                    </button>
                </div>

                {/* Cards Grid */}
                <div className="p-6">
                    {currentGroups.length === 0 ? (
                        <div className="text-center py-12">
                            {showClosed ? (
                                <>
                                    <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có nhóm đã đóng</h3>
                                    <p className="text-gray-600">Chưa có nhóm nào bị đóng</p>
                                </>
                            ) : (
                                <>
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có nhóm đang hoạt động</h3>
                                    <p className="text-gray-600">Bạn chưa quản lý nhóm nào</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentGroups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`p-5 rounded-xl text-left transition-all border-2 ${
                                        selectedGroup?.id === group.id
                                            ? showClosed
                                                ? 'border-gray-500 bg-gray-50 shadow-lg ring-2 ring-gray-200'
                                                : 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                            showClosed
                                                ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                        }`}>
                                            {showClosed ? (
                                                <Lock className="w-7 h-7 text-white" />
                                            ) : (
                                                <Users className="w-7 h-7 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="font-bold text-lg text-gray-900 truncate">{group.name}</h4>
                                                {selectedGroup?.id === group.id && (
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                        showClosed ? 'bg-gray-600 text-white' : 'bg-blue-600 text-white'
                                                    }`}>
                                                        Đang xem
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {group.description || 'Không có mô tả'}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1.5 text-gray-700">
                                                    <Users className="w-4 h-4" />
                                                    <span className="font-semibold">{group.members?.length || 0}</span>
                                                    <span className="text-gray-500">thành viên</span>
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="flex items-center gap-1.5 text-gray-700">
                                                    <FolderKanban className="w-4 h-4" />
                                                    <span className="font-semibold">
                                                        {group.groupProjects?.filter(gp => gp.status === 'active').length || 0}
                                                    </span>
                                                    <span className="text-gray-500">dự án</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Group Details */}
            <div className={`bg-gradient-to-r ${isClosed ? 'from-gray-500 to-gray-600' : 'from-blue-600 to-indigo-600'} rounded-2xl p-8 text-white shadow-lg`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                {isClosed ? <Lock className="w-8 h-8 text-white" /> : <Users className="w-8 h-8 text-white" />}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{selectedGroup.name}</h1>
                                <p className={`text-sm ${isClosed ? 'text-gray-200' : 'text-blue-200'}`}>
                                    {isClosed ? 'Nhóm đã đóng - Chỉ xem' : 'Nhóm đang hoạt động'}
                                </p>
                            </div>
                        </div>
                        {selectedGroup.description && (
                            <p className={`max-w-2xl ${isClosed ? 'text-gray-200' : 'text-blue-100'}`}>{selectedGroup.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isClosed ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Thành viên</p>
                            <p className="text-2xl font-bold text-gray-900">{selectedGroup.members?.length || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isClosed ? 'bg-gray-400' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Dự án {isClosed ? '' : 'đang tham gia'}</p>
                            <p className="text-2xl font-bold text-gray-900">{activeProjects.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isClosed ? 'bg-gray-400' : 'bg-gradient-to-br from-purple-500 to-purple-600'}`}>
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ngày tạo</p>
                            <p className="text-lg font-bold text-gray-900">
                                {new Date(selectedGroup.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {isClosed && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <Lock className="w-6 h-6 text-amber-600" />
                        <div>
                            <h3 className="font-bold text-amber-900">Nhóm đã đóng</h3>
                            <p className="text-sm text-amber-700">Nhóm này đã ngừng hoạt động. Bạn chỉ có thể xem thông tin, không thể chỉnh sửa.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Leader Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <UserCheck className={`w-6 h-6 ${isClosed ? 'text-gray-500' : 'text-purple-600'}`} />
                    Trưởng nhóm
                </h2>
                {selectedGroup.leader && (
                    <div className={`flex items-center gap-4 p-4 rounded-xl ${isClosed ? 'bg-gray-100' : 'bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${isClosed ? 'bg-gray-400' : 'bg-gradient-to-br from-purple-500 to-purple-600'}`}>
                            {selectedGroup.leader.hoten.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{selectedGroup.leader.hoten}</h3>
                            <p className="text-sm text-gray-600">{selectedGroup.leader.chucvu || 'Trưởng nhóm'}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span key="manv" className="flex items-center gap-1">
                                    <Award className="w-4 h-4" />
                                    {selectedGroup.leader.manv}
                                </span>
                                {selectedGroup.leader.email && (
                                    <span key="email" className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {selectedGroup.leader.email}
                                    </span>
                                )}
                                {selectedGroup.leader.sdt && (
                                    <span key="sdt" className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {selectedGroup.leader.sdt}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className={`w-6 h-6 ${isClosed ? 'text-gray-500' : 'text-blue-600'}`} />
                    Danh sách thành viên ({selectedGroup.members?.length || 0})
                </h2>
                {!selectedGroup.members || selectedGroup.members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Chưa có thành viên nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedGroup.members.map(member => (
                            <div key={member.id} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isClosed ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                                    {member.hoten.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{member.hoten}</h3>
                                    <p className="text-sm text-gray-600 truncate">{member.chucvu || 'Nhân viên'}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span key="manv" className="flex items-center gap-1">
                                            <Award className="w-3 h-3" />
                                            {member.manv}
                                        </span>
                                        {member.email && (
                                            <span key="email" className="flex items-center gap-1 truncate">
                                                <Mail className="w-3 h-3" />
                                                {member.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FolderKanban className={`w-6 h-6 ${isClosed ? 'text-gray-500' : 'text-green-600'}`} />
                    {isClosed ? 'Dự án đã tham gia' : 'Dự án đang tham gia'} ({activeProjects.length})
                </h2>
                {activeProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Chưa tham gia dự án nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeProjects.map(gp => (
                            <div key={gp.id} className={`p-4 rounded-xl border transition-all ${isClosed ? 'bg-gray-100 border-gray-200' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 hover:shadow-md'}`}>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <FolderKanban className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{gp.project.tenduan}</h3>
                                        {gp.project.moTa && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{gp.project.moTa}</p>
                                        )}
                                        <div className="mt-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                Đang hoạt động
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
