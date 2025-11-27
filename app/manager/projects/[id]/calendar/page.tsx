"use client"
import { useEffect, useState } from "react"
import { getProjectById, getTasksByProject } from "@/axios/api"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp, CheckCircle2, Circle, Clock } from "lucide-react"

function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)

    // Điều chỉnh để bắt đầu từ thứ 2
    startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7))
    endDate.setDate(endDate.getDate() + (6 - ((endDate.getDay() + 6) % 7)))

    const days = []
    const current = new Date(startDate)

    while (current <= endDate) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    return days
}

function getTaskColor(status?: string): string {
    if (status === "Hoàn thành") {
        return "text-green-600 bg-green-50 border-green-200"
    } else if (status === "Đang chạy") {
        return "text-blue-600 bg-blue-50 border-blue-200"
    } else if (status === "Chưa bắt đầu") {
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
    return "text-gray-600 bg-gray-50 border-gray-200"
}

function isDateInRange(date: Date, startDate: Date | null, endDate: Date | null): boolean {
    if (!startDate || !endDate) return false
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    return checkDate >= start && checkDate <= end
}

export default function ProjectCalendarPage({ params }: { params: { id: string } }) {
    const { id } = params
    const [project, setProject] = useState<any | null>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())

    useEffect(() => {
        const load = async () => {
            try {
                const p = await getProjectById(id)
                setProject(p)
                const t = await getTasksByProject(id)
                setTasks(t.tasks || [])
            } catch (err) {
                console.error("Load calendar error:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    const calendarDays = getCalendarDays(currentYear, currentMonth)

    const monthNames = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ]

    const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    }

    const toggleTaskExpand = (taskId: number) => {
        const newExpanded = new Set(expandedTasks)
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId)
        } else {
            newExpanded.add(taskId)
        }
        setExpandedTasks(newExpanded)
    }

    const getTasksForDate = (date: Date) => {
        const dateTasks: any[] = []

        // Chỉ lấy parent tasks cho logic hiển thị chính
        tasks.forEach(task => {
            const taskStartDate = task.ngayBatDau ? new Date(task.ngayBatDau) : null
            const taskEndDate = task.ngayKetThuc ? new Date(task.ngayKetThuc) : null

            // Check if parent task is active on this date
            const isParentActive = isDateInRange(date, taskStartDate, taskEndDate)

            // Check if any subtask is active on this date
            const activeSubtasks = (task.subtasks || []).filter((sub: any) => {
                const subStart = sub.ngayBatDau ? new Date(sub.ngayBatDau) : null
                const subEnd = sub.ngayKetThuc ? new Date(sub.ngayKetThuc) : null
                return isDateInRange(date, subStart, subEnd)
            })

            if (isParentActive || activeSubtasks.length > 0) {
                dateTasks.push({
                    ...task,
                    activeSubtasks // Attach active subtasks for this date
                })
            }
        })

        return dateTasks
    }

    const selectedDateTasks = getTasksForDate(selectedDate)

    if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải lịch...</div>
    if (!project) return <div className="p-8 text-center text-red-500">Không tìm thấy dự án</div>

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon size={24} />
                        Calendar: {project.tenduan}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Lịch công việc theo tháng
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2 hover:bg-white rounded-md transition-all shadow-sm"
                            title="Tháng trước"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold min-w-[120px] text-center px-2">
                            {monthNames[currentMonth]} {currentYear}
                        </span>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-white rounded-md transition-all shadow-sm"
                            title="Tháng sau"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            const now = new Date()
                            setCurrentDate(now)
                            setSelectedDate(now)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Hôm nay
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Calendar Grid */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Week header */}
                        <div className="grid grid-cols-7 border-b bg-gray-50/50 rounded-t-xl">
                            {weekDays.map((day) => (
                                <div key={day} className="p-4 text-center text-sm font-semibold text-gray-600 border-r last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((date, index) => {
                                const isCurrentMonth = date.getMonth() === currentMonth
                                const isToday =
                                    date.getDate() === new Date().getDate() &&
                                    date.getMonth() === new Date().getMonth() &&
                                    date.getFullYear() === new Date().getFullYear()
                                const isSelected =
                                    date.getDate() === selectedDate.getDate() &&
                                    date.getMonth() === selectedDate.getMonth() &&
                                    date.getFullYear() === selectedDate.getFullYear()

                                const dayTasks = getTasksForDate(date)
                                const parentCount = dayTasks.length
                                const subtaskCount = dayTasks.reduce((acc, t) => acc + (t.activeSubtasks?.length || 0), 0)
                                const totalItems = parentCount + subtaskCount

                                // Calculate status counts
                                let completed = 0
                                let running = 0
                                let notStarted = 0

                                dayTasks.forEach(t => {
                                    if (t.trangThai === 'Hoàn thành') completed++
                                    else if (t.trangThai === 'Đang chạy') running++
                                    else notStarted++

                                    t.activeSubtasks?.forEach((s: any) => {
                                        if (s.trangThai === 'Hoàn thành') completed++
                                        else if (s.trangThai === 'Đang chạy') running++
                                        else notStarted++
                                    })
                                })

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                                            border-r border-b last:border-r-0 p-2 min-h-[100px] cursor-pointer transition-all flex flex-col
                                            ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white hover:bg-blue-50/30'}
                                            ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30 z-10' : ''}
                                        `}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <span className={`
                                                text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                                                ${isToday ? 'bg-blue-600 text-white shadow-md' : ''}
                                                ${isSelected && !isToday ? 'text-blue-600 bg-blue-100' : ''}
                                            `}>
                                                {date.getDate()}
                                            </span>
                                        </div>

                                        {totalItems > 0 && (
                                            <div className="flex-1 flex flex-col justify-end gap-1">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {completed > 0 && (
                                                        <div className="flex items-center gap-0.5 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium" title="Hoàn thành">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                            {completed}
                                                        </div>
                                                    )}
                                                    {running > 0 && (
                                                        <div className="flex items-center gap-0.5 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium" title="Đang chạy">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                            {running}
                                                        </div>
                                                    )}
                                                    {notStarted > 0 && (
                                                        <div className="flex items-center gap-0.5 bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium" title="Chưa bắt đầu">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                                            {notStarted}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-medium px-1">
                                                    {parentCount} task, {subtaskCount} sub
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Detailed Task List */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" />
                                Chi tiết ngày {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h2>
                            <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border shadow-sm">
                                {selectedDateTasks.length} công việc
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {selectedDateTasks.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium">Không có công việc nào</p>
                                    <p className="text-sm mt-1">Chọn ngày khác để xem lịch công việc</p>
                                </div>
                            ) : (
                                selectedDateTasks.map((task) => (
                                    <div key={task.id} className="group">
                                        {/* Parent Task Row */}
                                        <div
                                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4"
                                            onClick={() => toggleTaskExpand(task.id)}
                                        >
                                            <button className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                                                {expandedTasks.has(task.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-gray-900 text-lg">{task.tentask}</h3>
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getTaskColor(task.trangThai)}`}>
                                                        {task.trangThai}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarIcon size={14} />
                                                        {new Date(task.ngayBatDau).toLocaleDateString('vi-VN')} - {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                                                    </span>
                                                    {task.activeSubtasks?.length > 0 && (
                                                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                                                            {task.activeSubtasks.length} subtasks trong ngày
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtasks List */}
                                        {expandedTasks.has(task.id) && (
                                            <div className="bg-gray-50/50 border-t border-gray-100 pl-14 pr-4 py-2 space-y-2">
                                                {task.subtasks && task.subtasks.length > 0 ? (
                                                    task.subtasks.map((subtask: any) => {
                                                        const isActive = isDateInRange(
                                                            selectedDate,
                                                            subtask.ngayBatDau ? new Date(subtask.ngayBatDau) : null,
                                                            subtask.ngayKetThuc ? new Date(subtask.ngayKetThuc) : null
                                                        )

                                                        return (
                                                            <div
                                                                key={subtask.id}
                                                                className={`
                                                                    flex items-center justify-between p-3 rounded-lg border
                                                                    ${isActive ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-100/50 border-transparent opacity-60'}
                                                                `}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {subtask.trangThai === 'Hoàn thành' ? (
                                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                    ) : (
                                                                        <Circle className="w-5 h-5 text-gray-400" />
                                                                    )}
                                                                    <div>
                                                                        <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                            {subtask.tenSubtask}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {subtask.nguoiThucHien?.hoten || 'Chưa gán'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className={`text-xs px-2 py-1 rounded-full border ${getTaskColor(subtask.trangThai)}`}>
                                                                    {subtask.trangThai}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic py-2">Không có công việc con</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
