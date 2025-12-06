"use client"
import { useState, useEffect } from "react"
import {
    User,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    Shield,
    Edit3,
    Save,
    X,
    Eye,
    EyeOff,
    Bell,
    Globe,
    Lock,
    Camera
} from "lucide-react"
import { showSuccess, showError, showWarning } from "@/lib/notifications"
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/axios/api"
import api from '@/axios/config'
import { useRef } from 'react'

interface UserProfile {
    id: number
    fullName: string
    email: string
    phone: string
    position: string
    department: string
    joinDate: string
    avatar: string
    role: string
}

interface Settings {
    notifications: {
        email: boolean
        push: boolean
        taskReminders: boolean
        projectUpdates: boolean
        deadlineAlerts: boolean
    }
    privacy: {
        profileVisibility: "public" | "team" | "private"
        showEmail: boolean
        showPhone: boolean
    }
    language: string
    timezone: string
}
const API_URL = "http://localhost:5000"
export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState<"profile" | "settings" | "password">("profile")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [editProfile, setEditProfile] = useState({
        fullName: "",
        phone: "",
        position: "",
        department: ""
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    useEffect(() => {
        loadProfile()
        loadSettings()
    }, [])

    const lastAvatarUrl = useRef<string | null>(null)

    useEffect(() => {
        loadProfile()
        loadSettings()
    }, [])

    const loadProfile = async () => {
        try {
            // Fetch dữ liệu thật từ database
            const userData = await getMyProfile();

            // Format dữ liệu từ API
            const profileData: UserProfile = {
                id: userData.id,
                fullName: userData.hoten || '',
                email: userData.email || '',
                phone: userData.sdt || '',
                position: userData.chucvu || '',
                department: userData.department || 'Chưa có',
                joinDate: userData.createdAt || new Date().toISOString(),
                avatar: userData.avatarUrl || `/users/${userData.id}/avatar`,
                role: userData.role?.name || 'Member'
            }

            setProfile(profileData)
            // If avatar is a protected API path (not absolute), fetch as blob with auth and convert to object URL
            if (profileData.avatar && !profileData.avatar.startsWith('http')) {
                try {
                    // Add cache buster to force fresh fetch
                    const avatarUrl = profileData.avatar + '?t=' + Date.now();
                    const res = await api.get(avatarUrl, { responseType: 'blob' })
                    const blob = res.data
                    const objectUrl = URL.createObjectURL(blob)
                    // revoke previous object URL if any
                    if (lastAvatarUrl.current) {
                        try { URL.revokeObjectURL(lastAvatarUrl.current) } catch (e) { }
                    }
                    // replace avatar with object URL so <img> can load it
                    setProfile(prev => prev ? { ...prev, avatar: objectUrl } : prev)
                    // remember to revoke when component unmounts or avatar changes
                    lastAvatarUrl.current = objectUrl
                } catch (err) {
                    // ignore; fallback to default avatar handling
                    console.debug('Could not fetch protected avatar as blob', err)
                }
            }
            setEditProfile({
                fullName: profileData.fullName,
                phone: profileData.phone,
                position: profileData.position,
                department: profileData.department
            })
        } catch (error) {
            console.error("Error loading profile:", error)
        }
    }

    useEffect(() => {
        return () => {
            if (lastAvatarUrl.current) {
                try { URL.revokeObjectURL(lastAvatarUrl.current) } catch (e) { }
                lastAvatarUrl.current = null
            }
        }
    }, [])

    const loadSettings = async () => {
        try {
            // Mock data for now
            const mockSettings: Settings = {
                notifications: {
                    email: true,
                    push: true,
                    taskReminders: true,
                    projectUpdates: false,
                    deadlineAlerts: true
                },
                privacy: {
                    profileVisibility: "team",
                    showEmail: true,
                    showPhone: false
                },
                language: "vi",
                timezone: "Asia/Ho_Chi_Minh"
            }

            setSettings(mockSettings)
        } catch (error) {
            console.error("Error loading settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const saveProfile = async () => {
        try {
            // Gọi API để cập nhật profile
            const updateData: any = {};
            if (editProfile.fullName) updateData.hoten = editProfile.fullName;
            if (editProfile.phone) updateData.sdt = editProfile.phone;
            if (editProfile.position) updateData.chucvu = editProfile.position;

            await updateMyProfile(updateData);

            // Reload profile sau khi cập nhật
            await loadProfile();
            setIsEditing(false);
            showSuccess('Cập nhật hồ sơ thành công!');
        } catch (error: any) {
            console.error("Error saving profile:", error);
            showError(error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
        }
    }

    const saveSettings = async () => {
        try {
            // Mock save - would call API here
            console.log("Settings saved:", settings)
        } catch (error) {
            console.error("Error saving settings:", error)
        }
    }

    const changePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showWarning("Mật khẩu mới và xác nhận mật khẩu không khớp!")
            return
        }

        if (passwordForm.newPassword.length < 6) {
            showWarning("Mật khẩu mới phải có ít nhất 6 ký tự!")
            return
        }

        try {
            // Gọi API để đổi mật khẩu
            await updateMyProfile({ password: passwordForm.newPassword });

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            })
            showSuccess("Đổi mật khẩu thành công!")
        } catch (error: any) {
            console.error("Error changing password:", error);
            showError(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        }
    }

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            try {
                // Upload avatar lên server
                await uploadAvatar(file);

                // Reload profile để lấy avatar mới
                await loadProfile();
                showSuccess('Cập nhật avatar thành công!');

                // Notify layout to reload avatar
                window.dispatchEvent(new CustomEvent('avatarUpdated'));
            } catch (error: any) {
                console.error("Error uploading avatar:", error);
                showError(error.message || 'Có lỗi xảy ra khi upload avatar');
            }
        }
    }

    if (loading || !profile || !settings) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-9 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                    </div>

                    {/* Tabs Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                        <div className="border-b border-gray-200 p-4">
                            <div className="flex gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Avatar Skeleton */}
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
                                    <div className="flex-1">
                                        <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Form Fields Skeleton */}
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i}>
                                        <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                ))}

                                {/* Button Skeleton */}
                                <div className="flex gap-3 pt-4">
                                    <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                                    <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
                    <p className="text-gray-600">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img
                                    src={(profile.avatar && (profile.avatar.startsWith('http') || profile.avatar.startsWith('blob:') || profile.avatar.startsWith('data:'))) ? profile.avatar : `${API_URL}${profile.avatar}`}
                                    alt={profile.fullName}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.fullName) + '&background=3b82f6&color=fff';
                                    }}
                                />
                                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                                    <Camera className="w-4 h-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
                                <p className="text-gray-600 mb-1">{profile.position}</p>
                                <p className="text-sm text-gray-500">{profile.department}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {profile.role}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Tham gia từ {new Date(profile.joinDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Thông tin cá nhân
                            </button>
                            <button
                                onClick={() => setActiveTab("settings")}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "settings"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Cài đặt
                            </button>
                            <button
                                onClick={() => setActiveTab("password")}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "password"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Đổi mật khẩu
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "profile" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Chỉnh sửa
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Hủy
                                            </button>
                                            <button
                                                onClick={saveProfile}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Save className="w-4 h-4" />
                                                Lưu
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <User className="w-4 h-4 inline mr-2" />
                                            Họ và tên
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editProfile.fullName}
                                                onChange={(e) => setEditProfile({ ...editProfile, fullName: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{profile.fullName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email
                                        </label>
                                        <p className="text-gray-900">{profile.email}</p>
                                        <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Số điện thoại
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editProfile.phone}
                                                onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{profile.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Briefcase className="w-4 h-4 inline mr-2" />
                                            Chức vụ
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editProfile.position}
                                                onChange={(e) => setEditProfile({ ...editProfile, position: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{profile.position}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Shield className="w-4 h-4 inline mr-2" />
                                            Phòng ban
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editProfile.department}
                                                onChange={(e) => setEditProfile({ ...editProfile, department: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{profile.department}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Calendar className="w-4 h-4 inline mr-2" />
                                            Ngày tham gia
                                        </label>
                                        <p className="text-gray-900">{new Date(profile.joinDate).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="space-y-8">
                                {/* Notifications */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Bell className="w-5 h-5" />
                                        Thông báo
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Thông báo email</p>
                                                <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications.email}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        notifications: {
                                                            ...settings.notifications,
                                                            email: e.target.checked
                                                        }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Nhắc nhở công việc</p>
                                                <p className="text-sm text-gray-500">Nhận nhắc nhở về deadline</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications.taskReminders}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        notifications: {
                                                            ...settings.notifications,
                                                            taskReminders: e.target.checked
                                                        }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Cập nhật dự án</p>
                                                <p className="text-sm text-gray-500">Nhận thông báo về cập nhật dự án</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.notifications.projectUpdates}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        notifications: {
                                                            ...settings.notifications,
                                                            projectUpdates: e.target.checked
                                                        }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        Quyền riêng tư
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Hiển thị hồ sơ
                                            </label>
                                            <select
                                                value={settings.privacy.profileVisibility}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    privacy: {
                                                        ...settings.privacy,
                                                        profileVisibility: e.target.value as "public" | "team" | "private"
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="public">Công khai</option>
                                                <option value="team">Chỉ thành viên team</option>
                                                <option value="private">Riêng tư</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Hiển thị email</p>
                                                <p className="text-sm text-gray-500">Cho phép người khác xem email</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.privacy.showEmail}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        privacy: {
                                                            ...settings.privacy,
                                                            showEmail: e.target.checked
                                                        }
                                                    })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Language & Region */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Globe className="w-5 h-5" />
                                        Ngôn ngữ & Khu vực
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ngôn ngữ
                                            </label>
                                            <select
                                                value={settings.language}
                                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="vi">Tiếng Việt</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Múi giờ
                                            </label>
                                            <select
                                                value={settings.timezone}
                                                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option>
                                                <option value="Asia/Tokyo">Nhật Bản (UTC+9)</option>
                                                <option value="America/New_York">New York (UTC-5)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={saveSettings}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Lưu cài đặt
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "password" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Đổi mật khẩu
                                </h3>

                                <div className="max-w-md space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mật khẩu hiện tại
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={changePassword}
                                        disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Đổi mật khẩu
                                    </button>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-medium text-yellow-800 mb-2">Lưu ý bảo mật:</h4>
                                    <ul className="text-sm text-yellow-700 space-y-1">
                                        <li>• Mật khẩu phải có ít nhất 6 ký tự</li>
                                        <li>• Nên sử dụng kết hợp chữ cái, số và ký tự đặc biệt</li>
                                        <li>• Không chia sẻ mật khẩu với người khác</li>
                                        <li>• Thường xuyên thay đổi mật khẩu để bảo mật</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}