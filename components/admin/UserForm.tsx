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

export default function UserForm({ isOpen, onClose, onSuccess, editUser }: UserFormProps) {
  const [formData, setFormData] = useState({
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
        // Nếu là đường dẫn backend thì prefix domain như layout
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

      // Nếu là sửa và không nhập password mới thì bỏ password
      if (editUser && !formData.password) {
        const { password, ...dataWithoutPassword } = submitData
        submitData = dataWithoutPassword
      }

      if (editUser) {
        await updateUser(editUser.id, submitData)
        // Nếu có file ảnh mới thì upload (admin quyền sửa user bất kỳ)
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
    const { name, value, files } = e.target as any;
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

  // Reset password handler
  const handleResetPassword = async () => {
    if (!editUser) return;
    setLoading(true);
    setMessage("");
    try {
      await updateUser(editUser.id, { password: "123456" });
      setMessage("Đã đặt lại mật khẩu 123456");
    } catch (error: any) {
      setMessage(error.message || "Có lỗi khi reset mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-2xl font-semibold text-gray-900">
            {editUser ? "Sửa người dùng" : "Thêm người dùng mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center justify-center gap-3 md:col-span-1 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
            <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center mb-2 shadow">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <svg xmlns='http://www.w3.org/2000/svg' className='w-16 h-16 text-gray-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
              )}
            </div>
            <label htmlFor="avatarFile" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
              Chọn ảnh đại diện
              <input id="avatarFile" type="file" name="avatarFile" accept="image/*" onChange={handleChange} className="hidden" />
            </label>
            <span className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG, tối đa 2MB</span>
          </div>

          {/* Info fields */}
          <div className="space-y-4 md:col-span-1">
            {/* Mã nhân viên */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã nhân viên *</label>
              <input type="text" name="manv" value={formData.manv} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập mã nhân viên" />
            </div>
            {/* Họ tên */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
              <input type="text" name="hoten" value={formData.hoten} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập họ và tên" />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập email" />
            </div>
            {/* Chức vụ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chức vụ</label>
              <input type="text" name="chucvu" value={formData.chucvu} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập chức vụ" />
            </div>
            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <input type="text" name="sdt" value={formData.sdt} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập số điện thoại" />
            </div>
            {/* Vai trò */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò *</label>
              <select name="roleId" value={formData.roleId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Chọn vai trò</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu {!editUser && "*"}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editUser} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={editUser ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"} />
            </div>
          </div>

          {/* Message + Buttons */}
          <div className="md:col-span-2 space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes("thành công") || message.includes("Đã đặt lại") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{message}</div>
            )}
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" />{loading ? "Đang lưu..." : "Lưu"}</button>
              {editUser && (
                <button type="button" onClick={handleResetPassword} disabled={loading} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">Đặt lại mật khẩu 123456</button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}