"use client"

import { useState } from "react"
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

    const handleSave = () => {
        alert("Cài đặt đã được lưu thành công!")
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
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Số điện thoại</label>
                            <input
                                type="tel"
                                value={settings.soDienThoai}
                                onChange={(e) => handleChange("soDienThoai", e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Địa chỉ</label>
                        <input
                            type="text"
                            value={settings.diaChi}
                            onChange={(e) => handleChange("diaChi", e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82]"
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
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82]"
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
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82]"
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
                            className="w-4 h-4 rounded border-border cursor-pointer accent-[#003D82]"
                        />
                        <span className="text-foreground font-medium">Bật thông báo qua email</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.thongBaoHeThong}
                            onChange={(e) => handleChange("thongBaoHeThong", e.target.checked)}
                            className="w-4 h-4 rounded border-border cursor-pointer accent-[#003D82]"
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
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003D82]"
                    >
                        <option>Cao</option>
                        <option>Trung bình</option>
                        <option>Thấp</option>
                    </select>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#003D82] text-white rounded-lg hover:bg-[#002855] transition-colors font-bold text-lg"
            >
                <Save size={20} />
                Lưu cài đặt
            </button>
        </div>
    )
}
