"use client"

import { ProfileCard } from "@/components/profile/profile-card"
import { ProfileStats } from "@/components/profile/profile-stats"
import { useEffect, useState } from "react"
import { getUsers } from '@/axios/adminApi'
import { useToastContext } from '@/components/providers/toast-provider'

export default function PMProfilePage() {
    const [isEditing, setIsEditing] = useState(false)
    const [pmData, setPmData] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const { showError } = useToastContext()

    const pmStats = [
        { label: "Dự án", value: "—" },
        { label: "Nhiệm vụ", value: "—" },
        { label: "Nhóm", value: "—" },
        { label: "Hoàn thành", value: "—" },
    ]

    useEffect(() => {
        const loadProfile = async () => {
            const manv = typeof window !== 'undefined' ? localStorage.getItem('manv') : null
            if (!manv) return
            setLoading(true)
            try {
                const res = await getUsers({ search: manv, limit: 1 })
                const users = res.users || res
                if (Array.isArray(users) && users.length > 0) {
                    const u = users[0]
                    setPmData({
                        id: u.id,
                        name: u.hoten,
                        email: u.email || '',
                        phone: u.sdt || '',
                        department: u.chucvu || '',
                        position: u.chucvu || '',
                        joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
                        avatar: u.avatar || u.hoten?.charAt(0)?.toUpperCase() || undefined,
                        manv: u.manv
                    })
                } else {
                    showError('Không tìm thấy thông tin người dùng')
                }
            } catch (err: any) {
                console.error('Lỗi khi tải profile', err)
                showError(err?.message || 'Không thể tải profile')
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
                    <p className="text-slate-600 mt-2">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
                </div>

                {loading ? (
                    <div className="text-center py-10">Đang tải hồ sơ...</div>
                ) : pmData ? (
                    <>
                        <ProfileCard user={pmData} isOwnProfile={true} onEdit={() => setIsEditing(true)} />
                        <ProfileStats stats={pmStats} />
                    </>
                ) : (
                    <div className="text-center py-10 text-red-500">Không có dữ liệu hồ sơ</div>
                )}

                {/* Additional Info Section */}
                <div className="mt-8 bg-white rounded-lg border border-slate-200 p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin bổ sung</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Kỹ năng</label>
                            <div className="flex flex-wrap gap-2">
                                {["Quản lý dự án", "Lãnh đạo nhóm", "Giao tiếp", "Lập kế hoạch"].map((skill) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1 bg-[#003D82]/10 text-[#003D82] rounded-full text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Ngôn ngữ</label>
                            <div className="flex flex-wrap gap-2">
                                {["Tiếng Việt", "Tiếng Anh"].map((lang) => (
                                    <span
                                        key={lang}
                                        className="px-3 py-1 bg-[#003D82]/10 text-[#003D82] rounded-full text-sm font-medium"
                                    >
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
