"use client"
import { useEffect, useState } from "react"
import { getMemberTasks } from "@/axios/api"
import { Target } from "lucide-react"

export default function MyTasksModal({ projectId }: { projectId: number | string }) {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fmt = (v: any) => {
        if (v === null || v === undefined) return '—'
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
        // common user object shape: { id, hoten, manv }
        if (typeof v === 'object') {
            if (v.hoten) return String(v.hoten)
            if (v.name) return String(v.name)
            try { return JSON.stringify(v) } catch (e) { return 'object' }
        }
        return String(v)
    }

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setLoading(true)
                const res = await getMemberTasks({ projectId: Number(projectId) })
                if (!mounted) return
                // API may wrap tasks in res.tasks or send array directly
                const t = Array.isArray(res) ? res : res.tasks || res.data || []
                setTasks(t)
            } catch (err) {
                console.error('Load my tasks error', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [projectId])

    if (loading) return <div className="p-6">Đang tải công việc...</div>
    if (!tasks || tasks.length === 0) return <div className="p-6 text-center text-muted-foreground">Không có công việc cá nhân trong dự án này.</div>

    return (
        <div className="p-4 space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Target className="w-5 h-5" /> Công việc của tôi</h3>
            <div className="space-y-2">
                {tasks.map(task => (
                    <div key={task.id} className="border border-border rounded-md p-3 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">{fmt(task.tentask ?? task.name)}</div>
                                <div className="text-sm text-muted-foreground">Trạng thái: {fmt(task.trangThai ?? task.status)}</div>
                            </div>
                            <div className="text-sm text-gray-500">Hạn: {task.ngayKetThuc ? new Date(task.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}</div>
                        </div>
                        {task.mota && <p className="text-sm text-gray-600 mt-2">{fmt(task.mota)}</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}
