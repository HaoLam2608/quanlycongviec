"use client"

import { Mail, Phone, MapPin, Calendar, Edit2, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRef, useState } from 'react'
import { uploadAvatar, updateMyProfile } from '@/axios/api'
import api from '@/axios/config'
import { useToastContext } from '@/components/providers/toast-provider'

interface ProfileCardProps {
    user: {
        id: string
        name: string
        email: string
        phone?: string
        department?: string
        position?: string
        joinDate?: string
        avatar?: string
    }
    isOwnProfile?: boolean
    onEdit?: () => void
}

export function ProfileCard({ user, isOwnProfile = false, onEdit }: ProfileCardProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uploading, setUploading] = useState(false)
    const makeFullUrl = (path?: string) => {
        if (!path) return undefined
        if (path.startsWith('http')) return path
        const base = api.defaults.baseURL || ''
        return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
    }

    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(makeFullUrl(user?.avatar))
    const { showSuccess, showError } = useToastContext()
    const [editMode, setEditMode] = useState(false)
    const [localUser, setLocalUser] = useState<any>(user)
    const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '', department: user.department || '', position: user.position || '', password: '' })

    const handleChooseFile = () => {
        inputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const res = await uploadAvatar(file)
            const avatarPath = res.avatarUrl || res.data?.avatarUrl || ''
            const full = makeFullUrl(avatarPath)
            setAvatarUrl(full)
            showSuccess('Upload avatar thành công')
            // also update local user and notify parent via onEdit if provided
            setLocalUser((prev: any) => ({ ...prev, avatar: avatarPath }))
            if (onEdit) onEdit()
        } catch (err: any) {
            console.error('Upload avatar error', err)
            showError(err?.message || 'Không thể upload avatar')
        } finally {
            setUploading(false)
        }
    }
    const handleStartEdit = () => {
        setEditMode(true)
    }

    const handleCancelEdit = () => {
        setEditMode(false)
        setForm({ name: user.name || '', phone: user.phone || '', department: user.department || '', position: user.position || '', password: '' })
    }

    const handleSave = async () => {
        try {
            const payload: any = {}
            if (form.name) payload.hoten = form.name
            if (form.phone) payload.sdt = form.phone
            if (form.position) payload.chucvu = form.position
            if (form.password) payload.password = form.password
            const res = await updateMyProfile(payload)
            const updated = res.user || res
            // update local display
            setLocalUser((prev: any) => ({ ...prev, name: updated.hoten || form.name, phone: updated.sdt || form.phone, department: updated.chucvu || form.department, position: updated.chucvu || form.position }))
            showSuccess('Cập nhật hồ sơ thành công')
            setEditMode(false)
            if (onEdit) onEdit()
        } catch (err: any) {
            console.error('Update profile error', err)
            showError(err?.message || 'Không thể cập nhật hồ sơ')
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto p-8 bg-white border border-slate-200 shadow-lg">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#003D82] to-[#005BA8] flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                            {avatarUrl ? (
                                // avatarUrl is a path like /documents/download/:id
                                <img
                                    src={avatarUrl}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                (user.name || '').charAt(0).toUpperCase()
                            )}
                        </div>

                        {isOwnProfile && (
                            <div className="absolute -bottom-2 right-0">
                                <button onClick={handleChooseFile} className="bg-white p-2 rounded-full shadow-md">
                                    <Camera className="w-4 h-4 text-[#003D82]" />
                                </button>
                                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                        {!editMode ? (
                            <>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">{localUser?.name || user.name}</h1>
                                    {localUser?.position && <p className="text-lg text-[#003D82] font-semibold mt-1">{localUser.position}</p>}
                                </div>
                                {isOwnProfile && (
                                    <div className="flex items-center gap-2">
                                        <Button onClick={handleStartEdit} variant="outline" size="sm" className="gap-2 border-[#003D82] text-[#003D82]">
                                            <Edit2 className="w-4 h-4" />
                                            Chỉnh sửa
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded" />
                                <Button onClick={handleSave} size="sm">Lưu</Button>
                                <Button onClick={handleCancelEdit} size="sm" variant="ghost">Hủy</Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[#003D82]" />
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="text-slate-900 font-medium">{user.email}</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-[#003D82]" />
                            <div>
                                <p className="text-sm text-slate-500">Điện thoại</p>
                                {!editMode ? (
                                    <p className="text-slate-900 font-medium">{localUser?.phone || user.phone || '—'}</p>
                                ) : (
                                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 border rounded w-full" />
                                )}
                            </div>
                        </div>

                        {/* Department */}
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-[#003D82]" />
                            <div>
                                <p className="text-sm text-slate-500">Phòng ban</p>
                                {!editMode ? (
                                    <p className="text-slate-900 font-medium">{localUser?.department || user.department || '—'}</p>
                                ) : (
                                    <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="px-3 py-2 border rounded w-full" />
                                )}
                            </div>
                        </div>

                        {/* Join Date */}
                        {user.joinDate && (
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-[#003D82]" />
                                <div>
                                    <p className="text-sm text-slate-500">Ngày tham gia</p>
                                    <p className="text-slate-900 font-medium">{user.joinDate}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
