"use client"
import { useEffect, useState } from "react"
import { getProjectById, getTasksByProject } from "@/axios/api"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

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
        return "bg-green-500"
    } else if (status === "Đang chạy") {
        return "bg-blue-500"
    } else if (status === "Chưa bắt đầu") {
        return "bg-red-500"
    }
    return "bg-gray-500"
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

    const getTasksForDate = (date: Date) => {
        const allTasks: any[] = []

        tasks.forEach(task => {
            // Kiểm tra task chính
            const taskStartDate = task.ngayBatDau ? new Date(task.ngayBatDau) : null
            const taskEndDate = task.ngayKetThuc ? new Date(task.ngayKetThuc) : null

            if (isDateInRange(date, taskStartDate, taskEndDate)) {
                allTasks.push({
                    ...task,
                    type: 'task',
                    title: task.tentask,
                    status: task.trangThai
                })
            }

            // Kiểm tra subtasks
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach((subtask: any) => {
                    const subtaskStartDate = subtask.ngayBatDau ? new Date(subtask.ngayBatDau) : null
                    const subtaskEndDate = subtask.ngayKetThuc ? new Date(subtask.ngayKetThuc) : null

                    if (isDateInRange(date, subtaskStartDate, subtaskEndDate)) {
                        allTasks.push({
                            ...subtask,
                            type: 'subtask',
                            title: subtask.tenSubtask || subtask.name,
                            parentTask: task.tentask,
                            status: subtask.trangThai
                        })
                    }
                })
            }
        })

        return allTasks
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải lịch...</div>
    if (!project) return <div className="p-8 text-center text-red-500">Không tìm thấy dự án</div>

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Tháng trước"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-lg font-semibold min-w-[120px] text-center">
                            {monthNames[currentMonth]} {currentYear}
                        </span>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Tháng sau"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                        Hôm nay
                    </button>
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 p-6">
                <div className="bg-white rounded-lg shadow-sm h-full">
                    {/* Week header */}
                    <div className="grid grid-cols-7 border-b">
                        {weekDays.map((day) => (
                            <div key={day} className="p-3 text-center font-semibold text-gray-600 border-r last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 h-full">
                        {calendarDays.map((date, index) => {
                            const isCurrentMonth = date.getMonth() === currentMonth
                            const isToday =
                                date.getDate() === new Date().getDate() &&
                                date.getMonth() === new Date().getMonth() &&
                                date.getFullYear() === new Date().getFullYear()

                            const dayTasks = getTasksForDate(date)

                            return (
                                <div
                                    key={index}
                                    className={`border-r border-b last:border-r-0 p-2 min-h-[120px] ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                                        }`}
                                >
                                    <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                                        }`}>
                                        {date.getDate()}
                                    </div>

                                    {/* Tasks for this date */}
                                    <div className="space-y-1">
                                        {dayTasks.slice(0, 3).map((task, taskIndex) => (
                                            <div
                                                key={taskIndex}
                                                className={`text-xs p-1 rounded text-white truncate ${getTaskColor(task.status)}`}
                                                title={`${task.title} ${task.type === 'subtask' ? `(${task.parentTask})` : ''}`}
                                            >
                                                {task.type === 'subtask' ? '• ' : ''}{task.title}
                                            </div>
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <div className="text-xs text-gray-500 font-medium">
                                                +{dayTasks.length - 3} công việc khác
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white border-t px-6 py-3">
                <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-600 font-medium">Trạng thái:</span>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-xs text-gray-600">Chưa bắt đầu</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-xs text-gray-600">Đang chạy</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-xs text-gray-600">Hoàn thành</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
