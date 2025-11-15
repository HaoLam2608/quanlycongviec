import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createWorklog, deleteWorklog, getMySubtasks, getMyWorklogs, updateWorklog } from '../../../src/axios/api';
import { MemberTask, TimerState, Worklog } from '../../../types/member';
import { styles } from './index.styles';

export default function MemberTimesheetScreen() {
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [tasks, setTasks] = useState<MemberTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorklog, setEditingWorklog] = useState<Worklog | null>(null);
  const [isTaskSelectionModalOpen, setIsTaskSelectionModalOpen] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [previousModalState, setPreviousModalState] = useState<'create' | 'edit' | null>(null);
  const [taskSelectionMode, setTaskSelectionMode] = useState<'timer' | 'worklog'>('timer');

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
  const fetchWorklogs = async (date: Date) => {
    try {
      setIsLoading(true);
      const dateString = date.toISOString().split('T')[0];
      const data = await getMyWorklogs({ date: dateString });

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
              const hours = Number((timer.elapsedSeconds / 3600).toFixed(2));
              setFormData({
                ...formData,
                hours: hours.toString(),
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

  // Date navigation
  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
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

  // Calculate total hours
  const totalHours = worklogs.reduce((sum, log) => sum + log.hours, 0);

  // Create worklog with API
  const handleCreateWorklog = async () => {
    try {
      // Debug: Check all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(allKeys);
      console.log('All AsyncStorage data:', allData);

      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('accessToken');

      console.log('Debug create worklog:', { userId, hasToken: !!token });

      if (!userId || !token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }

      if (!formData.taskId && !formData.subtaskId) {
        Alert.alert('Lỗi', 'Vui lòng chọn công việc');
        return;
      }

      if (!formData.hours || parseFloat(formData.hours) <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập số giờ hợp lệ');
        return;
      }

      const requestData = {
        userId: parseInt(userId),
        taskId: formData.taskId ? parseInt(formData.taskId) : undefined,
        subtaskId: formData.subtaskId ? parseInt(formData.subtaskId) : undefined,
        hours: parseFloat(formData.hours),
        note: formData.description || '',
        date: selectedDate.toISOString().split('T')[0],
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

      if (!formData.hours || parseFloat(formData.hours) <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập số giờ hợp lệ');
        return;
      }

      await updateWorklog(editingWorklog.id, {
        userId: parseInt(userId),
        taskId: formData.taskId ? parseInt(formData.taskId) : null,
        subtaskId: formData.subtaskId ? parseInt(formData.subtaskId) : null,
        hours: parseFloat(formData.hours),
        note: formData.description,
        date: selectedDate.toISOString().split('T')[0],
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
      <View style={styles.timerWidget}>
        {timer.isRunning ? (
          <View style={styles.timerActive}>
            <View style={styles.timerInfo}>
              <Text style={styles.timerTask}>{timer.currentTask}</Text>
              <Text style={styles.timerProject}>{timer.currentProject}</Text>
            </View>
            <Text style={styles.timerDisplay}>{formatTime(timer.elapsedSeconds)}</Text>
            <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
              <Ionicons name="stop" size={24} color="#fff" />
              <Text style={styles.stopButtonText}>Dừng</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerInactive}>
            <Ionicons name="timer-outline" size={32} color="#667eea" />
            <Text style={styles.timerInactiveText}>Chọn công việc để bắt đầu</Text>
            <TouchableOpacity
              style={styles.selectTaskButton}
              onPress={handleSelectTaskForTimer}
            >
              <Text style={styles.selectTaskButtonText}>Chọn công việc</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateNavButton} onPress={() => changeDate('prev')}>
          <Ionicons name="chevron-back" size={24} color="#667eea" />
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{selectedDate.toLocaleDateString('vi-VN')}</Text>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Hôm nay</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.dateNavButton} onPress={() => changeDate('next')}>
          <Ionicons name="chevron-forward" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Total Hours */}
      <View style={styles.totalHours}>
        <Ionicons name="time-outline" size={20} color="#667eea" />
        <Text style={styles.totalHoursText}>
          Tổng: <Text style={styles.totalHoursValue}>{totalHours.toFixed(1)} giờ</Text>
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
      <ScrollView
        style={styles.worklogsList}
        contentContainerStyle={styles.worklogsContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(groupedWorklogs).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Chưa có worklog</Text>
            <Text style={styles.emptyText}>
              Bắt đầu làm việc và ghi lại thời gian của bạn
            </Text>
          </View>
        ) : (
          Object.entries(groupedWorklogs).map(([taskName, logs]) => (
            <View key={taskName} style={styles.taskGroup}>
              <View style={styles.taskGroupHeader}>
                <Text style={styles.taskGroupTitle}>{taskName}</Text>
                <Text style={styles.taskGroupHours}>
                  {logs.reduce((sum, log) => sum + log.hours, 0).toFixed(1)}h
                </Text>
              </View>
              {logs.map((log) => (
                <View key={log.id} style={styles.worklogCard}>
                  <View style={styles.worklogHeader}>
                    <View style={styles.worklogInfo}>
                      <Text style={styles.worklogProject}>{log.project}</Text>
                      <Text style={styles.worklogHours}>{log.hours}h</Text>
                    </View>
                    <View style={styles.worklogActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setEditingWorklog(log);
                          setFormData({
                            taskId: log.taskId?.toString() || '',
                            subtaskId: log.subtaskId?.toString() || '',
                            hours: log.hours.toString(),
                            description: log.description,
                          });
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color="#667eea" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteWorklog(log.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {log.description && (
                    <Text style={styles.worklogDescription}>{log.description}</Text>
                  )}
                  <Text style={styles.worklogTime}>
                    {new Date(log.createdAt || '').toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Worklog Modal */}
      <Modal
        visible={isCreateModalOpen || isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditModalOpen ? 'Chỉnh sửa worklog' : 'Tạo worklog mới'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingWorklog(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Công việc *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => {
                    setTaskSelectionMode('worklog');
                    setPreviousModalState(isEditModalOpen ? 'edit' : 'create');
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setIsTaskSelectionModalOpen(true);
                  }}
                >
                  <Text style={styles.inputText}>
                    {formData.subtaskId
                      ? tasks.find(t => t.id.toString() === formData.subtaskId)?.tentask || 'Chọn công việc'
                      : 'Chọn công việc'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số giờ *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 2.5"
                  placeholderTextColor="#9CA3AF"
                  value={formData.hours}
                  onChangeText={(text) => setFormData({ ...formData, hours: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mô tả công việc *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập mô tả chi tiết..."
                  placeholderTextColor="#9CA3AF"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={isEditModalOpen ? handleUpdateWorklog : handleCreateWorklog}
              >
                <Text style={styles.submitButtonText}>
                  {isEditModalOpen ? 'Cập nhật' : 'Tạo mới'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Task Selection Modal */}
      <Modal
        visible={isTaskSelectionModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTaskSelectionModalOpen(false)}
      >
        <View style={styles.taskSelectionModalOverlay}>
          <View style={styles.taskSelectionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn công việc</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsTaskSelectionModalOpen(false);
                  setTaskSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm công việc..."
                placeholderTextColor="#9CA3AF"
                value={taskSearchQuery}
                onChangeText={setTaskSearchQuery}
              />
              {taskSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setTaskSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.taskListContainer}>
              {filteredTasks.length === 0 ? (
                <View style={styles.emptyTaskContainer}>
                  <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTaskText}>
                    {taskSearchQuery ? 'Không tìm thấy công việc' : 'Chưa có công việc nào'}
                  </Text>
                </View>
              ) : (
                filteredTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskItem}
                    onPress={() => handleSelectTaskFromModal(task)}
                  >
                    <View style={styles.taskItemHeader}>
                      <Text style={styles.taskItemTitle}>{task.tentask}</Text>
                      <View style={[
                        styles.taskStatusBadge,
                        task.trangThai === 'Đang chạy' && styles.taskStatusActive,
                        task.trangThai === 'Hoàn thành' && styles.taskStatusCompleted,
                        task.trangThai === 'Chưa bắt đầu' && styles.taskStatusPending,
                      ]}>
                        <Text style={styles.taskStatusText}>{task.trangThai}</Text>
                      </View>
                    </View>
                    {task.project && (
                      <View style={styles.taskItemProject}>
                        <Ionicons name="folder-outline" size={14} color="#667eea" />
                        <Text style={styles.taskItemProjectText}>{task.project}</Text>
                      </View>
                    )}
                    {task.description && (
                      <Text style={styles.taskItemDescription} numberOfLines={2}>
                        {task.description}
                      </Text>
                    )}
                    {task.deadline && (
                      <View style={styles.taskItemFooter}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.taskItemDeadline}>
                          {new Date(task.deadline).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
