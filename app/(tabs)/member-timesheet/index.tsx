import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { DateNavigation } from '../../../components/timesheet/DateNavigation';
import { FilterButtons } from '../../../components/timesheet/FilterButtons';
import { TaskSelectionModal } from '../../../components/timesheet/TaskSelectionModal';
import { TimerWidget } from '../../../components/timesheet/TimerWidget';
import { WorklogFormModal } from '../../../components/timesheet/WorklogFormModal';
import { WorklogList } from '../../../components/timesheet/WorklogList';
import { STORAGE_KEYS } from '../../../constants/api';
import { createWorklog, deleteWorklog, getMySubtasks, getMyWorklogs, updateWorklog } from '../../../src/axios/api';
import { MemberTask, TimerState, Worklog } from '../../../types/member';
import { styles } from './index.styles';

export default function MemberTimesheetScreen() {
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [tasks, setTasks] = useState<MemberTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // null = show all worklogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorklog, setEditingWorklog] = useState<Worklog | null>(null);
  const [isTaskSelectionModalOpen, setIsTaskSelectionModalOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [previousModalState, setPreviousModalState] = useState<'create' | 'edit' | null>(null);
  const [taskSelectionMode, setTaskSelectionMode] = useState<'timer' | 'worklog'>('timer');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    currentTask: '',
    currentProject: '',
    elapsedSeconds: 0,
    selectedSubtaskId: null,
  });

  // Form state for creating worklog
  const [formData, setFormData] = useState({
    taskId: '',
    subtaskId: '',
    hours: '',
    description: '',
  });

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch worklogs from API
  const fetchWorklogs = async (date: Date | null) => {
    try {
      setIsLoading(true);
      const params: { date?: string } = {};
      if (date) {
        params.date = date.toISOString().split('T')[0];
      }
      const data = await getMyWorklogs(params);

      // Transform API data to match component interface
      const transformedWorklogs: Worklog[] = (data.worklogs || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        taskName: item.taskName || 'Không có tên',
        project: item.project || 'Không rõ dự án',
        hours: item.hours,
        description: item.description || '',
        taskId: item.taskId,
        subtaskId: item.subtaskId,
        createdAt: item.createdAt,
      }));

      setWorklogs(transformedWorklogs);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching worklogs:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải timesheet');
      setWorklogs([]);
      setIsLoading(false);
    }
  };

  // Fetch subtasks for selection from API
  const fetchTasks = async () => {
    try {
      const data = await getMySubtasks();

      // Transform API data to match component interface
      const transformedTasks: MemberTask[] = (data.subtasks || []).map((item: any) => ({
        id: item.id,
        title: item.tenSubtask,
        tentask: item.tenSubtask,
        description: item.mota || '',
        status: item.trangThai,
        trangThai: item.trangThai,
        priority: item.mucDoUuTien || 'medium',
        deadline: item.ngayKetThuc,
        project: item.task?.duan?.tenduan || item.Task?.DuAn?.tenduan || item.duan?.tenduan || '',
        duan: item.duan || item.task?.duan || item.Task?.DuAn,
        type: 'task' as const,
        completedSubtasks: 0,
        totalSubtasks: 0,
      }));

      setTasks(transformedTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchWorklogs(selectedDate);
    fetchTasks();
  }, [selectedDate]);

  useEffect(() => {
    if (timer.isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timer.isRunning]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorklogs(selectedDate);
    setIsRefreshing(false);
  };

  // Timer functions
  const startTimer = (task: MemberTask) => {
    setTimer({
      isRunning: true,
      startTime: new Date(),
      currentTask: task.title || task.tentask,
      currentProject: task.project || task.duan?.tenduan || '',
      elapsedSeconds: 0,
      selectedSubtaskId: null,
    });
    setIsTaskSelectionModalOpen(false);
  };

  const handleSelectTaskForTimer = () => {
    setTaskSelectionMode('timer');
    setIsTaskSelectionModalOpen(true);
  };

  const handleSelectTaskForWorklog = (task: MemberTask) => {
    setFormData({
      ...formData,
      subtaskId: task.id.toString(),
      taskId: '', // Clear taskId since we're using subtaskId
    });
    setIsTaskSelectionModalOpen(false);

    // Reopen the previous modal
    if (previousModalState === 'create') {
      setIsCreateModalOpen(true);
    } else if (previousModalState === 'edit') {
      setIsEditModalOpen(true);
    }
    setPreviousModalState(null);
  };

  const handleSelectTaskFromModal = (task: MemberTask) => {
    if (taskSelectionMode === 'timer') {
      // Start timer with selected task
      startTimer(task);
    } else {
      // Select task for worklog form
      handleSelectTaskForWorklog(task);
    }
  };

  // Filter tasks based on search query
  const filteredTasks = tasks.filter((task) => {
    const searchLower = taskSearchQuery.toLowerCase();
    return (
      task.tentask.toLowerCase().includes(searchLower) ||
      task.project?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower)
    );
  });

  const stopTimer = () => {
    if (timer.elapsedSeconds > 0) {
      Alert.alert(
        'Lưu worklog',
        'Bạn có muốn lưu worklog cho thời gian vừa làm việc?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => {
              setTimer({
                isRunning: false,
                startTime: null,
                currentTask: '',
                currentProject: '',
                elapsedSeconds: 0,
                selectedSubtaskId: null,
              });
            },
          },
          {
            text: 'Lưu',
            onPress: () => {
              const timeHMS = secondsToHMS(timer.elapsedSeconds);
              setFormData({
                ...formData,
                hours: timeHMS,
                taskId: '', // Set actual task ID
              });
              setTimer({
                isRunning: false,
                startTime: null,
                currentTask: '',
                currentProject: '',
                elapsedSeconds: 0,
                selectedSubtaskId: null,
              });
              setIsCreateModalOpen(true);
            },
          },
        ]
      );
    } else {
      setTimer({
        isRunning: false,
        startTime: null,
        currentTask: '',
        currentProject: '',
        elapsedSeconds: 0,
        selectedSubtaskId: null,
      });
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Convert seconds to HH:MM:SS format
  const secondsToHMS = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Convert HH:MM:SS format to seconds
  const hmsToSeconds = (hms: string): number => {
    const parts = hms.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  };

  // Convert decimal hours to HH:MM:SS format
  const hoursToHMS = (decimalHours: number): string => {
    const totalSeconds = Math.floor(decimalHours * 3600);
    return secondsToHMS(totalSeconds);
  };

  // Date navigation
  const changeDate = (direction: 'prev' | 'next') => {
    const currentDate = selectedDate || new Date();
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const showAllWorklogs = () => {
    setSelectedDate(null);
  };

  // Calculate total hours in HH:MM:SS format
  const totalSeconds = worklogs.reduce((sum, log) => sum + (log.hours * 3600), 0);
  const totalTimeHMS = secondsToHMS(totalSeconds);

  // Create worklog with API
  const handleCreateWorklog = async () => {
    try {
      // Debug: Check all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(allKeys);
      console.log('All AsyncStorage data:', allData);

      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      console.log('Debug create worklog:', { userId, hasToken: !!token });

      if (!userId || !token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      if (!formData.taskId && !formData.subtaskId) {
        Alert.alert('Lỗi', 'Vui lòng chọn công việc');
        return;
      }

      if (!formData.hours) {
        Alert.alert('Lỗi', 'Vui lòng nhập thời gian');
        return;
      }

      // Convert HH:MM:SS to decimal hours for API
      const totalSeconds = hmsToSeconds(formData.hours);
      if (totalSeconds <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập thời gian hợp lệ (HH:MM:SS)');
        return;
      }
      const decimalHours = totalSeconds / 3600;

      const requestData = {
        userId: parseInt(userId),
        taskId: formData.taskId ? parseInt(formData.taskId) : undefined,
        subtaskId: formData.subtaskId ? parseInt(formData.subtaskId) : undefined,
        hours: decimalHours,
        note: formData.description || '',
        date: (selectedDate || new Date()).toISOString().split('T')[0],
      };

      console.log('Create worklog request:', requestData);

      const result = await createWorklog(requestData);

      console.log('Create worklog success:', result);

      Alert.alert('Thành công', 'Đã lưu worklog');
      setIsCreateModalOpen(false);
      setFormData({
        taskId: '',
        subtaskId: '',
        hours: '',
        description: '',
      });
      fetchWorklogs(selectedDate);
    } catch (error: any) {
      console.error('❌ Lỗi tạo worklog chi tiết:', error);

      let errorMessage = 'Không thể tạo worklog';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }

      Alert.alert('Lỗi', errorMessage);
    }
  };

  // Update worklog with API
  const handleUpdateWorklog = async () => {
    if (!editingWorklog) return;
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }

      if (!formData.hours) {
        Alert.alert('Lỗi', 'Vui lòng nhập thời gian');
        return;
      }

      // Convert HH:MM:SS to decimal hours for API
      const totalSeconds = hmsToSeconds(formData.hours);
      if (totalSeconds <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập thời gian hợp lệ (HH:MM:SS)');
        return;
      }
      const decimalHours = totalSeconds / 3600;

      await updateWorklog(editingWorklog.id, {
        userId: parseInt(userId),
        taskId: formData.taskId ? parseInt(formData.taskId) : null,
        subtaskId: formData.subtaskId ? parseInt(formData.subtaskId) : null,
        hours: decimalHours,
        note: formData.description,
        date: (selectedDate || new Date()).toISOString().split('T')[0],
      });

      Alert.alert('Thành công', 'Đã cập nhật worklog');
      setIsEditModalOpen(false);
      setEditingWorklog(null);
      fetchWorklogs(selectedDate);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật worklog');
    }
  };

  // Delete worklog with API
  const handleDeleteWorklog = (id: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa worklog này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorklog(id);
            Alert.alert('Thành công', 'Đã xóa worklog');
            fetchWorklogs(selectedDate);
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa worklog');
          }
        },
      },
    ]);
  };

  // Handle edit worklog
  const handleEditWorklog = (log: Worklog) => {
    setEditingWorklog(log);
    setFormData({
      taskId: log.taskId?.toString() || '',
      subtaskId: log.subtaskId?.toString() || '',
      hours: hoursToHMS(log.hours),
      description: log.description,
    });
    setIsEditModalOpen(true);
  };

  // Group worklogs by task
  const groupedWorklogs = worklogs.reduce<Record<string, Worklog[]>>((acc, log) => {
    const key = log.taskName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(log);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Đang tải timesheet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timesheet</Text>
        <Text style={styles.headerSubtitle}>Quản lý thời gian làm việc</Text>
      </View>

      {/* Timer Widget */}
      <TimerWidget
        timer={timer}
        formatTime={formatTime}
        onSelectTask={handleSelectTaskForTimer}
        onStopTimer={stopTimer}
      />

      {/* Filter Mode Buttons */}
      <FilterButtons
        selectedDate={selectedDate}
        onShowAll={showAllWorklogs}
        onShowByDate={openDatePicker}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Date Navigation */}
      <DateNavigation
        selectedDate={selectedDate}
        onPrevDate={() => changeDate('prev')}
        onNextDate={() => changeDate('next')}
        onOpenDatePicker={openDatePicker}
      />

      {/* Total Hours */}
      <View style={styles.totalHours}>
        <Ionicons name="time-outline" size={20} color="#667eea" />
        <Text style={styles.totalHoursText}>
          {selectedDate ? 'Tổng ngày này: ' : 'Tổng tất cả: '}
          <Text style={styles.totalHoursValue}>{totalTimeHMS}</Text>
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalOpen(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Worklogs List */}
      <WorklogList
        groupedWorklogs={groupedWorklogs}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onEdit={handleEditWorklog}
        onDelete={handleDeleteWorklog}
        hoursToHMS={hoursToHMS}
      />

      {/* Create/Edit Worklog Modal */}
      <WorklogFormModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        isEditMode={isEditModalOpen}
        formData={formData}
        tasks={tasks}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingWorklog(null);
        }}
        onSubmit={isEditModalOpen ? handleUpdateWorklog : handleCreateWorklog}
        onFormChange={(field, value) => setFormData({ ...formData, [field]: value })}
        onSelectTask={() => {
          setTaskSelectionMode('worklog');
          setPreviousModalState(isEditModalOpen ? 'edit' : 'create');
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setIsTaskSelectionModalOpen(true);
        }}
      />

      {/* Task Selection Modal */}
      <TaskSelectionModal
        isOpen={isTaskSelectionModalOpen}
        tasks={tasks}
        searchQuery={taskSearchQuery}
        onClose={() => {
          setIsTaskSelectionModalOpen(false);
          setTaskSearchQuery('');
        }}
        onSelectTask={handleSelectTaskFromModal}
        onSearchChange={setTaskSearchQuery}
      />
    </View>
  );
}
