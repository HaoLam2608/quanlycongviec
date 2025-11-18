import { createTask, fetchProjects, getKanbanTasks, updateTaskStatus } from '@/src/axios/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
// Use plain FlatList while debugging rendering issues
// DraggableFlatList was used for DnD but can interfere with layout; swap to FlatList temporarily
// DraggableFlatList removed — plain FlatList used for stability
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PageHeader } from '../../components/ui/PageHeader';

interface Task {
  id: number;
  tentask: string;
  mota?: string;
  trangThai: string;
  mucDoUuTien: string;
  ngayKetThuc: string;
  nguoiDuocGiao?: {
    id: number;
    hoten: string;
  };
}

interface KanbanColumn {
  status: string;
  title: string;
  tasks: Task[];
  color: string;
}

// Helper: parse date strings safely so 'YYYY-MM-DD' is treated as local date (avoid timezone shifts)
const parseToLocalDate = (s?: string | null) => {
  if (!s) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
  if (dateOnly) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
};

const formatDate = (s?: string | null) => {
  const d = parseToLocalDate(s);
  return d ? d.toLocaleDateString('vi-VN') : '';
};

// Defensive resolver: try multiple possible keys for the backend kanban response
const resolveTasksForColumn = (source: any, statusLabel: string) => {
  if (!source) return [];

  if (Array.isArray(source[statusLabel])) return source[statusLabel];

  const toAscii = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const candidates = [
    statusLabel,
    statusLabel.toLowerCase(),
    statusLabel.replace(/\s+/g, '_').toLowerCase(),
    toAscii(statusLabel),
    toAscii(statusLabel).replace(/\s+/g, '_'),
  ];

  const knownMap: Record<string, string[]> = {
    'Chưa bắt đầu': ['chua_bat_dau', 'not_started'],
    'Đang chạy': ['dang_chay', 'in_progress'],
    'Chờ xác nhận hoàn thành': ['cho_xac_nhan_hoan_thanh', 'pending_confirmation', 'awaiting_confirmation'],
    'Hoàn thành': ['hoan_thanh', 'completed', 'done'],
  };

  const mapped = knownMap[statusLabel] || [];

  const allCandidates = [...candidates, ...mapped];

  for (const k of allCandidates) {
    if (k && Array.isArray(source[k])) return source[k];
  }

  if (source.kanban && typeof source.kanban === 'object') {
    for (const k of allCandidates) {
      if (Array.isArray(source.kanban[k])) return source.kanban[k];
    }
  }

  // last-resort: if source contains arrays, return the largest array
  try {
    const arrays = Object.keys(source || {}).filter(k => Array.isArray(source[k])).map(k => source[k]);
    if (arrays.length > 0) {
      arrays.sort((a: any[], b: any[]) => b.length - a.length);
      return arrays[0];
    }
  } catch (e) { /* ignore */ }

  return [];
};

export default function AdminKanban() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { status: 'Chưa bắt đầu', title: 'Chưa bắt đầu', tasks: [], color: '#6b7280' },
    { status: 'Đang chạy', title: 'Đang làm', tasks: [], color: '#f59e0b' },
    { status: 'Chờ xác nhận hoàn thành', title: 'Chờ xác nhận', tasks: [], color: '#3b82f6' },
    { status: 'Hoàn thành', title: 'Hoàn thành', tasks: [], color: '#10b981' },
  ]);
  // Create task modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [creatingTask, setCreatingTask] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  // Move task modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [currentColumnStatus, setCurrentColumnStatus] = useState<string>('');
  // Status picker modal (replaces Alert.alert so tapping outside can dismiss)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTask, setStatusModalTask] = useState<Task | null>(null);
  const [statusModalCurrentStatus, setStatusModalCurrentStatus] = useState<string>('');
  

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
      loadKanbanData(projects[0].id);
    }
  }, [projects]);

  const loadProjects = async () => {
    try {
      const projectsData = await fetchProjects();
      const list = Array.isArray(projectsData) ? projectsData : (projectsData.duans || projectsData.projects || projectsData.data || []);
      setProjects(list);
      if (list.length > 0) {
        setSelectedProject(list[0]);
        loadKanbanData(list[0].id);
      }
    } catch (error) {
      console.error('Error loading projects (admin):', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách dự án');
      setLoading(false);
    }
  };

  const loadKanbanData = async (projectId: number) => {
    try {
      setLoading(true);
      const kanbanData = await getKanbanTasks(projectId);
      const source = (kanbanData && (kanbanData.kanban || kanbanData)) || {};

      console.log('📡 AdminKanban: raw kanban keys:', Object.keys(source || {}));

      let newColumns = columns.map(col => ({
        ...col,
        tasks: resolveTasksForColumn(source, col.status)
      }));

      // Fallback: if backend returned a flat `tasks` array (or similar) instead of grouped `kanban`,
      // group on the client by `trangThai` to ensure the board isn't empty.
      const totalTasksInColumns = newColumns.reduce((acc, c) => acc + (Array.isArray(c.tasks) ? c.tasks.length : 0), 0);
      const possibleFlatTasks = Array.isArray((kanbanData as any)?.tasks) ? (kanbanData as any).tasks : Array.isArray((source as any)?.tasks) ? (source as any).tasks : null;

      if (totalTasksInColumns === 0 && possibleFlatTasks && possibleFlatTasks.length > 0) {
        console.log('📡 AdminKanban: applying client-side grouping fallback for flat tasks array');
        const grouped: Record<string, Task[]> = {};
        possibleFlatTasks.forEach((t: any) => {
          const status = t.trangThai || t.status || 'Chưa bắt đầu';
          if (!grouped[status]) grouped[status] = [];
          grouped[status].push(t);
        });

        newColumns = columns.map(col => ({
          ...col,
          tasks: grouped[col.status] || []
        }));
      }

      setColumns(newColumns);
    } catch (error) {
      console.error('Error loading kanban data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu Kanban');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (selectedProject) {
      setRefreshing(true);
      loadKanbanData(selectedProject.id);
    }
  };

  const selectProject = (project: any) => {
    setSelectedProject(project);
    loadKanbanData(project.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderTaskCard = (task: Task, _drag?: () => void, _isActive?: boolean, columnStatus?: string) => (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskCard]}
        onPress={() => router.push(`/(manager)/task-detail?id=${task.id}`)}
        onLongPress={() => {
          setTaskToMove(task);
          setCurrentColumnStatus(columnStatus || task.trangThai);
          setShowMoveModal(true);
        }}
        delayLongPress={300}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.mucDoUuTien) }]} />
          <Text style={styles.taskTitle} numberOfLines={2}>{task.tentask}</Text>
          <TouchableOpacity style={styles.taskActionBtn} onPress={() => {
            // Open custom status modal so tapping outside will dismiss
            setStatusModalTask(task);
            setStatusModalCurrentStatus(columnStatus || task.trangThai);
            setShowStatusModal(true);
          }}>
            <Text style={styles.taskActionText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {task.mota && (
          <Text style={styles.taskDesc} numberOfLines={2}>{task.mota}</Text>
        )}

        {task.nguoiDuocGiao && (
          <View style={styles.assigneeContainer}>
            <View style={styles.assigneeAvatar}>
              <Text style={styles.assigneeInitial}>
                {task.nguoiDuocGiao.hoten.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.assigneeName} numberOfLines={1}>
              {task.nguoiDuocGiao.hoten}
            </Text>
          </View>
        )}

        <Text style={styles.dueDate}>
          📅 {formatDate(task.ngayKetThuc)}
        </Text>
      </TouchableOpacity>
  );

  const handleChangeTaskStatus = async (taskId: number, status: string) => {
    try {
      setLoading(true);
      await updateTaskStatus(taskId, status);
      await loadKanbanData(selectedProject.id);
    } catch (err) {
      console.error('Error updating task status', err);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedProject) return Alert.alert('Lỗi', 'Chưa chọn dự án');
    if (!newTitle.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
    if (!newEnd.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập ngày kết thúc (YYYY-MM-DD)');
    if (newStart && newEnd) {
      const s = new Date(newStart);
      const e = new Date(newEnd);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return Alert.alert('Lỗi', 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
    }
    try {
      setCreatingTask(true);
      await createTask({
        tentask: newTitle,
        mota: newDesc || undefined,
        duanId: Number(selectedProject.id),
        nguoiDuocGiaoId: 0,
        ngayBatDau: newStart || undefined,
        ngayKetThuc: newEnd,
        mucDoUuTien: newPriority,
        ghiChu: undefined,
      });
      Alert.alert('Thành công', 'Tạo công việc thành công');
      setShowCreateModal(false);
      setNewTitle(''); setNewDesc(''); setNewStart(''); setNewEnd(''); setNewPriority('medium');
      await loadKanbanData(selectedProject.id);
    } catch (err) {
      console.error('Create task error', err);
      Alert.alert('Lỗi', 'Không thể tạo công việc');
    } finally {
      setCreatingTask(false);
    }
  };

  // Drag & drop handlers removed — using non-draggable lists for stability

  const handleTaskMove = async (task: Task, fromStatus: string, toStatus: string) => {
    if (fromStatus === toStatus) {
      setShowMoveModal(false);
      return;
    }

    try {
      setShowMoveModal(false);
      setLoading(true);

      const newColumns = columns.map(col => {
        if (col.status === fromStatus) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== task.id) };
        }
        if (col.status === toStatus) {
          return { ...col, tasks: [...col.tasks, { ...task, trangThai: toStatus }] };
        }
        return col;
      });
      setColumns(newColumns);

      await updateTaskStatus(task.id, toStatus);
      Alert.alert('Thành công', `Đã chuyển công việc sang "${toStatus}"`);
    } catch (err) {
      console.error('Error moving task:', err);
      Alert.alert('Lỗi', 'Không thể chuyển công việc');
      if (selectedProject) {
        loadKanbanData(selectedProject.id);
      }
    } finally {
      setLoading(false);
      setTaskToMove(null);
      setCurrentColumnStatus('');
    }
  };

  const renderColumn = ({ item }: any) => {
    const column: KanbanColumn = item;
    return (
      <View key={column.status} style={styles.column}>
        <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
          <Text style={styles.columnTitle}>{column.title}</Text>
          <View style={styles.columnCount}>
            <Text style={styles.columnCountText}>{column.tasks.length}</Text>
          </View>
        </View>

        <View style={styles.columnContent}>
          {column.tasks.length > 0 ? (
              <FlatList
                data={column.tasks}
                keyExtractor={(item: Task) => item.id.toString()}
                renderItem={({ item }) => (
                  <View>
                    {renderTaskCard(item, undefined, false, column.status)}
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            ) : (
            <View style={styles.emptyColumn}>
              <Text style={styles.emptyColumnText}>Không có công việc</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Kanban Board" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <PageHeader title="Kanban Board" />

        {/* Project selector (opens modal) */}
        {projects.length > 0 && (
          <View style={styles.projectSelector}>
            <Text style={styles.selectorLabel}>Chọn dự án:</Text>

            <TouchableOpacity
              style={[
                styles.projectChip,
                selectedProject ? styles.projectChipActive : null,
                { maxWidth: '70%' }
              ]}
              onPress={() => setShowProjectPicker(true)}
            >
              <Text style={[
                styles.projectChipText,
                selectedProject ? styles.projectChipTextActive : null
              ]} numberOfLines={1}>
                {selectedProject ? selectedProject.tenduan : 'Chọn dự án...'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setSelectedProject(null); setColumns(columns.map(c => ({ ...c, tasks: [] }))); }} style={{ marginLeft: 12 }}>
              <Text style={{ color: '#6b7280', fontWeight: '600' }}>Bỏ chọn</Text>
            </TouchableOpacity>

            <Modal visible={showProjectPicker} animationType="slide" transparent>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 12, maxHeight: '80%', padding: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Chọn dự án</Text>
                  <TextInput placeholder="Tìm dự án..." value={projectSearch} onChangeText={setProjectSearch} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginBottom: 8 }} />

                  <FlatList
                    data={projects.filter(p => (p.tenduan || p.name || p.title || '').toLowerCase().includes(projectSearch.toLowerCase()))}
                    keyExtractor={item => item.id.toString()}
                    nestedScrollEnabled
                    style={{ marginBottom: 8 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => { selectProject(item); setShowProjectPicker(false); setProjectSearch(''); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: 15, fontWeight: selectedProject?.id === item.id ? '700' : '500', color: '#111827' }}>{item.tenduan || item.name || item.title}</Text>
                        {item.mota ? <Text style={{ color: '#6b7280', fontSize: 12 }}>{item.mota}</Text> : null}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={{ padding: 12, color: '#6b7280' }}>Không có dự án</Text>}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity onPress={() => { setShowProjectPicker(false); setProjectSearch(''); }} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                      <Text style={{ color: '#6b7280', fontWeight: '700' }}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        )}

        {selectedProject ? (
          <FlatList
            horizontal
            data={columns}
            keyExtractor={(item: KanbanColumn) => item.status}
            renderItem={({ item }) => renderColumn({ item })}
            showsHorizontalScrollIndicator={false}
            style={styles.boardContainer}
            contentContainerStyle={{ paddingHorizontal: 8 }}
          />
        ) : (
          <View style={styles.noProjectContainer}>
            <Text style={styles.noProjectIcon}>📋</Text>
            <Text style={styles.noProjectTitle}>Chưa có dự án</Text>
            <Text style={styles.noProjectText}>Vui lòng tạo dự án mới để sử dụng Kanban Board</Text>
          </View>
        )}

        {/* Floating create task button */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        

        {/* Create Task Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={modalStyles.modalOverlay}>
            <View style={modalStyles.modalContent}>
              <Text style={modalStyles.modalTitle}>Tạo công việc mới</Text>
              <TextInput placeholder="Tiêu đề" value={newTitle} onChangeText={setNewTitle} style={modalStyles.input} />
              <TextInput placeholder="Mô tả" value={newDesc} onChangeText={setNewDesc} style={[modalStyles.input, { height: 80 }]} multiline />
              <TextInput placeholder="Ngày bắt đầu (YYYY-MM-DD)" value={newStart} onChangeText={setNewStart} style={modalStyles.input} />
              <TextInput placeholder="Ngày kết thúc (YYYY-MM-DD)" value={newEnd} onChangeText={setNewEnd} style={modalStyles.input} />

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['high', 'medium', 'low'].map(p => (
                  <TouchableOpacity key={p} onPress={() => setNewPriority(p as any)} style={[modalStyles.priorityOption, newPriority === p ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                    <Text style={{ color: newPriority === p ? '#fff' : '#111827', fontWeight: '700' }}>{p === 'high' ? 'Cao' : p === 'medium' ? 'Trung bình' : 'Thấp'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={modalStyles.modalActions}>
                <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowCreateModal(false)}>
                  <Text style={modalStyles.modalBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#3b82f6' }]} onPress={handleCreateTask} disabled={creatingTask}>
                  {creatingTask ? <ActivityIndicator color="#fff" /> : <Text style={[modalStyles.modalBtnText, { color: '#fff' }]}>Tạo</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Status Picker Modal (dismissible by tapping outside) */}
        <Modal visible={showStatusModal} animationType="fade" transparent>
          <TouchableWithoutFeedback onPress={() => { setShowStatusModal(false); setStatusModalTask(null); setStatusModalCurrentStatus(''); }}>
            <View style={modalStyles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => { /* absorb inner taps */ }}>
                <View style={[modalStyles.modalContent, { maxWidth: 360 }]}> 
                  <Text style={modalStyles.modalTitle}>Chuyển trạng thái</Text>
                  <Text style={modalStyles.sectionLabel}>Chọn trạng thái mới</Text>

                  {statusModalTask && (
                    <View style={{ marginBottom: 8 }}>
                      {columns
                        .filter(col => col.status !== statusModalCurrentStatus)
                        .map(col => (
                          <TouchableOpacity key={col.status} style={[modalStyles.columnOption, { borderColor: col.color, marginBottom: 8 }]} onPress={() => {
                            setShowStatusModal(false);
                            handleChangeTaskStatus(statusModalTask.id, col.status);
                            setStatusModalTask(null);
                            setStatusModalCurrentStatus('');
                          }}>
                            <Text style={[modalStyles.columnOptionText, { color: '#1e40af', textAlign: 'center' }]}>{col.title}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}

                  <View style={modalStyles.modalActions}>
                    <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => { setShowStatusModal(false); setStatusModalTask(null); setStatusModalCurrentStatus(''); }}>
                      <Text style={modalStyles.modalBtnText}>Hủy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Move Task Modal: tapping outside content will dismiss */}
        <Modal visible={showMoveModal} animationType="fade" transparent>
          <TouchableWithoutFeedback onPress={() => { setShowMoveModal(false); setTaskToMove(null); setCurrentColumnStatus(''); }}>
            <View style={modalStyles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => { /* absorb inner taps so content isn't dismissed */ }}>
                <View style={[modalStyles.modalContent, { maxWidth: 400 }]}>
                  <Text style={modalStyles.modalTitle}>Chuyển công việc</Text>

                  {taskToMove && (
                    <View style={styles.taskPreview}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(taskToMove.mucDoUuTien) }]} />
                      <Text style={styles.taskPreviewTitle} numberOfLines={2}>{taskToMove.tentask}</Text>
                    </View>
                  )}

                  <Text style={modalStyles.sectionLabel}>Chọn cột đích:</Text>

                  <View style={modalStyles.columnOptions}>
                    {columns
                      .filter(col => col.status !== currentColumnStatus)
                      .map(col => (
                        <TouchableOpacity
                          key={col.status}
                          style={[modalStyles.columnOption, { borderColor: col.color }]}
                          onPress={() => taskToMove && handleTaskMove(taskToMove, currentColumnStatus, col.status)}
                        >
                          <View style={[modalStyles.columnDot, { backgroundColor: col.color }]} />
                          <Text style={modalStyles.columnOptionText}>{col.title}</Text>
                          <Text style={modalStyles.columnArrow}>→</Text>
                        </TouchableOpacity>
                      ))}
                  </View>

                  <View style={modalStyles.modalActions}>
                    <TouchableOpacity
                      style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af', flex: 1 }]}
                      onPress={() => {
                        setShowMoveModal(false);
                        setTaskToMove(null);
                        setCurrentColumnStatus('');
                      }}
                    >
                      <Text style={modalStyles.modalBtnText}>Hủy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  projectSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  projectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  projectChipActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  projectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  projectChipTextActive: {
    color: '#fff',
  },
  boardContainer: {
    flex: 1,
    padding: 16,
  },
  column: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  columnCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  columnCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  columnContent: {
    flex: 1,
    padding: 12,
    maxHeight: 600,
  },
  taskCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskCardDragging: {
    opacity: 0.7,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 4,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 18,
  },
  taskDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  assigneeInitial: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  assigneeName: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 11,
    color: '#6b7280',
  },
  taskPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  taskPreviewTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  emptyColumn: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyColumnText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  noProjectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noProjectIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noProjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  noProjectText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28, fontWeight: '700' },
  taskActionBtn: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2 },
  taskActionText: { color: '#6b7280', fontWeight: '700' },
  
});

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  priorityOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  columnOptions: {
    gap: 8,
    marginBottom: 16,
  },
  columnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#f9fafb',
  },
  columnDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  columnOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  columnArrow: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '700',
  },
});

// styles are complete above
