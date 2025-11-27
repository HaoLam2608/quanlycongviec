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

interface BatchWorklogEntry {
    id: string // temporary id for tracking
    selectedSubtaskId: number | null
    taskName: string
    project: string
    startTime: string
    endTime: string
    description: string
}

interface TimerState {
    isRunning: boolean
    startTime: Date | null
    currentTask: string
    currentProject: string
    elapsedSeconds: number
    selectedSubtaskId: number | null
}

interface MultiTimer {
    id: string
    subtaskId: number
    taskName: string
    project: string
    isRunning: boolean
    isPaused: boolean
    startTime: Date
    pausedTime: number // total paused seconds
    elapsedSeconds: number
}

interface MySubtask {
    id: number
    tenSubtask: string
    trangThai: string
    taskId: number
    task?: {
        id: number
        tentask: string
        duan?: {
            id: number
            tenduan: string
        } | null
    } | null
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

    // Batch worklog entry state
    const [batchWorklogs, setBatchWorklogs] = useState<BatchWorklogEntry[]>([
        {
            id: Date.now().toString(),
            selectedSubtaskId: null,
            taskName: "",
            project: "",
            startTime: "",
            endTime: "",
            description: ""
        }
    ])
    const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0])
    const [isBatchMode, setIsBatchMode] = useState(false)

    // Multi-timer state
    const [multiTimers, setMultiTimers] = useState<MultiTimer[]>([])
    const [isMultiTimerMode, setIsMultiTimerMode] = useState(false)

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
        const accessToken = localStorage.getItem('accesstoken')
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
            console.log('Loaded subtasks:', response.subtasks);
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

    // Update multi-timers
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (multiTimers.some(t => t.isRunning && !t.isPaused)) {
            interval = setInterval(() => {
                setMultiTimers(prev => prev.map(timer => {
                    if (timer.isRunning && !timer.isPaused) {
                        const now = new Date()
                        const elapsed = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000) - timer.pausedTime
                        return { ...timer, elapsedSeconds: elapsed }
                    }
                    return timer
                }))
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [multiTimers])

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
                alert('Vui lòng chọn công việc (subtask) trước khi bấm dừng.')
                setTimer({ isRunning: false, startTime: null, currentTask: "", currentProject: "", elapsedSeconds: 0, selectedSubtaskId: null })
                return
            }

            // Calculate actual elapsed time from startTime to now
            const now = new Date()
            const actualElapsedSeconds = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000)
            const hours = parseFloat((actualElapsedSeconds / 3600).toFixed(2))

            console.log('Stop timer:', { actualElapsedSeconds, hours, startTime: timer.startTime, now })

            // Do not create worklogs with zero hours (backend rejects falsy hours)
            if (!hours || hours <= 0) {
                alert('Thời gian ghi nhận quá ngắn (dưới 0.01h), worklog sẽ không được tạo.')
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

                console.log('Creating worklog:', worklogData)

                await createWorklog(worklogData)
                await loadWorklogs() // Reload worklogs to show the new one
                alert(`Đã lưu worklog: ${hoursToHMS(hours)}`)
            } catch (error: any) {
                console.error('Error creating worklog:', error)
                alert(`Có lỗi khi lưu worklog: ${error.message || 'Unknown error'}`)
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

    // Convert seconds to HH:MM:SS format
    const secondsToHMS = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = Math.floor(totalSeconds % 60)
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    // Convert HH:MM:SS format to seconds
    const hmsToSeconds = (hms: string): number => {
        const parts = hms.split(':')
        if (parts.length !== 3) return 0

        const hours = parseInt(parts[0]) || 0
        const minutes = parseInt(parts[1]) || 0
        const seconds = parseInt(parts[2]) || 0

        return hours * 3600 + minutes * 60 + seconds
    }

    // Convert decimal hours to HH:MM:SS format
    const hoursToHMS = (decimalHours: number): string => {
        const totalSeconds = Math.floor(decimalHours * 3600)
        return secondsToHMS(totalSeconds)
    }

    const calculateTotalHours = () => {
        return worklogs.reduce((total, log) => total + log.hours, 0)
    }

    const calculateTotalTimeHMS = () => {
        const totalSeconds = worklogs.reduce((sum, log) => sum + (log.hours * 3600), 0)
        return secondsToHMS(totalSeconds)
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
                    parentTask: parentSubtask?.task?.tentask || 'Unknown Task'
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
                    currentProject: selectedSubtask.task?.duan?.tenduan || "Không có dự án"
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
                    project: selectedSubtask.task?.duan?.tenduan || "Không có dự án"
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

    // Batch worklog functions
    const addBatchEntry = () => {
        setBatchWorklogs([
            ...batchWorklogs,
            {
                id: Date.now().toString(),
                selectedSubtaskId: null,
                taskName: "",
                project: "",
                startTime: "",
                endTime: "",
                description: ""
            }
        ])
    }

    const removeBatchEntry = (id: string) => {
        if (batchWorklogs.length === 1) {
            alert('Phải có ít nhất 1 công việc!')
            return
        }
        setBatchWorklogs(batchWorklogs.filter(entry => entry.id !== id))
    }

    const updateBatchEntry = (id: string, field: keyof BatchWorklogEntry, value: any) => {
        setBatchWorklogs(batchWorklogs.map(entry => {
            if (entry.id === id) {
                const updated = { ...entry, [field]: value }

                // Auto-fill task name and project when subtask is selected
                if (field === 'selectedSubtaskId' && value) {
                    const selectedSubtask = mySubtasks.find(s => s.id === value)
                    if (selectedSubtask) {
                        updated.taskName = selectedSubtask.tenSubtask
                        updated.project = selectedSubtask.task?.duan?.tenduan || "Không có dự án"
                    }
                }

                return updated
            }
            return entry
        }))
    }

    const submitBatchWorklogs = async () => {
        if (!currentUser) {
            alert('Chưa tải được thông tin user!')
            return
        }

        // Validate all entries
        const validEntries = batchWorklogs.filter(entry =>
            entry.selectedSubtaskId && entry.startTime && entry.endTime
        )

        if (validEntries.length === 0) {
            alert('Vui lòng điền đầy đủ thông tin cho ít nhất 1 công việc!')
            return
        }

        if (validEntries.length < batchWorklogs.length) {
            if (!confirm(`Chỉ có ${validEntries.length}/${batchWorklogs.length} công việc hợp lệ. Bạn có muốn tiếp tục thêm các công việc hợp lệ?`)) {
                return
            }
        }

        try {
            let successCount = 0
            let errorCount = 0

            for (const entry of validEntries) {
                try {
                    const startHour = parseInt(entry.startTime.split(':')[0])
                    const startMinute = parseInt(entry.startTime.split(':')[1])
                    const endHour = parseInt(entry.endTime.split(':')[0])
                    const endMinute = parseInt(entry.endTime.split(':')[1])

                    const startTotalMinutes = startHour * 60 + startMinute
                    const endTotalMinutes = endHour * 60 + endMinute
                    const totalMinutes = endTotalMinutes - startTotalMinutes

                    if (totalMinutes <= 0) {
                        console.warn(`Skipping entry ${entry.taskName}: invalid time range`)
                        errorCount++
                        continue
                    }

                    const hours = parseFloat((totalMinutes / 60).toFixed(2))

                    const worklogData = {
                        userId: currentUser.id,
                        subtaskId: entry.selectedSubtaskId!,
                        hours,
                        note: entry.description,
                        date: batchDate
                    }

                    await createWorklog(worklogData)
                    successCount++
                } catch (error) {
                    console.error(`Error creating worklog for ${entry.taskName}:`, error)
                    errorCount++
                }
            }

            await loadWorklogs()

            if (errorCount > 0) {
                alert(`Đã thêm ${successCount} worklog thành công. ${errorCount} worklog thất bại.`)
            } else {
                alert(`Đã thêm thành công ${successCount} worklog!`)
            }

            // Reset form
            setIsAddModalOpen(false)
            setIsBatchMode(false)
            setBatchWorklogs([{
                id: Date.now().toString(),
                selectedSubtaskId: null,
                taskName: "",
                project: "",
                startTime: "",
                endTime: "",
                description: ""
            }])
            setBatchDate(new Date().toISOString().split('T')[0])
        } catch (error) {
            console.error('Error submitting batch worklogs:', error)
            alert('Có lỗi khi tạo worklog!')
        }
    }

    // Multi-timer functions
    const addMultiTimer = (subtaskId: number) => {
        const selectedSubtask = mySubtasks.find(s => s.id === subtaskId)
        if (!selectedSubtask) return

        // Check if timer for this subtask already exists
        const existingTimer = multiTimers.find(t => t.subtaskId === subtaskId)
        if (existingTimer) {
            alert('Timer cho công việc này đã tồn tại!')
            return
        }

        const newTimer: MultiTimer = {
            id: Date.now().toString(),
            subtaskId,
            taskName: selectedSubtask.tenSubtask,
            project: selectedSubtask.task?.duan?.tenduan || "Không có dự án",
            isRunning: true,
            isPaused: false,
            startTime: new Date(),
            pausedTime: 0,
            elapsedSeconds: 0
        }

        setMultiTimers([...multiTimers, newTimer])
    }

    const pauseMultiTimer = (timerId: string) => {
        setMultiTimers(prev => prev.map(timer => {
            if (timer.id === timerId) {
                return {
                    ...timer,
                    isPaused: true,
                    pausedTime: timer.pausedTime + timer.elapsedSeconds
                }
            }
            return timer
        }))
    }

    const resumeMultiTimer = (timerId: string) => {
        setMultiTimers(prev => prev.map(timer => {
            if (timer.id === timerId) {
                return {
                    ...timer,
                    isPaused: false,
                    startTime: new Date(),
                    elapsedSeconds: 0
                }
            }
            return timer
        }))
    }

    const stopMultiTimer = async (timerId: string) => {
        const timerToStop = multiTimers.find(t => t.id === timerId)
        if (!timerToStop) return

        if (!currentUser) {
            alert('Chưa tải được thông tin user!')
            return
        }

        const totalSeconds = timerToStop.elapsedSeconds + timerToStop.pausedTime
        const hours = parseFloat((totalSeconds / 3600).toFixed(2))

        if (!hours || hours <= 0) {
            alert('Thời gian ghi nhận quá ngắn!')
            setMultiTimers(prev => prev.filter(t => t.id !== timerId))
            return
        }

        try {
            const worklogData = {
                userId: currentUser.id,
                subtaskId: timerToStop.subtaskId,
                hours,
                note: `Multi-timer: ${timerToStop.taskName}`,
                date: new Date().toISOString().split('T')[0]
            }

            await createWorklog(worklogData)
            await loadWorklogs()

            // Remove timer after successful save
            setMultiTimers(prev => prev.filter(t => t.id !== timerId))
            alert(`Đã lưu worklog: ${hours}h cho "${timerToStop.taskName}"`)
        } catch (error) {
            console.error('Error creating worklog:', error)
            alert('Có lỗi khi lưu worklog!')
        }
    }

    const removeMultiTimer = (timerId: string) => {
        if (confirm('Bạn có chắc muốn xóa timer này? Dữ liệu sẽ không được lưu.')) {
            setMultiTimers(prev => prev.filter(t => t.id !== timerId))
        }
    }

    const stopAllMultiTimers = async () => {
        if (multiTimers.length === 0) return

        if (!confirm(`Bạn có chắc muốn dừng và lưu tất cả ${multiTimers.length} timer?`)) {
            return
        }

        let successCount = 0
        let errorCount = 0

        for (const timer of multiTimers) {
            try {
                const totalSeconds = timer.elapsedSeconds + timer.pausedTime
                const hours = parseFloat((totalSeconds / 3600).toFixed(2))

                if (hours > 0) {
                    const worklogData = {
                        userId: currentUser!.id,
                        subtaskId: timer.subtaskId,
                        hours,
                        note: `Multi-timer: ${timer.taskName}`,
                        date: new Date().toISOString().split('T')[0]
                    }
                    await createWorklog(worklogData)
                    successCount++
                }
            } catch (error) {
                console.error(`Error saving timer ${timer.taskName}:`, error)
                errorCount++
            }
        }

        await loadWorklogs()
        setMultiTimers([])

        if (errorCount > 0) {
            alert(`Đã lưu ${successCount} worklog. ${errorCount} thất bại.`)
        } else {
            alert(`Đã lưu thành công ${successCount} worklog!`)
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Timer className="w-6 h-6 text-blue-600" />
                            Đếm giờ làm việc 
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsMultiTimerMode(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isMultiTimerMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Đếm giờ đơn
                            </button>
                            <button
                                onClick={() => setIsMultiTimerMode(true)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isMultiTimerMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Đếm giờ đa năng
                                {multiTimers.length > 0 && (
                                    <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                                        {multiTimers.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {!isMultiTimerMode ? (
                        // Single Timer Mode
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
                                        <p className="text-gray-500">Dừng hẹn giờ</p>
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
                                                    {subtask.tenSubtask} - {subtask.task?.tentask || 'N/A'}
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
                    ) : (
                        // Multi-Timer Mode
                        <div>
                            <div className="mb-4">
                                <div className="flex items-center gap-3">
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addMultiTimer(Number(e.target.value))
                                                e.target.value = "" // Reset selection
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                        disabled={loadingSubtasks}
                                    >
                                        <option value="">
                                            {loadingSubtasks ? "Đang tải..." : "Chọn công việc để thêm timer mới"}
                                        </option>
                                        {mySubtasks
                                            .filter(subtask => !multiTimers.find(t => t.subtaskId === subtask.id))
                                            .map(subtask => (
                                                <option key={subtask.id} value={subtask.id}>
                                                    {subtask.tenSubtask} - {subtask.task?.tentask || 'N/A'}
                                                </option>
                                            ))}
                                    </select>
                                    {multiTimers.length > 0 && (
                                        <button
                                            onClick={stopAllMultiTimers}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <Square className="w-4 h-4" />
                                            Dừng tất cả
                                        </button>
                                    )}
                                </div>
                            </div>

                            {multiTimers.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <Timer className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium mb-1">Chưa có bộ đếm giờ nào</p>
                                    <p className="text-gray-500 text-sm">Chọn công việc ở trên để bắt đầu đếm giờ mới</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {multiTimers.map((mt) => (
                                        <div key={mt.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="text-3xl font-mono font-bold text-blue-600">
                                                            {formatTime(mt.elapsedSeconds + mt.pausedTime)}
                                                        </div>
                                                        {mt.isPaused && (
                                                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                                <Pause className="w-3 h-3" />
                                                                Đã tạm dừng
                                                            </span>
                                                        )}
                                                        {!mt.isPaused && mt.isRunning && (
                                                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                                <Play className="w-3 h-3" />
                                                                Đang chạy
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        <span className="font-semibold">{mt.taskName}</span>
                                                        <span className="text-gray-500 mx-2">•</span>
                                                        <span className="text-gray-600">{mt.project}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {!mt.isPaused ? (
                                                        <button
                                                            onClick={() => pauseMultiTimer(mt.id)}
                                                            className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-1 text-sm"
                                                        >
                                                            <Pause className="w-4 h-4" />
                                                            Tạm dừng
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => resumeMultiTimer(mt.id)}
                                                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                            Tiếp tục
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => stopMultiTimer(mt.id)}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                                                    >
                                                        <Square className="w-4 h-4" />
                                                        Lưu & Dừng
                                                    </button>
                                                    <button
                                                        onClick={() => removeMultiTimer(mt.id)}
                                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {multiTimers.length > 1 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                                    <span className="font-semibold text-blue-900">Tổng thời gian:</span>
                                                </div>
                                                <div className="text-2xl font-mono font-bold text-blue-600">
                                                    {formatTime(
                                                        multiTimers.reduce((total, t) => total + t.elapsedSeconds + t.pausedTime, 0)
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-blue-700 mt-1">
                                                {multiTimers.length} công việc đang được theo dõi
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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
                                    }) : 'Tất cả nhật ký'}
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
                                <p className="text-xl font-bold text-blue-600">{calculateTotalTimeHMS()}</p>
                            </div>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm nhật ký
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có nhật ký</h3>
                            <p className="text-gray-500 mb-4">Bắt đầu ghi nhận thời gian làm việc của bạn</p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Thêm nhật ký đầu tiên
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
                                                            {hoursToHMS(group.totalHours)}
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
                                                        {group.worklogs.length} nhật ký
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
                                                            <span className="text-gray-400">↳</span> nhật ký chi tiết
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
                                                                {hoursToHMS(worklog.hours)}
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
                                            {calculateTotalTimeHMS()}
                                            {!selectedDate && worklogs.length > 0 && (
                                                <div className="text-xs font-normal text-gray-500">
                                                    ({worklogs.length} nhật ký)
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
                    <div
                        className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            setIsAddModalOpen(false)
                            setIsBatchMode(false)
                        }}
                    >
                        <div
                            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Thêm nhật ký</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsBatchMode(false)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isBatchMode
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Đơn lẻ
                                        </button>
                                        <button
                                            onClick={() => setIsBatchMode(true)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isBatchMode
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Nhiều công việc
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {!isBatchMode ? (
                                // Single worklog form
                                <>
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
                                                        {subtask.tenSubtask} - {subtask.task?.tentask || 'N/A'}
                                                    </option>
                                                ))}
                                            </select>
                                            {mySubtasks.length === 0 && !loadingSubtasks && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    Không tìm thấy công việc nào. Vui lòng kiểm tra lại.
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
                                            onClick={() => {
                                                setIsAddModalOpen(false)
                                                setIsBatchMode(false)
                                            }}
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
                                </>
                            ) : (
                                // Batch worklog form
                                <>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày làm việc chung</label>
                                            <input
                                                type="date"
                                                value={batchDate}
                                                onChange={(e) => setBatchDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-sm font-medium text-gray-700">Danh sách công việc</label>
                                                <button
                                                    onClick={addBatchEntry}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Thêm công việc
                                                </button>
                                            </div>

                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {batchWorklogs.map((entry, index) => (
                                                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="font-medium text-gray-900">Công việc #{index + 1}</span>
                                                            {batchWorklogs.length > 1 && (
                                                                <button
                                                                    onClick={() => removeBatchEntry(entry.id)}
                                                                    className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <select
                                                                    value={entry.selectedSubtaskId || ""}
                                                                    onChange={(e) => updateBatchEntry(entry.id, 'selectedSubtaskId', e.target.value ? Number(e.target.value) : null)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    disabled={loadingSubtasks}
                                                                >
                                                                    <option value="">
                                                                        {loadingSubtasks ? "Đang tải..." : "Chọn công việc"}
                                                                    </option>
                                                                    {mySubtasks.map(subtask => (
                                                                        <option key={subtask.id} value={subtask.id}>
                                                                            {subtask.tenSubtask} - {subtask.task?.tentask || 'N/A'}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <input
                                                                        type="time"
                                                                        value={entry.startTime}
                                                                        onChange={(e) => updateBatchEntry(entry.id, 'startTime', e.target.value)}
                                                                        placeholder="Giờ bắt đầu"
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <input
                                                                        type="time"
                                                                        value={entry.endTime}
                                                                        onChange={(e) => updateBatchEntry(entry.id, 'endTime', e.target.value)}
                                                                        placeholder="Giờ kết thúc"
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <textarea
                                                                    value={entry.description}
                                                                    onChange={(e) => updateBatchEntry(entry.id, 'description', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    rows={2}
                                                                    placeholder="Mô tả công việc (tùy chọn)"
                                                                />
                                                            </div>

                                                            {entry.selectedSubtaskId && entry.startTime && entry.endTime && (() => {
                                                                const startHour = parseInt(entry.startTime.split(':')[0])
                                                                const startMinute = parseInt(entry.startTime.split(':')[1])
                                                                const endHour = parseInt(entry.endTime.split(':')[0])
                                                                const endMinute = parseInt(entry.endTime.split(':')[1])
                                                                const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
                                                                const hours = (totalMinutes / 60).toFixed(2)
                                                                return totalMinutes > 0 ? (
                                                                    <div className="text-sm text-blue-600 font-medium flex items-center gap-2">
                                                                        <Clock className="w-4 h-4" />
                                                                        Thời gian: {hours}h
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-sm text-red-600">
                                                                        Thời gian không hợp lệ
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <div className="text-blue-600 mt-0.5">
                                                    <BarChart3 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900">Tổng cộng</p>
                                                    <p className="text-xs text-blue-700 mt-1">
                                                        {batchWorklogs.filter(e => e.selectedSubtaskId && e.startTime && e.endTime).length} công việc hợp lệ
                                                        {' • '}
                                                        {batchWorklogs.reduce((total, entry) => {
                                                            if (entry.startTime && entry.endTime) {
                                                                const startHour = parseInt(entry.startTime.split(':')[0])
                                                                const startMinute = parseInt(entry.startTime.split(':')[1])
                                                                const endHour = parseInt(entry.endTime.split(':')[0])
                                                                const endMinute = parseInt(entry.endTime.split(':')[1])
                                                                const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
                                                                return total + (totalMinutes > 0 ? totalMinutes / 60 : 0)
                                                            }
                                                            return total
                                                        }, 0).toFixed(2)}h tổng thời gian
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border-t border-gray-200 flex gap-3">
                                        <button
                                            onClick={() => {
                                                setIsAddModalOpen(false)
                                                setIsBatchMode(false)
                                                setBatchWorklogs([{
                                                    id: Date.now().toString(),
                                                    selectedSubtaskId: null,
                                                    taskName: "",
                                                    project: "",
                                                    startTime: "",
                                                    endTime: "",
                                                    description: ""
                                                }])
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={submitBatchWorklogs}
                                            disabled={batchWorklogs.filter(e => e.selectedSubtaskId && e.startTime && e.endTime).length === 0}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm {batchWorklogs.filter(e => e.selectedSubtaskId && e.startTime && e.endTime).length} worklog
                                        </button>
                                    </div>
                                </>
                            )}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (HH:MM:SS)</label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: 02:30:00"
                                        value={hoursToHMS(editForm.hours)}
                                        onChange={(e) => {
                                            const seconds = hmsToSeconds(e.target.value)
                                            const hours = seconds / 3600
                                            setEditForm(prev => prev ? ({ ...prev, hours: hours }) : prev)
                                        }}
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