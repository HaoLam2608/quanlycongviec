"use client"

import { useState } from "react"
import { Save, X } from "lucide-react"
import { createPermission } from "@/axios/adminApi"

interface Props {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function PermissionForm({ isOpen, onClose, onSuccess }: Props) {
    const [form, setForm] = useState({ resource: "", action: "", description: "", name: "" })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.resource || !form.action) {
            setMessage('Vui lòng nhập resource và action')
            return
        }

        try {
            setLoading(true)
            await createPermission(form)
            setMessage('Tạo permission thành công')
            setTimeout(() => {
                onSuccess()
                onClose()
            }, 800)
        } catch (err: any) {
            setMessage(err.message || 'Lỗi khi tạo permission')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thêm quyền mới</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource *</label>
                        <input 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500" 
                            value={form.resource} 
                            onChange={(e) => setForm({ ...form, resource: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action *</label>
                        <input 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500" 
                            value={form.action} 
                            onChange={(e) => setForm({ ...form, action: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500" 
                            value={form.name} 
                            onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <input 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500" 
                            value={form.description} 
                            onChange={(e) => setForm({ ...form, description: e.target.value })} 
                        />
                    </div>

                    {message && (
                        <div className={`p-2 rounded ${
                            message.includes('thành công') 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                            {message}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
