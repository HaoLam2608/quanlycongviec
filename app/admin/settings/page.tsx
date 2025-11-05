"use client"

import { useState, useEffect } from "react"
import { User, Lock, Bell, Shield, Palette, Database, Save, Eye, EyeOff } from "lucide-react"
import { userAPI, getUsers } from "@/axios/adminApi"
import { adminUploadAvatar } from "@/axios/adminUserApi"

const tabs = [
  { key: "profile", label: "Thông tin cá nhân", icon: User },
  { key: "security", label: "Bảo mật", icon: Lock },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "system", label: "Hệ thống", icon: Database },
  { key: "appearance", label: "Giao diện", icon: Palette },
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile data
  const [profileData, setProfileData] = useState({
    id: 0,
    manv: "",
    hoten: "",
    email: "",
    sdt: "",
    chucvu: "",
    avatar: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Security data
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskAssignments: true,
    projectUpdates: true,
    deadlineReminders: true,
    weeklyReports: false,
  })

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    maxUploadSize: "10",
    sessionTimeout: "30",
  })

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    language: "vi",
    dateFormat: "DD/MM/YYYY",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const manv = localStorage.getItem("manv") || ""
      if (!manv) return
      const res = await getUsers({ search: manv })
      const users = res.users || res.rows || res
      const user = Array.isArray(users) ? users[0] : users
      if (user) {
        setProfileData({
          id: user.id,
          manv: user.manv || "",
          hoten: user.hoten || "",
          email: user.email || "",
          sdt: user.sdt || "",
          chucvu: user.chucvu || "",
          avatar: user.avatar || "",
        })
      }
    } catch (error) {
      console.error("Load profile error:", error)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
      setProfileData({ ...profileData, avatar: URL.createObjectURL(e.target.files[0]) })
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const updateData: any = {
        hoten: profileData.hoten,
        email: profileData.email,
        sdt: profileData.sdt,
        chucvu: profileData.chucvu,
      }
      await userAPI.updateUser(profileData.id, updateData)

      if (avatarFile) {
        await adminUploadAvatar(profileData.id, avatarFile)
      }

      // Cập nhật localStorage
      localStorage.setItem("hoten", profileData.hoten)
      if (avatarFile) {
        const updatedRes = await getUsers({ search: profileData.manv })
        const updatedUsers = updatedRes.users || updatedRes.rows || updatedRes
        const updatedUser = Array.isArray(updatedUsers) ? updatedUsers[0] : updatedUsers
        if (updatedUser && updatedUser.avatar) {
          const avatarWithTs = `${updatedUser.avatar}?t=${Date.now()}`
          localStorage.setItem("avatar", avatarWithTs)
          window.dispatchEvent(new Event('avatarUpdated'))
        }
      }

      setMessage("Cập nhật thông tin thành công!")
      setAvatarFile(null)
    } catch (error: any) {
      setMessage(error.message || "Cập nhật thất bại!")
    } finally {
      setLoading(false)
    }
  }

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage("Mật khẩu mới không khớp!")
      return
    }
    setLoading(true)
    setMessage("")
    try {
      await userAPI.updateUser(profileData.id, { password: securityData.newPassword })
      setMessage("Đổi mật khẩu thành công!")
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      setMessage(error.message || "Đổi mật khẩu thất bại!")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      // TODO: Gọi API lưu cài đặt thông báo
      setMessage("Lưu cài đặt thông báo thành công!")
    } catch (error: any) {
      setMessage(error.message || "Lưu thất bại!")
    } finally {
      setLoading(false)
    }
  }

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      // TODO: Gọi API lưu cài đặt hệ thống
      setMessage("Lưu cài đặt hệ thống thành công!")
    } catch (error: any) {
      setMessage(error.message || "Lưu thất bại!")
    } finally {
      setLoading(false)
    }
  }

  const handleAppearanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      // TODO: Gọi API lưu cài đặt giao diện
      setMessage("Lưu cài đặt giao diện thành công!")
    } catch (error: any) {
      setMessage(error.message || "Lưu thất bại!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          Cài đặt
        </h1>
        <p className="text-muted-foreground">Quản lý cài đặt hệ thống và tài khoản</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key)
                    setMessage("")
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                  message.includes("thành công")
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Thông tin cá nhân</h2>
                  <p className="text-sm text-muted-foreground">Cập nhật thông tin tài khoản của bạn</p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    {profileData.avatar && typeof profileData.avatar === 'string' && profileData.avatar.startsWith('/users/') ? (
                      <img src={`http://localhost:5000${profileData.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                    ) : profileData.avatar ? (
                      <img src={profileData.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-white font-bold">{profileData.hoten.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Ảnh đại diện</h3>
                    <p className="text-sm text-muted-foreground mb-3">JPG, PNG. Tối đa 2MB</p>
                    <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
                      Chọn ảnh mới
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Mã nhân viên</label>
                    <input
                      type="text"
                      name="manv"
                      value={profileData.manv}
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Họ và tên *</label>
                    <input
                      type="text"
                      name="hoten"
                      value={profileData.hoten}
                      onChange={handleProfileChange}
                      required
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Số điện thoại</label>
                    <input
                      type="text"
                      name="sdt"
                      value={profileData.sdt}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Chức vụ</label>
                    <input
                      type="text"
                      name="chucvu"
                      value={profileData.chucvu}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <form onSubmit={handleSecuritySubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Bảo mật</h2>
                  <p className="text-sm text-muted-foreground">Quản lý mật khẩu và bảo mật tài khoản</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Mật khẩu mới *</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        required
                        className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Xác nhận mật khẩu mới *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        required
                        className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                </button>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <form onSubmit={handleNotificationSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Thông báo</h2>
                  <p className="text-sm text-muted-foreground">Quản lý cài đặt thông báo của bạn</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "emailNotifications", label: "Nhận thông báo qua email", desc: "Nhận email khi có hoạt động mới" },
                    { key: "taskAssignments", label: "Phân công nhiệm vụ", desc: "Thông báo khi được giao nhiệm vụ mới" },
                    { key: "projectUpdates", label: "Cập nhật dự án", desc: "Thông báo khi dự án có thay đổi" },
                    { key: "deadlineReminders", label: "Nhắc nhở deadline", desc: "Nhận nhắc nhở trước hạn chót" },
                    { key: "weeklyReports", label: "Báo cáo tuần", desc: "Nhận báo cáo tổng hợp hàng tuần" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h3 className="font-medium text-foreground">{item.label}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                          onChange={(e) =>
                            setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </form>
            )}

            {/* System Tab */}
            {activeTab === "system" && (
              <form onSubmit={handleSystemSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Cài đặt hệ thống</h2>
                  <p className="text-sm text-muted-foreground">Quản lý cài đặt hệ thống tổng thể</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h3 className="font-medium text-foreground">Chế độ bảo trì</h3>
                      <p className="text-sm text-muted-foreground">Tạm thời vô hiệu hóa hệ thống</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h3 className="font-medium text-foreground">Cho phép đăng ký</h3>
                      <p className="text-sm text-muted-foreground">Người dùng có thể tự đăng ký tài khoản</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.registrationEnabled}
                        onChange={(e) => setSystemSettings({ ...systemSettings, registrationEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Kích thước upload tối đa (MB)</label>
                    <input
                      type="number"
                      value={systemSettings.maxUploadSize}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maxUploadSize: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Thời gian hết phiên (phút)</label>
                    <input
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </form>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <form onSubmit={handleAppearanceSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Giao diện</h2>
                  <p className="text-sm text-muted-foreground">Tùy chỉnh giao diện hệ thống</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Chủ đề</label>
                    <select
                      value={appearanceSettings.theme}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, theme: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="light">Sáng</option>
                      <option value="dark">Tối</option>
                      <option value="auto">Tự động</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Ngôn ngữ</label>
                    <select
                      value={appearanceSettings.language}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Định dạng ngày</label>
                    <select
                      value={appearanceSettings.dateFormat}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, dateFormat: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
