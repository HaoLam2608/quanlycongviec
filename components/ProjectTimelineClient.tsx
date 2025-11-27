"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { getProjectById, getTasksByProject } from "@/axios/api"
import { ZoomIn, ZoomOut, Calendar, ChevronRight, ChevronLeft, Info } from "lucide-react"

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
    const [zoom, setZoom] = useState(3.5)
    const [containerWidth, setContainerWidth] = useState(900)
    const containerRef = useRef<HTMLDivElement | null>(null)

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

        // Add padding days
        minDate = new Date(minDate)
        minDate.setDate(minDate.getDate() - 7)
        maxDate = new Date(maxDate)
        maxDate.setDate(maxDate.getDate() + 7)

        if (minDate > maxDate) maxDate = new Date(minDate)
        const totalDays = Math.max(1, daysBetween(minDate, maxDate))

        return { minDate, maxDate, totalDays }
    }, [project, tasks])

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )

    if (!project) return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <Calendar className="w-16 h-16 mb-4 text-gray-300" />
            <p>Không tìm thấy dự án</p>
        </div>
    )

    if (!timeline) return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <Calendar className="w-16 h-16 mb-4 text-gray-300" />
            <p>Chưa có dữ liệu thời gian cho dự án này</p>
            <p className="text-sm mt-2">Cập nhật ngày bắt đầu/kết thúc cho dự án hoặc công việc để xem timeline</p>
        </div>
    )

    const basePxPerDay = Math.max(4, Math.floor((containerWidth - 250) / Math.max(1, timeline.totalDays)))
    const pxPerDay = Math.max(10, Math.round(basePxPerDay * zoom))
    const totalPx = pxPerDay * timeline.totalDays

    const dateToX = (d: Date) => {
        const offset = daysBetween(timeline.minDate, d)
        return Math.round((offset / Math.max(1, timeline.totalDays)) * totalPx)
    }

    const today = new Date()
    const todayX = dateToX(today)
    const isTodayVisible = today >= timeline.minDate && today <= timeline.maxDate

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white z-20">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        Timeline: {project.tenduan}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                            {timeline.minDate.toLocaleDateString('vi-VN')}
                        </span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                            {timeline.maxDate.toLocaleDateString('vi-VN')}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span>{timeline.totalDays} ngày</span>
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 hover:text-blue-600"
                        title="Thu nhỏ"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-xs font-medium text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(z => Math.min(10, z + 0.1))}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 hover:text-blue-600"
                        title="Phóng to"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-auto relative custom-scrollbar" ref={containerRef}>
                <div style={{ width: Math.max(totalPx + 250, containerWidth), minHeight: '100%' }} className="relative">

                    {/* Grid Background */}
                    <div className="absolute inset-0 pointer-events-none" style={{ left: 250 }}>
                        {buildHeaderDays(timeline.minDate, timeline.totalDays).map((d, i) => (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: i * pxPerDay,
                                    width: 1,
                                    height: '100%',
                                    backgroundColor: d.getDay() === 0 || d.getDay() === 6 ? '#f3f4f6' : 'transparent',
                                    borderLeft: '1px dashed #e5e7eb'
                                }}
                            />
                        ))}
                        {isTodayVisible && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: todayX,
                                    width: 2,
                                    height: '100%',
                                    backgroundColor: '#ef4444',
                                    zIndex: 10
                                }}
                            >
                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                        <div className="flex">
                            <div className="w-[250px] flex-shrink-0 bg-gray-50 border-r border-gray-200 p-3 font-semibold text-gray-700 flex items-end pb-2 z-20 sticky left-0">
                                Công việc
                            </div>
                            <div className="flex-1 relative h-14">
                                {/* Months */}
                                <div className="absolute top-0 left-0 right-0 h-7 border-b border-gray-100">
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
                                                label: new Date(y, m).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
                                            })
                                            cursor = end
                                        }
                                        return monthGroups.map((mg, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    position: 'absolute',
                                                    left: mg.startIndex * pxPerDay,
                                                    width: mg.length * pxPerDay,
                                                }}
                                                className="h-full flex items-center px-2 text-xs font-bold text-gray-600 bg-gray-50/50 border-r border-gray-200 truncate"
                                            >
                                                {mg.label}
                                            </div>
                                        ))
                                    })()}
                                </div>
                                {/* Days */}
                                <div className="absolute bottom-0 left-0 right-0 h-7">
                                    {buildHeaderDays(timeline.minDate, timeline.totalDays).map((d, i) => {
                                        const isWeekend = d.getDay() === 0 || d.getDay() === 6
                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    position: 'absolute',
                                                    left: i * pxPerDay,
                                                    width: pxPerDay,
                                                }}
                                                className={`h-full flex flex-col items-center justify-center text-[10px] border-r border-gray-100 ${isWeekend ? 'bg-gray-50 text-gray-500' : 'text-gray-700'}`}
                                            >
                                                <span className="font-bold">{d.getDate()}</span>
                                                <span className="text-[9px] uppercase">{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks List */}
                    <div className="py-2">
                        {tasks.map((task, index) => {
                            const hasTaskDates = !!(task.ngayBatDau || task.ngayKetThuc)
                            const tStart = task.ngayBatDau ? new Date(task.ngayBatDau) : timeline.minDate
                            const tEnd = task.ngayKetThuc ? new Date(task.ngayKetThuc) : timeline.maxDate
                            const tx = hasTaskDates ? dateToX(tStart) : 0
                            const tw = hasTaskDates ? Math.max(24, dateToX(tEnd) - tx) : 0

                            // Use solid background colors to prevent content showing through sticky columns
                            const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50'

                            return (
                                <div key={task.id} className={`group ${rowBgClass}`}>
                                    {/* Main Task Row */}
                                    <div className="flex items-center h-10 hover:bg-blue-50 transition-colors">
                                        <div className={`w-[250px] flex-shrink-0 border-r border-gray-200 px-4 py-2 flex items-center gap-2 sticky left-0 z-10 ${rowBgClass} group-hover:bg-blue-50 transition-colors`}>
                                            <div className={`w-2 h-2 rounded-full ${hasTaskDates ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-sm font-medium text-gray-700 truncate flex-1" title={task.tentask}>
                                                {task.tentask}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">#{task.id}</span>
                                        </div>
                                        <div className="flex-1 relative h-full">
                                            {hasTaskDates && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        left: tx,
                                                        width: tw,
                                                        top: 6,
                                                        height: 28
                                                    }}
                                                    className="group/bar relative"
                                                >
                                                    <div className="w-full h-full rounded-md bg-gradient-to-r from-blue-500 to-blue-400 shadow-sm border border-blue-600/20 cursor-pointer hover:brightness-110 transition-all flex items-center px-2 overflow-hidden">
                                                        <span className="text-xs font-medium text-white whitespace-nowrap drop-shadow-md">{task.tentask}</span>
                                                    </div>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block z-50 w-max max-w-xs">
                                                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                                                            <p className="font-bold mb-1">{task.tentask}</p>
                                                            <p className="text-gray-300">
                                                                {tStart.toLocaleDateString('vi-VN')} - {tEnd.toLocaleDateString('vi-VN')}
                                                            </p>
                                                            <p className="text-gray-400 mt-1">
                                                                {Math.ceil((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)) + 1} ngày
                                                            </p>
                                                        </div>
                                                        <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subtasks */}
                                    {task.subtasks?.map((st: any) => {
                                        const hasStDates = !!(st.ngayBatDau || st.ngayKetThuc)
                                        const sStart = st.ngayBatDau ? new Date(st.ngayBatDau) : timeline.minDate
                                        const sEnd = st.ngayKetThuc ? new Date(st.ngayKetThuc) : timeline.maxDate
                                        const sx = hasStDates ? dateToX(sStart) : 0
                                        const sw = hasStDates ? Math.max(20, dateToX(sEnd) - sx) : 0

                                        return (
                                            <div key={st.id} className="flex items-center h-8 hover:bg-orange-50 transition-colors">
                                                <div className={`w-[250px] flex-shrink-0 border-r border-gray-200 pl-8 pr-4 py-1 flex items-center gap-2 sticky left-0 z-10 ${rowBgClass} group-hover:bg-orange-50 transition-colors`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                    <span className="text-xs text-gray-600 truncate flex-1" title={st.tenSubtask || st.name}>
                                                        {st.tenSubtask || st.name}
                                                    </span>
                                                </div>
                                                <div className="flex-1 relative h-full">
                                                    {hasStDates && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                left: sx,
                                                                width: sw,
                                                                top: 6,
                                                                height: 20
                                                            }}
                                                            className="group/subbar relative"
                                                        >
                                                            <div className="w-full h-full rounded bg-orange-400/80 hover:bg-orange-500 transition-colors cursor-pointer shadow-sm"></div>

                                                            {/* Subtask Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/subbar:block z-50 w-max max-w-xs">
                                                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                                                                    <p className="font-bold mb-1">{st.tenSubtask || st.name}</p>
                                                                    <p className="text-gray-300">
                                                                        {sStart.toLocaleDateString('vi-VN')} - {sEnd.toLocaleDateString('vi-VN')}
                                                                    </p>
                                                                </div>
                                                                <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
