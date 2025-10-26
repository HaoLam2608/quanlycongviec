"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { getProjectById, getTasksByProject, getWorklogs } from "@/axios/api"
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





export default function ProjectTimelinePage({ params }: { params: { id: string } }) {
    const { id } = params
    const [project, setProject] = useState<any | null>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)



    useEffect(() => {
        const load = async () => {
            try {
                const p = await getProjectById(id)
                setProject(p)
                const t = await getTasksByProject(id)
                setTasks(t.tasks || [])
            } catch (err) {
                console.error("Load timeline error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])





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

    if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải timeline...</div>
    if (!project) return <div className="p-8 text-center text-red-500">Không tìm thấy dự án</div>
    if (!timeline)
        return (
            <div className="p-8 text-center text-muted-foreground">
                Không đủ dữ liệu để hiển thị timeline (cần ngày bắt đầu/kết thúc hoặc task dates).
            </div>
        )

    const basePxPerDay = Math.max(4, Math.floor((containerWidth - 200) / Math.max(1, timeline.totalDays)))
    const pxPerDay = Math.max(2, Math.min(40, Math.round(basePxPerDay * zoom)))
    const totalPx = pxPerDay * timeline.totalDays

    const dateToX = (d: Date) => {
        const offset = daysBetween(timeline.minDate, d)
        return Math.round((offset / Math.max(1, timeline.totalDays)) * totalPx)
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Timeline: {project.tenduan}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {timeline.minDate.toLocaleDateString("vi-VN")} — {timeline.maxDate.toLocaleDateString("vi-VN")}
                    </p>
                </div>
            </div>

            <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-2 p-4 border-b border-border bg-muted/30">
                    <div className="text-sm font-medium text-foreground">Zoom: {zoom.toFixed(1)}x</div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                            className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                            title="Zoom out"
                        >
                            <ZoomOut size={18} />
                        </button>
                        <button
                            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                            className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                            title="Zoom in"
                        >
                            <ZoomIn size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto p-4">
                    <div ref={containerRef} style={{ width: Math.max(totalPx, 600) }}>
                        {/* Calendar header: Months / Weeks / Days */}
                        <div className="mb-6">
                            <div style={{ display: "flex", gap: 8 }}>
                                <div style={{ width: 180 }} className="text-sm font-semibold text-foreground">
                                    &nbsp;
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ position: "relative", height: 28 }}>
                                        {(() => {
                                            const days = buildHeaderDays(timeline.minDate, timeline.totalDays)
                                            const monthGroups: Array<{ startIndex: number; length: number; label: string }> = []
                                            let cursor = 0
                                            while (cursor < days.length) {
                                                const m = days[cursor].getMonth()
                                                const y = days[cursor].getFullYear()
                                                let end = cursor
                                                while (end < days.length && days[end].getMonth() === m && days[end].getFullYear() === y) end++
                                                monthGroups.push({
                                                    startIndex: cursor,
                                                    length: end - cursor,
                                                    label: `${y}-${String(m + 1).padStart(2, "0")}`,
                                                })
                                                cursor = end
                                            }
                                            return monthGroups.map((mg, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        position: "absolute",
                                                        left: mg.startIndex * pxPerDay,
                                                        width: Math.max(6, mg.length * pxPerDay),
                                                        height: 28,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        paddingLeft: 8,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                    }}
                                                    className="text-primary bg-primary/5 border-r border-border"
                                                >
                                                    {mg.label}
                                                </div>
                                            ))
                                        })()}
                                    </div>

                                    <div style={{ position: "relative", height: 22, borderTop: "1px solid var(--border)" }}>
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
                                                <div
                                                    key={idx}
                                                    style={{
                                                        position: "absolute",
                                                        left: wg.startIndex * pxPerDay,
                                                        width: Math.max(6, wg.length * pxPerDay),
                                                        height: 22,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        paddingLeft: 6,
                                                        fontSize: 11,
                                                    }}
                                                    className="text-muted-foreground border-r border-border"
                                                >
                                                    {wg.label}
                                                </div>
                                            ))
                                        })()}
                                    </div>

                                    <div style={{ position: "relative", height: 22, borderTop: "1px solid var(--border)" }}>
                                        {buildHeaderDays(timeline.minDate, timeline.totalDays).map((d, i) => {
                                            // Chỉ hiển thị ngày đầu tháng hoặc ngày đầu tuần
                                            const isFirstOfMonth = d.getDate() === 1;
                                            const isMonday = d.getDay() === 1;
                                            if (!isFirstOfMonth && !isMonday && i !== 0 && i !== timeline.totalDays) return null;
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        position: "absolute",
                                                        left: i * pxPerDay,
                                                        width: pxPerDay * 2,
                                                        height: 22,
                                                        textAlign: "center",
                                                        fontSize: 11,
                                                        fontWeight: isFirstOfMonth ? 700 : 400,
                                                        color: isFirstOfMonth ? '#2563eb' : '#64748b',
                                                    }}
                                                    className="border-r border-border/50 flex items-center justify-center"
                                                >
                                                    {d.getDate()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Tasks</h3>
                            <div className="space-y-4">
                                {tasks.map((task) => {
                                    const hasTaskDates = !!(task.ngayBatDau || task.ngayKetThuc)
                                    const tStart = task.ngayBatDau ? new Date(task.ngayBatDau) : timeline.minDate
                                    const tEnd = task.ngayKetThuc ? new Date(task.ngayKetThuc) : timeline.maxDate
                                    const tx = hasTaskDates ? dateToX(tStart) : 0
                                    const tw = hasTaskDates ? Math.max(12, dateToX(tEnd) - tx) : 0

                                    return (
                                        <div key={task.id} className="border border-border rounded-lg bg-white/80 shadow-sm p-3 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4 py-2">
                                                <div style={{ width: 180 }} className="text-sm font-semibold text-primary truncate">
                                                    <span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-0.5 mr-2 text-xs font-mono">T-{task.id}</span>
                                                    {task.tentask}
                                                </div>
                                                <div style={{ position: "relative", height: 32, flex: 1 }}>
                                                    {hasTaskDates && (
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                left: tx,
                                                                width: tw,
                                                                height: 22,
                                                                borderRadius: 8,
                                                                fontSize: 13,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                paddingLeft: 12,
                                                                background: 'linear-gradient(90deg, #2563eb 60%, #60a5fa 100%)',
                                                                color: '#fff',
                                                                boxShadow: '0 2px 8px 0 #2563eb22',
                                                                cursor: 'pointer',
                                                            }}
                                                            className="font-semibold group relative hover:brightness-110 transition-all"
                                                            title={`Từ ${tStart.toLocaleDateString('vi-VN')} đến ${tEnd.toLocaleDateString('vi-VN')}`}
                                                        >
                                                            <span>{task.tentask}</span>
                                                            <span className="absolute left-0 -top-7 hidden group-hover:block bg-black/80 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                                                                {`Từ ${tStart.toLocaleDateString('vi-VN')} đến ${tEnd.toLocaleDateString('vi-VN')}`}
                                                            </span>
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
                                                    const sw = hasStDates ? Math.max(8, dateToX(sEnd) - sx) : 0
                                                    return (
                                                        <div
                                                            key={st.id}
                                                            className="flex items-center gap-4 py-1.5 px-2 hover:bg-orange-50 rounded transition-colors"
                                                        >
                                                            <div
                                                                style={{ width: 180, paddingLeft: 28 }}
                                                                className="text-xs text-orange-700 truncate font-medium"
                                                            >
                                                                ↳ {st.tenSubtask || st.name}
                                                            </div>
                                                            <div style={{ position: "relative", height: 18, flex: 1 }}>
                                                                {hasStDates && (
                                                                    <div
                                                                        title={`Từ ${sStart.toLocaleDateString('vi-VN')} đến ${sEnd.toLocaleDateString('vi-VN')}`}
                                                                        style={{
                                                                            position: "absolute",
                                                                            left: sx,
                                                                            width: sw,
                                                                            height: 12,
                                                                            borderRadius: 6,
                                                                            background: 'linear-gradient(90deg, #f59e42 60%, #fbbf24 100%)',
                                                                            boxShadow: '0 1px 4px 0 #f59e4222',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                        className="font-medium group relative hover:brightness-110 transition-all"
                                                                    >
                                                                        <span className="absolute left-0 -top-7 hidden group-hover:block bg-black/80 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                                                                            {`Từ ${sStart.toLocaleDateString('vi-VN')} đến ${sEnd.toLocaleDateString('vi-VN')}`}
                                                                        </span>
                                                                    </div>
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
