"use client"
import React, { useState, useEffect } from "react"
import {
    Clock,
    Calendar,
    Plus,
    Edit3,
    Trash2,
    Play,
    Pause,
    Square,
    BarChart3,
    Download,
    ChevronLeft,
    ChevronRight,
    Timer,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { getMySubtasks, getMyWorklogs, createWorklog, updateWorklog as apiUpdateWorklog, deleteWorklog as apiDeleteWorklog } from "@/axios/api"

interface Worklog {
    id: number
    date: string
    taskName: string
    project: string
    hours: number
    description: string
    taskId?: number
    subtaskId?: number
    createdAt?: string
    updatedAt?: string
}

interface TimerState {
    isRunning: boolean
    startTime: Date | null
    currentTask: string
    currentProject: string
    elapsedSeconds: number
    selectedSubtaskId: number | null
}

interface MySubtask {
    id: number
    tenSubtask: string
    trangThai: string
    taskId: number
    tentask: string
    duanId: number | null
    tenduan: string | null
}

export default function TimesheetPage() {
    const [worklogs, setWorklogs] = useState<Worklog[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null) // null = show all
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingWorklog, setEditingWorklog] = useState<Worklog | null>(null)
    const [timer, setTimer] = useState<TimerState>({
        isRunning: false,
        startTime: null,
        currentTask: "",
        currentProject: "",
        elapsedSeconds: 0,
        selectedSubtaskId: null
    })
    const [mySubtasks, setMySubtasks] = useState<MySubtask[]>([])
    const [loadingSubtasks, setLoadingSubtasks] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

    const [newWorklog, setNewWorklog] = useState({
        date: new Date().toISOString().split('T')[0],
        taskName: "",
        project: "",
        startTime: "",
        endTime: "",
        description: "",
        selectedSubtaskId: null as number | null
    })

    useEffect(() => {
        loadWorklogs()
    }, [selectedDate])

    useEffect(() => {
        const initData = async () => {
            await loadMySubtasks()
            await loadCurrentUser()
            await loadWorklogs() // Load all worklogs initially
        }
        initData()
    }, [])

    const loadCurrentUser = async () => {
        // Load from individual localStorage fields (matching login format)
        const accessToken = localStorage.getItem('accessToken')
        const userId = localStorage.getItem('userId')
        const hoten = localStorage.getItem('hoten')
        const manv = localStorage.getItem('manv')
        const role = localStorage.getItem('role')

        if (accessToken && userId && hoten) {
            const userData = {
                id: parseInt(userId),
                userId: parseInt(userId),
                hoten: hoten,
                manv: manv,
                role: role
            }
            setCurrentUser(userData)
        } else {
            // Fallback for development
            setCurrentUser({ id: 1, hoten: 'Test User', manv: 'DEV001', role: 'member' })
        }
    }

    const loadMySubtasks = async () => {
        setLoadingSubtasks(true)
        try {
            const response = await getMySubtasks()
            setMySubtasks(response.subtasks || [])
        } catch (error) {
            console.error('Error loading subtasks:', error)
        } finally {
            setLoadingSubtasks(false)
        }
    }

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (timer.isRunning && timer.startTime) {
            interval = setInterval(() => {
                const now = new Date()
                const elapsed = Math.floor((now.getTime() - timer.startTime!.getTime()) / 1000)
                setTimer(prev => ({ ...prev, elapsedSeconds: elapsed }))
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [timer.isRunning, timer.startTime])

    const loadWorklogs = async () => {
        try {
            setLoading(true)
            const params: { date?: string } = {}
            if (selectedDate) {
                params.date = selectedDate.toISOString().split('T')[0]
            }
            const response = await getMyWorklogs(params)
            setWorklogs(response.worklogs || [])
        } catch (error) {
            console.error("Error loading worklogs:", error)
            setWorklogs([])
        } finally {
            setLoading(false)
        }
    }

    const startTimer = (taskName: string, project: string, subtaskId: number | null = null) => {
        setTimer({
            isRunning: true,
            startTime: new Date(),
            currentTask: taskName,
            currentProject: project,
            elapsedSeconds: 0,
            selectedSubtaskId: subtaskId
        })
    }

    const pauseTimer = () => {
        setTimer(prev => ({ ...prev, isRunning: false }))
    }

    const stopTimer = async () => {
        // Only proceed if the timer was started
        if (timer.startTime) {
            // Basic validations
            if (!currentUser) {
                alert('Chưa tải được thông tin user. Worklog không được tạo.')
                // Reset timer state and return
                setTimer({ isRunning: false, startTime: null, currentTask: "", currentProject: "", elapsedSeconds: 0, selectedSubtaskId: null })
                return
            }

            // Ensure we have a task or subtask id. Currently we only support subtask-based timer.
            if (!timer.selectedSubtaskId) {
                alert('Vui lòng chọn công việc (subtask) trước khi bắt đầu timer.')
                setTimer({ isRunning: false, startTime: null, currentTask: "", currentProject: "", elapsedSeconds: 0, selectedSubtaskId: null })
                return
            }

            const hours = parseFloat((timer.elapsedSeconds / 3600).toFixed(2))

            // Do not create worklogs with zero hours (backend rejects falsy hours)
            if (!hours || hours <= 0) {
                alert('Thời gian ghi nhận quá ngắn, worklog sẽ không được tạo.')
                setTimer({ isRunning: false, startTime: null, currentTask: "", currentProject: "", elapsedSeconds: 0, selectedSubtaskId: null })
                return
            }

            try {
                const worklogData = {
                    userId: currentUser.id,
                    // taskId support can be added later. For timer we send subtaskId when available.
                    subtaskId: timer.selectedSubtaskId || undefined,
                    hours,
                    note: `Timer: ${timer.currentTask}`,
                    date: new Date().toISOString().split('T')[0]
                }

                await createWorklog(worklogData)
                await loadWorklogs() // Reload worklogs to show the new one
            } catch (error) {
                console.error('Error creating worklog:', error)
                alert('Có lỗi khi lưu worklog!')
            }
        }

        // Reset timer state
        setTimer({ isRunning: false, startTime: null, currentTask: "", currentProject: "", elapsedSeconds: 0, selectedSubtaskId: null })
    }

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const calculateTotalHours = () => {
        return worklogs.reduce((total, log) => total + log.hours, 0)
    }

    // Group worklogs by task/subtask
    const groupWorklogsByTask = () => {
        const groups: { [key: string]: { task: any, worklogs: Worklog[], isSubtask: boolean } } = {}

        worklogs.forEach(worklog => {
            let groupKey: string
            let taskInfo: any
            let isSubtask = false

            if (worklog.subtaskId) {
                // Group by subtask
                groupKey = `subtask-${worklog.subtaskId}`
                const parentSubtask = mySubtasks.find(s => s.id === worklog.subtaskId)
                taskInfo = {
                    id: worklog.subtaskId,
                    name: worklog.taskName,
                    project: worklog.project,
                    parentTask: parentSubtask?.tentask || 'Unknown Task'
                }
                isSubtask = true
            } else {
                // Group by main task
                groupKey = `task-${worklog.taskId}`
                taskInfo = {
                    id: worklog.taskId,
                    name: worklog.taskName,
                    project: worklog.project
                }
                isSubtask = false
            }

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    task: taskInfo,
                    worklogs: [],
                    isSubtask
                }
            }

            groups[groupKey].worklogs.push(worklog)
        })

        return Object.entries(groups).map(([key, group]) => ({
            key,
            ...group,
            totalHours: group.worklogs.reduce((sum, w) => sum + w.hours, 0)
        }))
    }

    const toggleTaskExpansion = (taskKey: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev)
            if (newSet.has(taskKey)) {
                newSet.delete(taskKey)
            } else {
                newSet.add(taskKey)
            }
            return newSet
        })
    }

    const handleTimerSubtaskSelection = (subtaskId: number | null) => {
        if (subtaskId) {
            const selectedSubtask = mySubtasks.find(s => s.id === subtaskId)
            if (selectedSubtask) {
                setTimer(prev => ({
                    ...prev,
                    selectedSubtaskId: subtaskId,
                    currentTask: selectedSubtask.tenSubtask,
                    currentProject: selectedSubtask.tenduan || "Không có dự án"
                }))
            }
        } else {
            setTimer(prev => ({
                ...prev,
                selectedSubtaskId: null,
                currentTask: "",
                currentProject: ""
            }))
        }
    }

    const handleSubtaskSelection = (subtaskId: number | null) => {
        if (subtaskId) {
            const selectedSubtask = mySubtasks.find(s => s.id === subtaskId)

            if (selectedSubtask) {
                setNewWorklog(prev => ({
                    ...prev,
                    selectedSubtaskId: subtaskId,
                    taskName: selectedSubtask.tenSubtask,
                    project: selectedSubtask.tenduan || "Không có dự án"
                }))
            }
        } else {
            setNewWorklog(prev => ({
                ...prev,
                selectedSubtaskId: null,
                taskName: "",
                project: ""
            }))
        }
    }

    const addWorklog = async () => {
        if (!currentUser) {
            alert('Chưa tải được thông tin user!')
            return
        }

        if (!newWorklog.selectedSubtaskId) {
            alert('Vui lòng chọn công việc!')
            return
        }

        if (!newWorklog.startTime || !newWorklog.endTime) {
            alert('Vui lòng nhập thời gian bắt đầu và kết thúc!')
            return
        }

        const startHour = parseInt(newWorklog.startTime.split(':')[0])
        const startMinute = parseInt(newWorklog.startTime.split(':')[1])
        const endHour = parseInt(newWorklog.endTime.split(':')[0])
        const endMinute = parseInt(newWorklog.endTime.split(':')[1])

        const startTotalMinutes = startHour * 60 + startMinute
        const endTotalMinutes = endHour * 60 + endMinute
        const totalMinutes = endTotalMinutes - startTotalMinutes
        const hours = parseFloat((totalMinutes / 60).toFixed(2))

        try {
            const worklogData = {
                userId: currentUser.id,
                subtaskId: newWorklog.selectedSubtaskId,
                hours,
                note: newWorklog.description,
                date: newWorklog.date
            }

            await createWorklog(worklogData)
            await loadWorklogs() // Reload worklogs
            setIsAddModalOpen(false)
            setNewWorklog({
                date: new Date().toISOString().split('T')[0],
                taskName: "",
                project: "",
                startTime: "",
                endTime: "",
                description: "",
                selectedSubtaskId: null
            })
        } catch (error) {
            console.error('Error creating worklog:', error)
            alert('Có lỗi khi tạo worklog!')
        }
    }

    const deleteWorklog = (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa worklog này?")) return
        // Call API to delete
        (async () => {
            try {
                await apiDeleteWorklog(id)
                // reload
                await loadWorklogs()
            } catch (err) {
                console.error('Error deleting worklog:', err)
                alert('Có lỗi khi xóa worklog')
            }
        })()
    }

    // Edit flow
    const [editForm, setEditForm] = useState<{ id: number; date: string; hours: number; description: string; subtaskId?: number | null } | null>(null)

    const openEdit = (worklog: Worklog) => {
        setEditingWorklog(worklog)
        setEditForm({ id: worklog.id, date: worklog.date, hours: worklog.hours, description: worklog.description || '', subtaskId: worklog.subtaskId || null })
    }

    const saveEdit = async () => {
        if (!editForm || !currentUser) return
        // Basic validation
        if (!editForm.hours || editForm.hours <= 0) {
            alert('Vui lòng nhập số giờ lớn hơn 0')
            return
        }

        try {
            await apiUpdateWorklog(editForm.id, {
                userId: currentUser.id,
                subtaskId: editForm.subtaskId || null,
                hours: editForm.hours,
                note: editForm.description,
                date: editForm.date
            })
            // close modal and reload
            setEditingWorklog(null)
            setEditForm(null)
            await loadWorklogs()
        } catch (err) {
            console.error('Error updating worklog:', err)
            alert('Có lỗi khi cập nhật worklog')
        }
    }

    const navigateDate = (direction: 'prev' | 'next') => {
        const currentDate = selectedDate || new Date()
        const newDate = new Date(currentDate)
        if (direction === 'prev') {
            newDate.setDate(newDate.getDate() - 1)
        } else {
            newDate.setDate(newDate.getDate() + 1)
        }
        setSelectedDate(newDate)
    }

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-9 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                    </div>

                    {/* Timer Section Skeleton */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4 py-8">
                            <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Calendar Navigation Skeleton */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
                                <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Worklogs Table Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                                <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <th key={i} className="px-6 py-3">
                                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map(i => (
                                        <tr key={i} className="border-b border-gray-100">
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Thời gian làm việc</h1>
                    <p className="text-gray-600">Theo dõi và ghi nhận thời gian làm việc hàng ngày</p>
                </div>

                {/* Timer Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Timer className="w-6 h-6 text-blue-600" />
                        Timer
                    </h2>

                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {timer.isRunning ? (
                                <div>
                                    <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
                                        {formatTime(timer.elapsedSeconds)}
                                    </div>
                                    <p className="text-gray-600">
                                        <span className="font-medium">{timer.currentTask}</span> - {timer.currentProject}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-4xl font-mono font-bold text-gray-400 mb-2">
                                        00:00:00
                                    </div>
                                    <p className="text-gray-500">Timer dừng</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {!timer.isRunning && timer.startTime === null && (
                                <div className="flex gap-2">
                                    <select
                                        value={timer.selectedSubtaskId || ""}
                                        onChange={(e) => handleTimerSubtaskSelection(e.target.value ? Number(e.target.value) : null)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg min-w-[200px]"
                                        disabled={loadingSubtasks}
                                    >
                                        <option value="">
                                            {loadingSubtasks ? "Đang tải..." : "Chọn công việc"}
                                        </option>
                                        {mySubtasks.map(subtask => (
                                            <option key={subtask.id} value={subtask.id}>
                                                {subtask.tenSubtask} - {subtask.tentask}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Dự án"
                                        value={timer.currentProject}
                                        onChange={(e) => setTimer(prev => ({ ...prev, currentProject: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                        readOnly
                                    />
                                    <button
                                        onClick={() => startTimer(timer.currentTask, timer.currentProject, timer.selectedSubtaskId)}
                                        disabled={!timer.currentTask || !timer.currentProject}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Play className="w-4 h-4" />
                                        Bắt đầu
                                    </button>
                                </div>
                            )}

                            {timer.isRunning && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={pauseTimer}
                                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                                    >
                                        <Pause className="w-4 h-4" />
                                        Tạm dừng
                                    </button>
                                    <button
                                        onClick={stopTimer}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                    >
                                        <Square className="w-4 h-4" />
                                        Dừng
                                    </button>
                                </div>
                            )}

                            {!timer.isRunning && timer.startTime !== null && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTimer(prev => ({ ...prev, isRunning: true }))}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Play className="w-4 h-4" />
                                        Tiếp tục
                                    </button>
                                    <button
                                        onClick={stopTimer}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                    >
                                        <Square className="w-4 h-4" />
                                        Dừng
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigateDate('prev')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <span className="text-xl font-semibold text-gray-900">
                                    {selectedDate ? selectedDate.toLocaleDateString('vi-VN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'Tất cả worklog'}
                                </span>
                            </div>

                            <button
                                onClick={() => navigateDate('next')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedDate === null
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setSelectedDate(new Date())}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedDate !== null
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Hôm nay
                                </button>
                                {selectedDate && (
                                    <input
                                        type="date"
                                        value={selectedDate.toISOString().split('T')[0]}
                                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Tổng thời gian hôm nay</p>
                                <p className="text-xl font-bold text-blue-600">{calculateTotalHours().toFixed(1)}h</p>
                            </div>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm worklog
                            </button>
                        </div>
                    </div>
                </div>

                {/* Worklogs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-blue-600" />
                                Nhật ký làm việc
                            </h2>
                            {worklogs.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedTasks(new Set(groupWorklogsByTask().map(g => g.key)))}
                                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        Mở rộng tất cả
                                    </button>
                                    <button
                                        onClick={() => setExpandedTasks(new Set())}
                                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        Thu gọn tất cả
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {worklogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có worklog</h3>
                            <p className="text-gray-500 mb-4">Bắt đầu ghi nhận thời gian làm việc của bạn</p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Thêm worklog đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {!selectedDate && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ngày
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Công việc & Loại
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dự án
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thời gian
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Chi tiết báo cáo
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {groupWorklogsByTask().map(group => (
                                        <React.Fragment key={group.key}>
                                            {/* Task Group Header */}
                                            <tr
                                                className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => toggleTaskExpansion(group.key)}
                                            >
                                                {!selectedDate && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {group.worklogs.length} ngày
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button className="text-gray-500 hover:text-gray-700">
                                                            {expandedTasks.has(group.key) ? (
                                                                <ChevronDown className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronUp className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${group.isSubtask
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {group.isSubtask ? 'Công việc nhỏ' : 'Công việc chính'}
                                                                </span>
                                                                <span className="font-medium text-gray-900">{group.task.name}</span>
                                                                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                                                                    #{group.task.id}
                                                                </span>
                                                            </div>
                                                            {group.isSubtask && group.task.parentTask && (
                                                                <div className="text-sm text-gray-500 ml-20 flex items-center gap-1">
                                                                    <span className="text-gray-400">↳</span>
                                                                    <span>Thuộc: </span>
                                                                    <span className="font-medium text-gray-700">{group.task.parentTask}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                                        <span className="text-gray-700 font-medium">{group.task.project}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                            <Clock className="w-4 h-4 inline mr-1" />
                                                            {group.totalHours.toFixed(1)}h
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            ({group.worklogs.length} lần)
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500 italic">
                                                        Nhấn để xem chi tiết
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-500">
                                                        {group.worklogs.length} worklog
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Individual Worklogs (collapsible) */}
                                            {expandedTasks.has(group.key) && group.worklogs.map(worklog => (
                                                <tr key={worklog.id} className="hover:bg-gray-50 bg-white">
                                                    {!selectedDate && (
                                                        <td className="px-6 py-4 whitespace-nowrap pl-12">
                                                            <div className="text-sm text-gray-900">
                                                                {new Date(worklog.date).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 pl-16">
                                                        <div className="text-sm text-gray-600">
                                                            <span className="text-gray-400">↳</span> Worklog chi tiết
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(worklog.createdAt || worklog.date).toLocaleTimeString('vi-VN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                <Clock className="w-4 h-4 inline mr-1" />
                                                                {worklog.hours}h
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-xs">
                                                            {worklog.description ? (
                                                                <div className="text-gray-600 text-sm">
                                                                    <div className="line-clamp-2">{worklog.description}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 italic text-sm">Không có mô tả</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEdit(worklog)}
                                                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteWorklog(worklog.id)}
                                                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={selectedDate ? 2 : 3} className="px-6 py-3 text-right font-semibold text-gray-900">
                                            {selectedDate ? 'Tổng ngày này:' : 'Tổng tất cả:'}
                                        </td>
                                        <td className="px-6 py-3 font-bold text-blue-600">
                                            {calculateTotalHours().toFixed(1)}h
                                            {!selectedDate && worklogs.length > 0 && (
                                                <div className="text-xs font-normal text-gray-500">
                                                    ({worklogs.length} worklog)
                                                </div>
                                            )}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add Worklog Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Thêm worklog</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                                    <input
                                        type="date"
                                        value={newWorklog.date}
                                        onChange={(e) => setNewWorklog({ ...newWorklog, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Công việc</label>
                                    <select
                                        value={newWorklog.selectedSubtaskId || ""}
                                        onChange={(e) => handleSubtaskSelection(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={loadingSubtasks}
                                    >
                                        <option value="">
                                            {loadingSubtasks ? "Đang tải..." : "Chọn công việc"}
                                        </option>
                                        {mySubtasks.map(subtask => (
                                            <option key={subtask.id} value={subtask.id}>
                                                {subtask.tenSubtask} - {subtask.tentask}
                                            </option>
                                        ))}
                                    </select>
                                    {mySubtasks.length === 0 && !loadingSubtasks && (
                                        <p className="text-sm text-red-600 mt-1">
                                            Không tìm thấy subtask nào. Vui lòng kiểm tra lại.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                                    <input
                                        type="text"
                                        value={newWorklog.project}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        placeholder="Tự động điền khi chọn công việc"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                                        <input
                                            type="time"
                                            value={newWorklog.startTime}
                                            onChange={(e) => setNewWorklog({ ...newWorklog, startTime: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                                        <input
                                            type="time"
                                            value={newWorklog.endTime}
                                            onChange={(e) => setNewWorklog({ ...newWorklog, endTime: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết báo cáo</label>
                                    <textarea
                                        value={newWorklog.description}
                                        onChange={(e) => setNewWorklog({ ...newWorklog, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        placeholder="Mô tả công việc đã thực hiện"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={addWorklog}
                                    disabled={!newWorklog.selectedSubtaskId || !newWorklog.startTime || !newWorklog.endTime}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Thêm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Worklog Modal */}
                {editingWorklog && editForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Sửa worklog</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                                    <input
                                        type="date"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, date: e.target.value }) : prev)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số giờ</label>
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0"
                                        value={editForm.hours}
                                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, hours: parseFloat(e.target.value) }) : prev)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết báo cáo</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        placeholder="Mô tả công việc đã thực hiện"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex gap-3">
                                <button
                                    onClick={() => { setEditingWorklog(null); setEditForm(null) }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={saveEdit}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}