"use client"

import { useState, useEffect } from "react"
import { X, Save } from "lucide-react"
import { createUser, updateUser, getRoles } from "@/axios/adminApi"
import { uploadAvatar } from "@/axios/userApi"
import { adminUploadAvatar } from "@/axios/adminUserApi"

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editUser?: any
}

interface Role {
  id: number
  name: string
  description: string
}

export default function UserFormEnhanced({ isOpen, onClose, onSuccess, editUser }: UserFormProps) {
  const [formData, setFormData] = useState({
    manv: "",
    hoten: "",
    chucvu: "",
    sdt: "",
    email: "",
    roleId: "",
    password: "",
    avatarFile: null as File | null,
    avatarUrl: ""
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadRoles()
      if (editUser) {
        let avatarUrl = editUser.avatarUrl || "";
        if ((!avatarUrl || avatarUrl === "") && editUser.id) {
          avatarUrl = `/users/${editUser.id}/avatar`;
        }
        if (avatarUrl && avatarUrl.startsWith('/users/')) {
          avatarUrl = `https://taskhadflow-api.nibies.space${avatarUrl}`;
        }
        setFormData({
          manv: editUser.manv || "",
          hoten: editUser.hoten || "",
          chucvu: editUser.chucvu || "",
          sdt: editUser.sdt || "",
          email: editUser.email || "",
          roleId: editUser.roleId?.toString() || "",
          password: "",
          avatarFile: null,
          avatarUrl
        })
      } else {
        setFormData({
          manv: "",
          hoten: "",
          chucvu: "",
          sdt: "",
          email: "",
          roleId: "",
          password: "",
          avatarFile: null,
          avatarUrl: ""
        })
      }
      setMessage("")
    }
  }, [isOpen, editUser])

  const loadRoles = async () => {
    try {
      const data = await getRoles()
      setRoles(data.roles)
    } catch (error: any) {
      setMessage(error.message || "Lỗi khi tải danh sách vai trò")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.manv || !formData.hoten || !formData.roleId) {
      setMessage("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    if (!editUser && !formData.password) {
      setMessage("Vui lòng nhập mật khẩu")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      let submitData: any = {
        ...formData,
        roleId: parseInt(formData.roleId)
      }

      if (editUser && !formData.password) {
        const { password, ...dataWithoutPassword } = submitData
        submitData = dataWithoutPassword
      }

      if (editUser) {
        await updateUser(editUser.id, submitData)
        if (formData.avatarFile) {
          await adminUploadAvatar(editUser.id, formData.avatarFile)
        }
        setMessage("Cập nhật người dùng thành công")
      } else {
        await createUser(submitData)
        setMessage("Tạo người dùng thành công")
      }

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } catch (error: any) {
      setMessage(error.message || "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    const { name, value, files } = target

    if (name === "avatarFile" && files && files[0]) {
      setFormData(prev => ({
        ...prev,
        avatarFile: files[0],
        avatarUrl: URL.createObjectURL(files[0])
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleResetPassword = async () => {
    if (!editUser) return;
    setLoading(true);
    setMessage("");
    try {
      await updateUser(editUser.id, { password: "123456" });
      setMessage("Đã đặt lại mật khẩu thành công: 123456");
    } catch (error: any) {
      setMessage(error.message || "Có lỗi khi reset mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            {editUser ? (
              <>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Chỉnh sửa thông tin người dùng
              </>
            ) : (
              <>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Thêm người dùng mới
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ảnh đại diện</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tải lên ảnh của bạn</p>
              </div>

              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border-4 border-white dark:border-gray-700 flex items-center justify-center shadow-xl overflow-hidden">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="avatar" className="object-cover w-full h-full rounded-full" />
                  ) : (
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-20 h-20 text-blue-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                    </svg>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <label htmlFor="avatarFile" className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Chọn ảnh
                </span>
                <input id="avatarFile" type="file" name="avatarFile" accept="image/*" onChange={handleChange} className="hidden" />
              </label>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG, GIF</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tối đa 2MB</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mã nhân viên */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  Mã nhân viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="manv"
                  value={formData.manv}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder="Nhập mã nhân viên"
                />
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hoten"
                  value={formData.hoten}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder="Nhập họ và tên"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder="Nhập email"
                />
              </div>

              {/* Chức vụ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Chức vụ
                </label>
                <input
                  type="text"
                  name="chucvu"
                  value={formData.chucvu}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder="Nhập chức vụ"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Số điện thoại
                </label>
                <input
                  type="text"
                  name="sdt"
                  value={formData.sdt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* Mật khẩu */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Mật khẩu {!editUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editUser}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder={editUser ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"}
                />
                {editUser && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Bỏ trống nếu không muốn thay đổi mật khẩu hiện tại
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Message + Action Buttons */}
          <div className="mt-8 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium flex items-center gap-3 ${message.includes("thành công") || message.includes("Đã đặt lại") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message.includes("thành công") || message.includes("Đã đặt lại") ? (
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-semibold"
              >
                Hủy bỏ
              </button>

              {editUser && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset MK: 123456
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? "Đang xử lý..." : (editUser ? "Cập nhật" : "Tạo mới")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
