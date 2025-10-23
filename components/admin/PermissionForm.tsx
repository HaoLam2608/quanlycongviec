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
            <div className="bg-white rounded-2xl w-full max-w-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Thêm quyền mới</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Resource *</label>
                        <input className="w-full px-3 py-2 border rounded" value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Action *</label>
                        <input className="w-full px-3 py-2 border rounded" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input className="w-full px-3 py-2 border rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input className="w-full px-3 py-2 border rounded" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>

                    {message && <div className={`p-2 rounded ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Đang lưu...' : 'Lưu'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
