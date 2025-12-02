"use client"
import { useState, useEffect } from "react"
import {
    Settings,
    Bell,
    Shield,
    Users,
    Mail,
    Globe,
    Save,
    AlertCircle,
    CheckCircle,
    User,
    Lock,
    Eye,
    EyeOff,
    Trash2,
    Plus
} from "lucide-react"
import { showSuccess, showWarning, showError } from "@/lib/notifications"
import api from "@/axios/config"

interface NotificationSettings {
    emailNotifications: boolean
    pushNotifications: boolean
    taskDeadlines: boolean
    projectUpdates: boolean
    teamActivity: boolean
    weeklyReports: boolean
}

interface SecuritySettings {
    twoFactorAuth: boolean
    loginAlerts: boolean
    sessionTimeout: number
    allowedIPs: string[]
}

interface TeamSettings {
    defaultProjectRole: string
    autoAssignTasks: boolean
    requireApproval: boolean
    workingHours: {
        start: string
        end: string
    }
    workingDays: string[]
}

export default function ManagerSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security" | "team">("general")
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [formData, setFormData] = useState({
        hoten: "",
        email: "",
        sdt: "",
        chucvu: ""
    })
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        taskDeadlines: true,
        projectUpdates: false,
        teamActivity: true,
        weeklyReports: true
    })
    const [security, setSecurity] = useState<SecuritySettings>({
        twoFactorAuth: false,
        loginAlerts: true,
        sessionTimeout: 60,
        allowedIPs: []
    })
    const [team, setTeam] = useState<TeamSettings>({
        defaultProjectRole: "member",
        autoAssignTasks: false,
        requireApproval: true,
        workingHours: {
            start: "08:00",
            end: "17:00"
        },
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    })
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [newIP, setNewIP] = useState("")

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            // Fetch current user profile
            const userRes = await api.get('/users/me')
            const user = userRes.data?.user || userRes.data?.data || userRes.data
            
            setCurrentUser(user)
            
            // Set form data from user profile
            setFormData({
                hoten: user?.hoten || "",
                email: user?.email || "",
                sdt: user?.sdt || "",
                chucvu: user?.chucvu || ""
            })
            
            console.log('✅ User profile loaded:', user)
            setLoading(false)
        } catch (error) {
            console.error("❌ Error loading settings:", error)
            showError("Lỗi khi tải cài đặt")
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        try {
            // Save user profile
            if (activeTab === "general") {
                const response = await api.put('/users/me', {
                    hoten: formData.hoten,
                    sdt: formData.sdt,
                    chucvu: formData.chucvu
                })
                console.log('✅ Profile updated:', response.data)
                setCurrentUser(response.data?.user)
                showSuccess("Cài đặt đã được lưu thành công!")
            } else {
                // For other tabs, just show success (mock implementation)
                console.log("Settings saved:", { notifications, security, team })
                showSuccess("Cài đặt đã được lưu thành công!")
            }
        } catch (error) {
            console.error("❌ Error saving settings:", error)
            showError("Lỗi khi lưu cài đặt")
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
            // Mock password change
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            })
            showSuccess("Đổi mật khẩu thành công!")
        } catch (error) {
            console.error("Error changing password:", error)
        }
    }

    const addAllowedIP = () => {
        if (newIP && !security.allowedIPs.includes(newIP)) {
            setSecurity({
                ...security,
                allowedIPs: [...security.allowedIPs, newIP]
            })
            setNewIP("")
        }
    }

    const removeAllowedIP = (ip: string) => {
        setSecurity({
            ...security,
            allowedIPs: security.allowedIPs.filter(i => i !== ip)
        })
    }

    const tabs = [
        { id: "general", name: "Chung", icon: Settings },
        { id: "notifications", name: "Thông báo", icon: Bell },
        { id: "security", name: "Bảo mật", icon: Shield },
        { id: "team", name: "Nhóm", icon: Users }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-9 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Skeleton */}
                        <div className="w-full lg:w-64">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-12 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                                ))}
                            </div>
                        </div>

                        {/* Content Skeleton */}
                        <div className="flex-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="space-y-6">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i}>
                                            <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
                                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                    ))}
                                    <div className="pt-4">
                                        <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài đặt</h1>
                <p className="text-gray-600">Quản lý cài đặt hệ thống và tùy chọn cá nhân</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full lg:w-64">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                        <nav className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                                ? "bg-blue-100 text-blue-700"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 mr-3" />
                                        {tab.name}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* General Settings */}
                        {activeTab === "general" && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Cài đặt chung</h2>

                                <div className="space-y-6">
                                    {/* Profile Info */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cá nhân</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Họ và tên
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.hoten}
                                                    onChange={(e) => setFormData({ ...formData, hoten: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Số điện thoại
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.sdt}
                                                    onChange={(e) => setFormData({ ...formData, sdt: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Chức vụ
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.chucvu}
                                                    onChange={(e) => setFormData({ ...formData, chucvu: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Preferences */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tùy chọn hệ thống</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Ngôn ngữ
                                                </label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="vi">Tiếng Việt</option>
                                                    <option value="en">English</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Múi giờ
                                                </label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option>
                                                    <option value="Asia/Tokyo">Nhật Bản (UTC+9)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Change Password */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Đổi mật khẩu</h3>
                                        <div className="max-w-md space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Xác nhận mật khẩu mới
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <button
                                                onClick={changePassword}
                                                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Đổi mật khẩu
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notification Settings */}
                        {activeTab === "notifications" && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Cài đặt thông báo</h2>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Thông báo email</h3>
                                                <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.emailNotifications}
                                                    onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Thông báo push</h3>
                                                <p className="text-sm text-gray-500">Nhận thông báo đẩy trên trình duyệt</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.pushNotifications}
                                                    onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Deadline nhiệm vụ</h3>
                                                <p className="text-sm text-gray-500">Nhắc nhở khi nhiệm vụ sắp đến deadline</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.taskDeadlines}
                                                    onChange={(e) => setNotifications({ ...notifications, taskDeadlines: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Cập nhật dự án</h3>
                                                <p className="text-sm text-gray-500">Thông báo khi có cập nhật trong dự án</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.projectUpdates}
                                                    onChange={(e) => setNotifications({ ...notifications, projectUpdates: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Hoạt động nhóm</h3>
                                                <p className="text-sm text-gray-500">Thông báo về hoạt động của thành viên trong nhóm</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.teamActivity}
                                                    onChange={(e) => setNotifications({ ...notifications, teamActivity: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Báo cáo hàng tuần</h3>
                                                <p className="text-sm text-gray-500">Nhận báo cáo tổng hợp hàng tuần</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.weeklyReports}
                                                    onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === "security" && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Cài đặt bảo mật</h2>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Xác thực 2 bước</h3>
                                                <p className="text-sm text-gray-500">Tăng cường bảo mật tài khoản</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={security.twoFactorAuth}
                                                    onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Cảnh báo đăng nhập</h3>
                                                <p className="text-sm text-gray-500">Thông báo khi có đăng nhập từ thiết bị mới</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={security.loginAlerts}
                                                    onChange={(e) => setSecurity({ ...security, loginAlerts: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Thời gian hết hạn phiên (phút)
                                            </label>
                                            <select
                                                value={security.sessionTimeout}
                                                onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
                                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value={30}>30 phút</option>
                                                <option value={60}>1 giờ</option>
                                                <option value={120}>2 giờ</option>
                                                <option value={480}>8 giờ</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                IP được phép truy cập
                                            </label>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nhập địa chỉ IP"
                                                        value={newIP}
                                                        onChange={(e) => setNewIP(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <button
                                                        onClick={addAllowedIP}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Thêm
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    {security.allowedIPs.map((ip, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                                                            <span className="text-sm font-mono">{ip}</span>
                                                            <button
                                                                onClick={() => removeAllowedIP(ip)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team Settings */}
                        {activeTab === "team" && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Cài đặt nhóm</h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vai trò mặc định trong dự án
                                        </label>
                                        <select
                                            value={team.defaultProjectRole}
                                            onChange={(e) => setTeam({ ...team, defaultProjectRole: e.target.value })}
                                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="member">Thành viên</option>
                                            <option value="lead">Trưởng nhóm</option>
                                            <option value="reviewer">Người đánh giá</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Tự động phân công nhiệm vụ</h3>
                                            <p className="text-sm text-gray-500">Phân công nhiệm vụ dựa trên tải công việc</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={team.autoAssignTasks}
                                                onChange={(e) => setTeam({ ...team, autoAssignTasks: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Yêu cầu phê duyệt</h3>
                                            <p className="text-sm text-gray-500">Cần phê duyệt khi hoàn thành nhiệm vụ</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={team.requireApproval}
                                                onChange={(e) => setTeam({ ...team, requireApproval: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-4">Giờ làm việc</h3>
                                        <div className="grid grid-cols-2 gap-4 max-w-xs">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bắt đầu
                                                </label>
                                                <input
                                                    type="time"
                                                    value={team.workingHours.start}
                                                    onChange={(e) => setTeam({
                                                        ...team,
                                                        workingHours: { ...team.workingHours, start: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Kết thúc
                                                </label>
                                                <input
                                                    type="time"
                                                    value={team.workingHours.end}
                                                    onChange={(e) => setTeam({
                                                        ...team,
                                                        workingHours: { ...team.workingHours, end: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-4">Ngày làm việc</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { value: "monday", label: "Thứ 2" },
                                                { value: "tuesday", label: "Thứ 3" },
                                                { value: "wednesday", label: "Thứ 4" },
                                                { value: "thursday", label: "Thứ 5" },
                                                { value: "friday", label: "Thứ 6" },
                                                { value: "saturday", label: "Thứ 7" },
                                                { value: "sunday", label: "CN" }
                                            ].map((day) => (
                                                <label key={day.value} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={team.workingDays.includes(day.value)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setTeam({
                                                                    ...team,
                                                                    workingDays: [...team.workingDays, day.value]
                                                                })
                                                            } else {
                                                                setTeam({
                                                                    ...team,
                                                                    workingDays: team.workingDays.filter(d => d !== day.value)
                                                                })
                                                            }
                                                        }}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">{day.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="border-t border-gray-200 p-6">
                            <button
                                onClick={saveSettings}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Lưu cài đặt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}