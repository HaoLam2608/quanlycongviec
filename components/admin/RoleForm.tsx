"use client"

import { useState, useEffect } from "react"
import { X, Save } from "lucide-react"
import { createRole, roleAPI, updateRole } from "@/axios/adminApi"

interface RoleFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editRole?: any
}

interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description: string
}

export default function RoleForm({ isOpen, onClose, onSuccess, editRole }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<{ [key: string]: Permission[] }>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadPermissions()
      if (editRole) {
        setFormData({
          name: editRole.name || "",
          description: editRole.description || ""
        })
        // Lấy permissions của role hiện tại
        const rolePermissions = editRole.permissions?.map((p: any) => p.id) || []
        setSelectedPermissions(rolePermissions)
      } else {
        setFormData({
          name: "",
          description: ""
        })
        setSelectedPermissions([])
      }
      setMessage("")
    }
  }, [isOpen, editRole])

  const loadPermissions = async () => {
    try {
      const response = await roleAPI.getPermissions()
      setPermissions(response.data.permissions)
      setGroupedPermissions(response.data.groupedPermissions)
    } catch (error: any) {
      setMessage(error.message || "Lỗi khi tải danh sách quyền")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setMessage("Vui lòng nhập tên vai trò")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const submitData = {
        ...formData,
        permissions: selectedPermissions
      }

      if (editRole) {
        await updateRole(editRole.id, submitData)
        setMessage("Cập nhật vai trò thành công")
      } else {
        await createRole(submitData)
        setMessage("Tạo vai trò thành công")
      }

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } catch (error: any) {
      console.log(error)
      setMessage(error.message || "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const toggleResourcePermissions = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource]?.map(p => p.id) || []
    const allSelected = resourcePermissions.every(id => selectedPermissions.includes(id))
    
    if (allSelected) {
      // Bỏ chọn tất cả permissions của resource
      setSelectedPermissions(prev => prev.filter(id => !resourcePermissions.includes(id)))
    } else {
      // Chọn tất cả permissions của resource
      setSelectedPermissions(prev => [...new Set([...prev, ...resourcePermissions])])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {editRole ? "Sửa vai trò" : "Thêm vai trò mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tên vai trò */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên vai trò *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên vai trò"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mô tả vai trò"
            />
          </div>

          {/* Quyền hạn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quyền hạn
            </label>
            <div className="space-y-4 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
              {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                <div key={resource} className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`resource-${resource}`}
                      checked={resourcePermissions.every(p => selectedPermissions.includes(p.id))}
                      onChange={() => toggleResourcePermissions(resource)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`resource-${resource}`} className="ml-2 text-sm font-medium text-gray-700 capitalize">
                      {resource}
                    </label>
                  </div>
                  <div className="ml-6 space-y-1">
                    {resourcePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`permission-${permission.id}`} className="ml-2 text-sm text-gray-600">
                          {permission.description || permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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