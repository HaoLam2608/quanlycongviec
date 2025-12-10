"use client"

import { useState, useEffect } from "react"
import { HardDrive, Download, Trash2, RotateCcw, Play, Clock, Database, AlertCircle, CheckCircle2 } from "lucide-react"
import { backupAPI } from "@/axios/backupAPI"

export default function BackupSettings() {
  const [backupSettings, setBackupSettings] = useState({
    enabled: true,
    schedule: "0 2 * * *",
    retentionDays: 7,
    database: {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      name: "qlcv"
    }
  })
  const [backupList, setBackupList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadBackupSettings()
    loadBackupList()
  }, [])

  const loadBackupSettings = async () => {
    try {
      const response = await backupAPI.getSettings()
      if (response.success) {
        setBackupSettings(response.data)
      }
    } catch (error: any) {
      console.error("Error loading backup settings:", error)
    }
  }

  const loadBackupList = async () => {
    try {
      const response = await backupAPI.getBackupList()
      if (response.success) {
        setBackupList(response.data)
      }
    } catch (error: any) {
      console.error("Error loading backup list:", error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      const response = await backupAPI.updateSettings(backupSettings)
      if (response.success) {
        setMessage("Cập nhật cấu hình backup thành công!")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error: any) {
      setMessage("Lỗi: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerBackup = async () => {
    try {
      setLoading(true)
      setMessage("Đang thực hiện backup...")
      const response = await backupAPI.triggerBackup()
      if (response.success) {
        setMessage(`Backup thành công! File: ${response.data.fileName} (${response.data.size} MB)`)
        await loadBackupList()
        setTimeout(() => setMessage(""), 5000)
      }
    } catch (error: any) {
      setMessage("Lỗi: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = async (fileName: string) => {
    try {
      setMessage(`Đang tải ${fileName}...`)
      await backupAPI.downloadBackup(fileName)
      setMessage(`Đã tải ${fileName} thành công!`)
      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      setMessage("Lỗi: " + (error.response?.data?.message || error.message))
    }
  }

  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa backup ${fileName}?`)) return

    try {
      const response = await backupAPI.deleteBackup(fileName)
      if (response.success) {
        setMessage("Đã xóa backup thành công!")
        await loadBackupList()
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error: any) {
      setMessage("Lỗi: " + (error.response?.data?.message || error.message))
    }
  }

  const handleRestoreBackup = async (fileName: string) => {
    if (!confirm(`⚠️ CẢNH BÁO: Khôi phục database sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại!\n\nBạn có chắc muốn khôi phục từ ${fileName}?`)) return

    try {
      setLoading(true)
      setMessage("Đang khôi phục database...")
      const response = await backupAPI.restoreBackup(fileName)
      if (response.success) {
        setMessage("Khôi phục database thành công! Vui lòng tải lại trang.")
        setTimeout(() => window.location.reload(), 3000)
      }
    } catch (error: any) {
      setMessage("Lỗi: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${message.includes("Lỗi") || message.includes("⚠️") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {message}
        </div>
      )}

      {/* Backup Settings */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Cấu hình Backup Tự động</h3>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Kích hoạt Backup tự động</label>
              <p className="text-sm text-gray-500 mt-1">Tự động backup database theo lịch</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={backupSettings.enabled}
                onChange={(e) => setBackupSettings({ ...backupSettings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Schedule */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Lịch Backup (Cron Expression)
            </label>
            <input
              type="text"
              value={backupSettings.schedule}
              onChange={(e) => setBackupSettings({ ...backupSettings, schedule: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              placeholder="0 2 * * *"
            />
            <p className="text-sm text-gray-500 mt-2">
              Mặc định: 0 2 * * * (2:00 AM mỗi ngày). <a href="https://crontab.guru/" target="_blank" className="text-blue-600 hover:underline">Trợ giúp cron</a>
            </p>
          </div>

          {/* Retention Days */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Thời gian lưu trữ (ngày)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={backupSettings.retentionDays}
              onChange={(e) => setBackupSettings({ ...backupSettings, retentionDays: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-sm text-gray-500 mt-2">
              Backups cũ hơn {backupSettings.retentionDays} ngày sẽ tự động bị xóa
            </p>
          </div>

          {/* Save Settings Button */}
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </div>

      {/* Manual Backup */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Play className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-900">Backup Thủ công</h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">Thực hiện backup database ngay lập tức</p>
          <button
            onClick={handleTriggerBackup}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang backup..." : "Chạy Backup Ngay"}
          </button>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Danh sách Backup</h3>
          </div>
          <button
            onClick={loadBackupList}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Làm mới
          </button>
        </div>

        <div className="space-y-3">
          {backupList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có backup nào</p>
            </div>
          ) : (
            backupList.map((backup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{backup.fileName}</div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>📦 {backup.size}</span>
                    <span>🕐 {backup.age}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadBackup(backup.fileName)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Tải xuống"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRestoreBackup(backup.fileName)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Khôi phục"
                    disabled={loading}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(backup.fileName)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Production Notes */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-amber-900 mb-2">Lưu ý khi Deploy lên Production</h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• <strong>Cài đặt MySQL Tools:</strong> Đảm bảo server có <code className="bg-amber-100 px-1 rounded">mysqldump</code> và <code className="bg-amber-100 px-1 rounded">mysql</code> commands</li>
              <li>• <strong>Permissions:</strong> User database cần quyền SELECT, LOCK TABLES, SHOW VIEW</li>
              <li>• <strong>Storage:</strong> Kiểm tra dung lượng disk còn trống cho backups</li>
              <li>• <strong>Security:</strong> Lưu backups ở nơi an toàn, có encryption nếu cần</li>
              <li>• <strong>Testing:</strong> Test restore trên môi trường staging trước</li>
              <li>• <strong>Monitoring:</strong> Setup alerts nếu backup fails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
