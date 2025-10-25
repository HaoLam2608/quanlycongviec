"use client"

import { useEffect, useState } from "react"
import { getSystemSettings, updateSystemSettings, testSystemNotification } from "@/axios/adminApi"
import { useToastContext } from '@/components/providers/toast-provider'
import { Save, Bell, Lock, Palette } from "lucide-react"

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        tenCongTy: "HUIT - Trường Đại học Công thương TP.HCM",
        email: "admin@huit.edu.vn",
        soDienThoai: "+84 28 3825 6688",
        diaChi: "140 Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM",
        muiGio: "Asia/Ho_Chi_Minh",
        ngonNgu: "Tiếng Việt",
        thongBaoEmail: true,
        thongBaoHeThong: true,
        cheDoBaoMat: "Cao",
    })

    const handleChange = (field: string, value: any) => {
        setSettings({ ...settings, [field]: value })
    }

    const [loading, setLoading] = useState(false)

    const { showSuccess, showError } = useToastContext()

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await getSystemSettings()
                // merge defaults with loaded data
                setSettings({ ...settings, ...data })
            } catch (err: any) {
                console.error('Lỗi khi tải cài đặt hệ thống', err)
                showError(err?.message || 'Không thể tải cài đặt hệ thống')
            } finally {
                setLoading(false)
            }
        }

        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSave = async () => {
        setLoading(true)
        try {
            const updated = await updateSystemSettings(settings)
            setSettings({ ...settings, ...updated })
            showSuccess('Cài đặt đã được lưu thành công!')
        } catch (err: any) {
            console.error('Lỗi khi lưu cài đặt', err)
            showError(err?.message || 'Không thể lưu cài đặt')
        } finally {
            setLoading(false)
        }
    }

    const handleTestEmail = async () => {
        try {
            const res = await testSystemNotification({ type: 'email', to: settings.email })
            showSuccess(res?.message || 'Đã gửi thử email (xem console server)')
        } catch (err: any) {
            console.error('Lỗi khi gửi thử email', err)
            showError(err?.message || 'Không thể gửi thử email')
        }
    }

    const handleTestSystem = async () => {
        try {
            const res = await testSystemNotification({ type: 'system' })
            showSuccess(res?.message || 'Đã gửi thử thông báo hệ thống (xem console server)')
        } catch (err: any) {
            console.error('Lỗi khi gửi thử thông báo hệ thống', err)
            showError(err?.message || 'Không thể gửi thử thông báo hệ thống')
        }
    }

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Cài đặt hệ thống</h1>
                <p className="text-muted-foreground mt-1">Quản lý cài đặt chung của hệ thống</p>
            </div>

            {/* Company Info */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Palette size={24} className="text-[#003D82]" />
                    Thông tin công ty
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tên công ty</label>
                        <input
                            type="text"
                            value={settings.tenCongTy}
                            onChange={(e) => handleChange("tenCongTy", e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82] disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82] disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Số điện thoại</label>
                            <input
                                type="tel"
                                value={settings.soDienThoai}
                                onChange={(e) => handleChange("soDienThoai", e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82] disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Địa chỉ</label>
                        <input
                            type="text"
                            value={settings.diaChi}
                            onChange={(e) => handleChange("diaChi", e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82] disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Palette size={24} className="text-[#003D82]" />
                    Tùy chọn
                </h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Múi giờ</label>
                            <select
                                value={settings.muiGio}
                                onChange={(e) => handleChange("muiGio", e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82] disabled:opacity-50"
                            >
                                <option>Asia/Ho_Chi_Minh</option>
                                <option>Asia/Bangkok</option>
                                <option>Asia/Singapore</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Ngôn ngữ</label>
                            <select
                                value={settings.ngonNgu}
                                onChange={(e) => handleChange("ngonNgu", e.target.value)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82] disabled:opacity-50"
                            >
                                <option>Tiếng Việt</option>
                                <option>English</option>
                                <option>中文</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Bell size={24} className="text-[#003D82]" />
                    Thông báo
                </h2>

                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.thongBaoEmail}
                            onChange={(e) => handleChange("thongBaoEmail", e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 rounded border-border cursor-pointer accent-[#003D82] disabled:opacity-50"
                        />
                        <span className="text-foreground font-medium">Bật thông báo qua email</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.thongBaoHeThong}
                            onChange={(e) => handleChange("thongBaoHeThong", e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 rounded border-border cursor-pointer accent-[#003D82] disabled:opacity-50"
                        />
                        <span className="text-foreground font-medium">Bật thông báo hệ thống</span>
                    </label>
                </div>
            </div>

            {/* Security */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Lock size={24} className="text-[#003D82]" />
                    Bảo mật
                </h2>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Chế độ bảo mật</label>
                    <select
                        value={settings.cheDoBaoMat}
                        onChange={(e) => handleChange("cheDoBaoMat", e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82] disabled:opacity-50"
                    >
                        <option>Cao</option>
                        <option>Trung bình</option>
                        <option>Thấp</option>
                    </select>
                </div>
            </div>

            {/* Save & Test Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#003D82] text-white rounded-lg hover:bg-[#002855] transition-colors font-bold text-lg disabled:opacity-50"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                    ) : (
                        <Save size={20} />
                    )}
                    {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleTestEmail}
                        disabled={loading}
                        className="px-4 py-3 bg-white border border-border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        Gửi thử email
                    </button>
                    <button
                        onClick={handleTestSystem}
                        disabled={loading}
                        className="px-4 py-3 bg-white border border-border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        Gửi thử hệ thống
                    </button>
                </div>
            </div>
        </div>
    )
}
