"use client"

import { useState, useEffect } from "react"
import { X, Save } from "lucide-react"
import { createUser, updateUser, getRoles } from "@/axios/adminApi"

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
    roleId: "",
    password: ""
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadRoles()
      if (editUser) {
        setFormData({
          manv: editUser.manv || "",
          hoten: editUser.hoten || "",
          chucvu: editUser.chucvu || "",
          sdt: editUser.sdt || "",
          roleId: editUser.roleId?.toString() || "",
          password: ""
        })
      } else {
        setFormData({
          manv: "",
          hoten: "",
          chucvu: "",
          sdt: "",
          roleId: "",
          password: ""
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
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mã nhân viên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã nhân viên *
            </label>
            <input
              type="text"
              name="manv"
              value={formData.manv}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mã nhân viên"
            />
          </div>

          {/* Họ tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên *
            </label>
            <input
              type="text"
              name="hoten"
              value={formData.hoten}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Chức vụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chức vụ
            </label>
            <input
              type="text"
              name="chucvu"
              value={formData.chucvu}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập chức vụ"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="text"
              name="sdt"
              value={formData.sdt}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập số điện thoại"
            />
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò *
            </label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn vai trò</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu {!editUser && "*"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!editUser}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={editUser ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"}
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes("thành công") 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}