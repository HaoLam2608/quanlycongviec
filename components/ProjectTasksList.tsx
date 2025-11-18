"use client"
import { useEffect, useState } from 'react'
import { getTasksByProject } from '@/axios/api'

export default function ProjectTasksList({ projectId }: { projectId: number | string }) {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fmt = (v: any) => {
        if (v === null || v === undefined) return '—'
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
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
                const res = await getTasksByProject(projectId)
                const arr = res.tasks || res || []
                if (!mounted) return
                setTasks(arr)
            } catch (err) {
                console.error('Load project tasks error', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [projectId])

    if (loading) return <div className="p-4">Đang tải công việc dự án...</div>
    if (!tasks || tasks.length === 0) return <div className="p-4 text-muted-foreground">Chưa có công việc nào cho dự án này.</div>

    return (
        <div className="p-4 space-y-2">
            {tasks.map((t: any) => (
                <div key={t.id} className="bg-white border border-border rounded-md p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">{fmt(t.tentask ?? t.title ?? t.name)}</div>
                            <div className="text-xs text-muted-foreground">Người thực hiện: {fmt(t.nguoiThucHien ?? t.nguoiDuocGiao ?? t.nguoiThucHienId)}</div>
                        </div>
                        <div className="text-sm text-gray-600">{fmt(t.trangThai ?? t.status)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Bắt đầu: {t.ngayBatDau ? new Date(t.ngayBatDau).toLocaleDateString('vi-VN') : '—'} — Kết thúc: {t.ngayKetThuc ? new Date(t.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}</div>
                </div>
            ))}
        </div>
    )
}
