"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { getProjectById, getTasksByProject } from "@/axios/api"
import { ZoomIn, ZoomOut } from "lucide-react"

function daysBetween(a: Date, b: Date) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
    return Math.floor((utc2 - utc1) / _MS_PER_DAY)
}

function getISOWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function buildHeaderDays(minDate: Date, totalDays: number) {
    const days: Date[] = []
    for (let i = 0; i <= totalDays; i++) {
        const d = new Date(minDate)
        d.setDate(d.getDate() + i)
        days.push(d)
    }
    return days
}

export default function ProjectTimelineClient({ projectId }: { projectId: string | number }) {
    const [project, setProject] = useState<any | null>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setLoading(true)
                const p = await getProjectById(String(projectId))
                if (!mounted) return
                setProject(p)
                const t = await getTasksByProject(projectId)
                if (!mounted) return
                setTasks(t.tasks || [])
            } catch (err) {
                console.error("Load timeline error:", err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [projectId])

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [zoom, setZoom] = useState(1)
    const [containerWidth, setContainerWidth] = useState(900)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new ResizeObserver(() => {
            setContainerWidth(el.clientWidth || 900)
        })
        obs.observe(el)
        setContainerWidth(el.clientWidth || 900)
        return () => obs.disconnect()
    }, [])

    const timeline = useMemo(() => {
        if (!project) return null

        const projStart = project.ngaybatdau ? new Date(project.ngaybatdau) : null
        const projEnd = project.ngayketthuc ? new Date(project.ngayketthuc) : null

        let minDate = projStart
        let maxDate = projEnd

        tasks.forEach((task) => {
            if (task.ngayBatDau) {
                const d = new Date(task.ngayBatDau)
                if (!minDate || d < minDate) minDate = d
            }
            if (task.ngayKetThuc) {
                const d = new Date(task.ngayKetThuc)
                if (!maxDate || d > maxDate) maxDate = d
            }
            if (task.subtasks && task.subtasks.length) {
                task.subtasks.forEach((st: any) => {
                    if (st.ngayBatDau) {
                        const d = new Date(st.ngayBatDau)
                        if (!minDate || d < minDate) minDate = d
                    }
                    if (st.ngayKetThuc) {
                        const d = new Date(st.ngayKetThuc)
                        if (!maxDate || d > maxDate) maxDate = d
                    }
                })
            }
        })

        if (!minDate || !maxDate) return null

        if (minDate > maxDate) maxDate = new Date(minDate)
        const totalDays = Math.max(1, daysBetween(minDate, maxDate))

        return { minDate, maxDate, totalDays }
    }, [project, tasks])

    if (loading) return <div className="p-6 text-center text-muted-foreground">Đang tải timeline...</div>
    if (!project) return <div className="p-6 text-center text-red-500">Không tìm thấy dự án</div>
    if (!timeline)
        return (
            <div className="p-6 text-center text-muted-foreground">Không đủ dữ liệu để hiển thị timeline (cần ngày bắt đầu/kết thúc hoặc task dates).</div>
        )

    const basePxPerDay = Math.max(4, Math.floor((containerWidth - 200) / Math.max(1, timeline.totalDays)))
    const pxPerDay = Math.max(2, Math.min(40, Math.round(basePxPerDay * zoom)))
    const totalPx = pxPerDay * timeline.totalDays

    const dateToX = (d: Date) => {
        const offset = daysBetween(timeline.minDate, d)
        return Math.round((offset / Math.max(1, timeline.totalDays)) * totalPx)
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Timeline: {project.tenduan}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{timeline.minDate.toLocaleDateString('vi-VN')} — {timeline.maxDate.toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-2 hover:bg-muted rounded-md"> <ZoomOut size={16} /> </button>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 hover:bg-muted rounded-md"> <ZoomIn size={16} /> </button>
                </div>
            </div>

            <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto p-4">
                    <div ref={containerRef} style={{ width: Math.max(totalPx, 600) }}>
                        <div className="mb-6">
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ width: 180 }} className="text-sm font-semibold">&nbsp;</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ position: 'relative', height: 28 }}>
                                        {(() => {
                                            const days = buildHeaderDays(timeline.minDate, timeline.totalDays)
                                            const monthGroups: Array<{ startIndex: number; length: number; label: string }> = []
                                            let cursor = 0
                                            while (cursor < days.length) {
                                                const m = days[cursor].getMonth()
                                                const y = days[cursor].getFullYear()
                                                let end = cursor
                                                while (end < days.length && days[end].getMonth() === m && days[end].getFullYear() === y) end++
                                                monthGroups.push({ startIndex: cursor, length: end - cursor, label: `${y}-${String(m+1).padStart(2,'0')}` })
                                                cursor = end
                                            }
                                            return monthGroups.map((mg, idx) => (
                                                <div key={idx} style={{ position: 'absolute', left: mg.startIndex * pxPerDay, width: Math.max(6, mg.length * pxPerDay), height: 28, display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: 12, fontWeight: 600 }} className="text-primary bg-primary/5 border-r border-border">
                                                    {mg.label}
                                                </div>
                                            ))
                                        })()}
                                    </div>

                                    <div style={{ position: 'relative', height: 22, borderTop: '1px solid var(--border)' }}>
                                        {(() => {
                                            const days = buildHeaderDays(timeline.minDate, timeline.totalDays)
                                            const weekGroups: Array<{ startIndex: number; length: number; label: string }> = []
                                            let cursor = 0
                                            while (cursor < days.length) {
                                                const wk = getISOWeekNumber(days[cursor])
                                                let end = cursor + 1
                                                while (end < days.length && getISOWeekNumber(days[end]) === wk) end++
                                                weekGroups.push({ startIndex: cursor, length: end - cursor, label: `W${wk}` })
                                                cursor = end
                                            }
                                            return weekGroups.map((wg, idx) => (
                                                <div key={idx} style={{ position: 'absolute', left: wg.startIndex * pxPerDay, width: Math.max(6, wg.length * pxPerDay), height: 22, display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: 11 }} className="text-muted-foreground border-r border-border/50">
                                                    {wg.label}
                                                </div>
                                            ))
                                        })()}
                                    </div>

                                    <div style={{ position: 'relative', height: 22, borderTop: '1px solid var(--border)' }}>
                                        {buildHeaderDays(timeline.minDate, timeline.totalDays).map((d, i) => (
                                            <div key={i} style={{ position: 'absolute', left: i * pxPerDay, width: pxPerDay, height: 22, textAlign: 'center', fontSize: 11 }} className="text-foreground border-r border-border/50 flex items-center justify-center">
                                                {d.getDate()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h4 className="text-sm font-semibold mb-3">Tasks</h4>
                            <div className="space-y-2">
                                {tasks.map((task) => {
                                    const hasTaskDates = !!(task.ngayBatDau || task.ngayKetThuc)
                                    const tStart = task.ngayBatDau ? new Date(task.ngayBatDau) : timeline.minDate
                                    const tEnd = task.ngayKetThuc ? new Date(task.ngayKetThuc) : timeline.maxDate
                                    const tx = hasTaskDates ? dateToX(tStart) : 0
                                    const tw = hasTaskDates ? Math.max(6, dateToX(tEnd) - tx) : 0

                                    return (
                                        <div key={task.id} className="">
                                            <div className="flex items-center gap-4 py-2 hover:bg-muted/30 rounded px-2 transition-colors">
                                                <div style={{ width: 180 }} className="text-sm font-medium truncate">T-{task.id} {task.tentask}</div>
                                                <div style={{ position: 'relative', height: 28, flex: 1 }}>
                                                    {hasTaskDates && (
                                                        <div style={{ position: 'absolute', left: tx, width: tw, height: 18, borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', paddingLeft: 8 }} className="bg-primary text-primary-foreground shadow-sm font-medium">
                                                            {task.tentask}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                {task.subtasks?.map((st: any) => {
                                                    const hasStDates = !!(st.ngayBatDau || st.ngayKetThuc)
                                                    const sStart = st.ngayBatDau ? new Date(st.ngayBatDau) : timeline.minDate
                                                    const sEnd = st.ngayKetThuc ? new Date(st.ngayKetThuc) : timeline.maxDate
                                                    const sx = hasStDates ? dateToX(sStart) : 0
                                                    const sw = hasStDates ? Math.max(4, dateToX(sEnd) - sx) : 0
                                                    return (
                                                        <div key={st.id} className="flex items-center gap-4 py-1.5 hover:bg-muted/20 rounded px-2 transition-colors">
                                                            <div style={{ width: 180, paddingLeft: 20 }} className="text-sm text-muted-foreground truncate">↳ {st.tenSubtask || st.name}</div>
                                                            <div style={{ position: 'relative', height: 20, flex: 1 }}>
                                                                {hasStDates && (
                                                                    <div title={st.tenSubtask || st.name} style={{ position: 'absolute', left: sx, width: sw, height: 12, borderRadius: 3 }} className="bg-orange-500 shadow-sm" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
