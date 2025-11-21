import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getGroupSubtasks, updateSubtaskStatus, updateTaskStatus, getMyTasks, getSubtasksByTask } from '@/src/axios/api';

interface TaskItem {
    id: number;
    tentask: string;
    mota?: string;
    trangThai: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiThucHien?: { hoten: string; id: number };
    type: 'task';
}

interface SubtaskItem {
    id: number;
    tenSubtask: string;
    mota?: string;
    trangThai: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiThucHien?: { hoten: string; id: number };
    task?: { tentask: string; id: number };
    taskId?: number;
    isPendingAssignment?: boolean;
    pendingAssigneeName?: string;
    type: 'subtask';
}

type WorkItem = TaskItem | SubtaskItem;

const DEFAULT_COLUMNS = [
    { key: 'Chưa bắt đầu', color: '#9ca3af', icon: 'pause-circle' },
    { key: 'Đang chạy', color: '#2563eb', icon: 'play-circle' },
    { key: 'Chờ xác nhận hoàn thành', color: '#f97316', icon: 'time' },
    { key: 'Hoàn thành', color: '#22c55e', icon: 'checkmark-circle' }
];

const nextStatus = (current: string, columns: typeof DEFAULT_COLUMNS) => {
    const index = columns.findIndex(column => column.key === current);
    if (index === -1) return columns[0].key;
    return columns[(index + 1) % columns.length].key;
};

const formatDate = (value?: string) => {
    if (!value) return 'Chưa rõ';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Chưa rõ';
    return dt.toLocaleDateString('vi-VN');
};

export default function TeamLeadSubtasksScreen() {
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [showTasksOnly, setShowTasksOnly] = useState(false);
    const [showSubtasksOnly, setShowSubtasksOnly] = useState(false);
    
    // Custom columns
    const [statusColumns, setStatusColumns] = useState(DEFAULT_COLUMNS);
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const [newColumnColor, setNewColumnColor] = useState('#8b5cf6');
    
    // Filters
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterTask, setFilterTask] = useState<number | null>(null);
    const [filterAssignee, setFilterAssignee] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    
    // Status change modal
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [myTasksResponse, groupSubtasksResponse] = await Promise.all([
                getMyTasks().catch((err) => {
                    console.warn('getMyTasks failed:', err);
                    return { tasks: [] };
                }),
                getGroupSubtasks().catch((err) => {
                    console.warn('getGroupSubtasks failed:', err);
                    return [];
                })
            ]);

            const normalizeStatus = (status?: string) => {
                if (!status) return 'Chưa bắt đầu';
                const normalized = status.trim();
                if ([
                    'Đang chờ duyệt',
                    'Chờ duyệt',
                    'Chờ xác nhận',
                    'Chờ xác nhận hoàn thành'
                ].includes(normalized)) {
                    return 'Chờ xác nhận hoàn thành';
                }
                return normalized;
            };

            // Load tasks của teamlead - Backend trả về { tasks: [...] }
            const myTasksList = myTasksResponse?.tasks || myTasksResponse || [];
            const normalizedTasks: TaskItem[] = Array.isArray(myTasksList) ? myTasksList.map((item: any) => ({
                id: item.id,
                tentask: item.tentask || item.tenTask || item.ten || `Task #${item.id}`,
                mota: item.mota || item.moTa,
                trangThai: normalizeStatus(item.trangThai),
                ngayBatDau: item.ngayBatDau,
                ngayKetThuc: item.ngayKetThuc,
                nguoiThucHien: item.nguoiDuocGiao || item.nguoiThucHien || item.assignee,
                type: 'task' as const
            })) : [];

            const taskLookup = new Map<number, TaskItem>(normalizedTasks.map(task => [task.id, task]));

            const normalizeSubtaskItem = (item: any): SubtaskItem => {
                const parentIdRaw = item.taskId ?? item.task?.id ?? item.task_id ?? item.taskID ?? item.taskid;
                const parentId = parentIdRaw ? Number(parentIdRaw) : undefined;
                const parentTask = item.task
                    || (parentId ? taskLookup.get(parentId) : undefined);
                const parentTentask = parentTask?.tentask || parentTask?.tenTask || parentTask?.ten || (parentId ? `Công việc #${parentId}` : undefined);
                const pendingAssignment = Array.isArray(item.assignments) && item.assignments.length > 0
                    ? item.assignments[0]
                    : null;

                return {
                    id: item.id,
                    tenSubtask: item.tenSubtask || item.ten || item.tenCongViecCon || `Subtask #${item.id}`,
                    mota: item.mota || item.moTa,
                    trangThai: normalizeStatus(item.trangThai),
                    ngayBatDau: item.ngayBatDau,
                    ngayKetThuc: item.ngayKetThuc,
                    nguoiThucHien: item.nguoiThucHien || item.assignee,
                    task: parentId && parentTentask ? { id: parentId, tentask: parentTentask } : undefined,
                    taskId: parentId,
                    isPendingAssignment: Boolean(pendingAssignment),
                    pendingAssigneeName: pendingAssignment?.assignee?.hoten,
                    type: 'subtask' as const
                };
            };

            const rawGroupSubtasks = Array.isArray(groupSubtasksResponse)
                ? groupSubtasksResponse
                : Array.isArray(groupSubtasksResponse?.subtasks)
                    ? groupSubtasksResponse.subtasks
                    : [];

            const normalizedGroupSubtasks: SubtaskItem[] = rawGroupSubtasks.map(normalizeSubtaskItem);

            const perTaskSubtasks = await Promise.all(
                normalizedTasks.map(task =>
                    getSubtasksByTask(task.id)
                        .then((res) => {
                            if (Array.isArray(res)) return res;
                            if (Array.isArray(res?.subtasks)) return res.subtasks;
                            return [];
                        })
                        .catch((err) => {
                            console.warn(`getSubtasksByTask failed for task ${task.id}:`, err);
                            return [];
                        })
                )
            );

            const flattenedTaskSubtasks = perTaskSubtasks.flat();
            const normalizedTaskSubtasks: SubtaskItem[] = flattenedTaskSubtasks.map(normalizeSubtaskItem);

            const allSubtasksMap = new Map<number, SubtaskItem>();
            [...normalizedGroupSubtasks, ...normalizedTaskSubtasks].forEach(subtask => {
                allSubtasksMap.set(subtask.id, subtask);
            });

            const combinedSubtasks = Array.from(allSubtasksMap.values());

            const validTaskIds = new Set(normalizedTasks.map(task => task.id));
            const filteredSubtasks = combinedSubtasks.filter(subtask => {
                const parentId = subtask.taskId ?? subtask.task?.id;
                return parentId ? validTaskIds.has(parentId) : false;
            });

            const summaryByTask = filteredSubtasks.reduce<Record<number, { name: string; count: number }>>((acc, subtask) => {
                const parentId = subtask.taskId ?? subtask.task?.id;
                if (!parentId) return acc;
                if (!acc[parentId]) {
                    const parentTask = taskLookup.get(parentId);
                    acc[parentId] = {
                        name: parentTask?.tentask || `Task #${parentId}`,
                        count: 0
                    };
                }
                acc[parentId].count += 1;
                return acc;
            }, {});

            console.log('📊 Subtask summary by task:', summaryByTask);
            console.log('📝 Subtask IDs:', filteredSubtasks.map(item => ({ id: item.id, taskId: item.taskId, name: item.tenSubtask })));

            console.log(`✅ Loaded ${normalizedTasks.length} tasks và ${filteredSubtasks.length} subtasks (mobile) - filtered from ${combinedSubtasks.length}`);

            setTasks(normalizedTasks);
            setSubtasks(filteredSubtasks);
        } catch (error) {
            console.error('Load data error:', error);
            setTasks([]);
            setSubtasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleChangeStatus = async (item: WorkItem, newStatus: string) => {
        try {
            if (item.type === 'task') {
                await updateTaskStatus(item.id, newStatus);
                setTasks(prev => prev.map(t => 
                    t.id === item.id ? { ...t, trangThai: newStatus } : t
                ));
            } else {
                await updateSubtaskStatus(item.id, newStatus);
                setSubtasks(prev => prev.map(s => 
                    s.id === item.id ? { ...s, trangThai: newStatus } : s
                ));
            }
            setShowStatusModal(false);
            setSelectedItem(null);
        } catch (error) {
            console.error('Update status error:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
        }
    };

    const handleLongPress = (item: WorkItem) => {
        setSelectedItem(item);
        setShowStatusModal(true);
    };

    const handleEditSubtask = (item: SubtaskItem) => {
        const parentId = item.taskId ?? item.task?.id;
        if (!parentId) {
            Alert.alert('Lỗi', 'Không xác định được công việc lớn của công việc con này');
            return;
        }

        const parentTask = tasks.find(task => task.id === parentId);

        const params: Record<string, string> = {
            mode: 'edit',
            subtaskId: String(item.id),
            taskId: String(parentId),
            taskName: parentTask?.tentask || item.task?.tentask || `Công việc #${parentId}`,
            subtaskName: item.tenSubtask || ''
        };

        router.push({ pathname: '/(teamlead)/subtask-form', params });
    };

    const handleAddColumn = () => {
        if (!newColumnName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên cột');
            return;
        }
        const newColumn = {
            key: newColumnName.trim(),
            color: newColumnColor,
            icon: 'cube' as const
        };
        setStatusColumns([...statusColumns, newColumn]);
        setNewColumnName('');
        setNewColumnColor('#8b5cf6');
        setShowColumnModal(false);
        Alert.alert('Thành công', 'Đã thêm cột mới');
    };

    const handleDeleteColumn = (columnKey: string) => {
        if (statusColumns.length <= 1) {
            Alert.alert('Lỗi', 'Phải có ít nhất 1 cột');
            return;
        }
        Alert.alert(
            'Xác nhận',
            `Xóa cột "${columnKey}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        setStatusColumns(prev => prev.filter(col => col.key !== columnKey));
                    }
                }
            ]
        );
    };

    const allWorkItems = useMemo<WorkItem[]>(() => {
        let items: WorkItem[] = [];
        
        if (showTasksOnly) {
            items = [...tasks];
        } else if (showSubtasksOnly) {
            items = [...subtasks];
        } else {
            items = [...tasks, ...subtasks];
        }
        
        return items;
    }, [tasks, subtasks, showTasksOnly, showSubtasksOnly]);

    const uniqueTasks = useMemo(() => {
        const taskList = subtasks
            .filter(s => s.task)
            .map(s => ({ id: s.task!.id, name: s.task!.tentask }));
        const unique = Array.from(
            new Map(taskList.map(t => [t.id, t])).values()
        );
        return unique;
    }, [subtasks]);

    const uniqueAssignees = useMemo(() => {
        const assignees = allWorkItems
            .filter(item => {
                if (!item.nguoiThucHien) return false;
                if (item.type === 'subtask' && item.isPendingAssignment) return false;
                return true;
            })
            .map(item => ({ id: item.nguoiThucHien!.id, name: item.nguoiThucHien!.hoten }));
        const unique = Array.from(
            new Map(assignees.map(a => [a.id, a])).values()
        );
        return unique;
    }, [allWorkItems]);

    const clearFilters = () => {
        setFilterTask(null);
        setFilterAssignee(null);
        setFilterStatus(null);
        setShowFilterModal(false);
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filterTask) count++;
        if (filterAssignee) count++;
        if (filterStatus) count++;
        return count;
    }, [filterTask, filterAssignee, filterStatus]);

    const filteredWorkItems = useMemo(() => {
        let result = allWorkItems;
        
        // Search filter
        if (search) {
            result = result.filter(item => {
                const name = item.type === 'task' ? item.tentask : item.tenSubtask;
                return name.toLowerCase().includes(search.toLowerCase()) ||
                    item.mota?.toLowerCase().includes(search.toLowerCase()) ||
                    item.nguoiThucHien?.hoten?.toLowerCase().includes(search.toLowerCase());
            });
        }
        
        // Task filter (only for subtasks)
        if (filterTask) {
            result = result.filter(item => 
                item.type === 'subtask' && item.task?.id === filterTask
            );
        }
        
        // Assignee filter
        if (filterAssignee) {
            result = result.filter(item => item.nguoiThucHien?.id === filterAssignee);
        }
        
        // Status filter
        if (filterStatus) {
            result = result.filter(item => item.trangThai === filterStatus);
        }
        
        return result;
    }, [allWorkItems, search, filterTask, filterAssignee, filterStatus]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Bảng công việc</Text>
                        <Text style={styles.headerSubtitle}>Giữ lâu để đổi trạng thái</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.headerButton}
                            onPress={() => setShowFilterModal(true)}
                        >
                            <Ionicons name="filter" size={20} color="#7c3aed" />
                            {activeFilterCount > 0 && (
                                <View style={styles.filterBadge}>
                                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.headerButton}
                            onPress={() => setShowColumnModal(true)}
                        >
                            <Ionicons name="add-circle" size={20} color="#7c3aed" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Type Filter Buttons */}
                <View style={styles.typeFilterRow}>
                    <TouchableOpacity
                        style={[styles.typeFilterBtn, !showTasksOnly && !showSubtasksOnly && styles.typeFilterBtnActive]}
                        onPress={() => {
                            setShowTasksOnly(false);
                            setShowSubtasksOnly(false);
                        }}
                    >
                        <Ionicons name="apps" size={16} color={!showTasksOnly && !showSubtasksOnly ? '#7c3aed' : '#9ca3af'} />
                        <Text style={[styles.typeFilterText, !showTasksOnly && !showSubtasksOnly && styles.typeFilterTextActive]}>
                            Tất cả ({tasks.length + subtasks.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeFilterBtn, showTasksOnly && styles.typeFilterBtnActive]}
                        onPress={() => {
                            setShowTasksOnly(true);
                            setShowSubtasksOnly(false);
                        }}
                    >
                        <Ionicons name="briefcase" size={16} color={showTasksOnly ? '#7c3aed' : '#9ca3af'} />
                        <Text style={[styles.typeFilterText, showTasksOnly && styles.typeFilterTextActive]}>
                            Công việc ({tasks.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeFilterBtn, showSubtasksOnly && styles.typeFilterBtnActive]}
                        onPress={() => {
                            setShowTasksOnly(false);
                            setShowSubtasksOnly(true);
                        }}
                    >
                        <Ionicons name="checkbox-outline" size={16} color={showSubtasksOnly ? '#7c3aed' : '#9ca3af'} />
                        <Text style={[styles.typeFilterText, showSubtasksOnly && styles.typeFilterTextActive]}>
                            Công việc con ({subtasks.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo tên, người thực hiện..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                />
                {search ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={styles.loadingText}>Đang tải công việc...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.board}
                    contentContainerStyle={styles.boardContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    {statusColumns.map((column, colIndex) => {
                        const items = filteredWorkItems.filter((item: WorkItem) => item.trangThai === column.key);
                        return (
                            <View key={`${column.key}-${colIndex}`} style={styles.column}>
                                <View style={[styles.columnHeader, { backgroundColor: `${column.color}1A`, borderColor: `${column.color}40` }]}>
                                    <View style={styles.columnHeaderLeft}>
                                        <Ionicons name={column.icon as any} size={18} color={column.color} />
                                        <Text style={[styles.columnTitle, { color: column.color }]}>{column.key}</Text>
                                    </View>
                                    <View style={styles.columnHeaderRight}>
                                        <View style={[styles.counterBadge, { backgroundColor: column.color }]}>
                                            <Text style={styles.counterText}>{items.length}</Text>
                                        </View>
                                        {colIndex >= DEFAULT_COLUMNS.length && (
                                            <TouchableOpacity 
                                                onPress={() => handleDeleteColumn(column.key)}
                                                style={styles.deleteColumnBtn}
                                            >
                                                <Ionicons name="close" size={16} color={column.color} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                                <ScrollView style={styles.columnScroll} contentContainerStyle={styles.columnContent}>
                                    {items.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Ionicons name="file-tray-outline" size={32} color="#c4b5fd" />
                                            <Text style={styles.emptyText}>Trống</Text>
                                        </View>
                                    ) : (
                                        items.map((item: WorkItem) => (
                                            <TouchableOpacity
                                                key={`${item.type}-${item.id}`}
                                                style={[
                                                    styles.card,
                                                    item.type === 'task' ? styles.taskCard : styles.subtaskCard
                                                ]}
                                                onPress={() => {}}
                                                onLongPress={() => handleLongPress(item)}
                                                delayLongPress={500}
                                            >
                                                <View style={styles.cardHeaderRow}>
                                                    <View style={styles.typeBadge}>
                                                        {item.type === 'task' ? (
                                                            <>
                                                                <Ionicons name="briefcase" size={14} color="#2563eb" />
                                                                <Text style={styles.typeBadgeText}>CÔNG VIỆC</Text>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Ionicons name="checkbox-outline" size={14} color="#a855f7" />
                                                                <Text style={[styles.typeBadgeText, { color: '#a855f7' }]}>CÔNG VIỆC CON</Text>
                                                            </>
                                                        )}
                                                    </View>
                                                    {item.type === 'subtask' ? (
                                                        <TouchableOpacity
                                                            style={styles.cardActionButton}
                                                            onPress={() => handleEditSubtask(item)}
                                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                        >
                                                            <Ionicons name="create-outline" size={16} color="#7c3aed" />
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <View style={styles.cardActionPlaceholder} />
                                                    )}
                                                </View>
                                                
                                                {/* Parent Task for Subtask */}
                                                {item.type === 'subtask' && item.task && (
                                                    <View style={styles.parentTaskInfo}>
                                                        <Ionicons name="arrow-up-circle-outline" size={12} color="#6b7280" />
                                                        <Text style={styles.parentTaskText} numberOfLines={1}>
                                                            {item.task.tentask}
                                                        </Text>
                                                    </View>
                                                )}
                                                
                                                {/* Title */}
                                                <Text style={styles.cardTitle} numberOfLines={2}>
                                                    {item.type === 'task' ? item.tentask : item.tenSubtask}
                                                </Text>
                                                
                                                {item.mota && <Text style={styles.cardDescription} numberOfLines={3}>{item.mota}</Text>}
                                                
                                                <View style={styles.metaRow}>
                                                    <Ionicons name="calendar" size={14} color="#7c3aed" />
                                                    <Text style={styles.metaText}>{formatDate(item.ngayBatDau)} - {formatDate(item.ngayKetThuc)}</Text>
                                                </View>
                                                
                                                <View style={styles.metaRow}>
                                                    <Ionicons
                                                        name="person"
                                                        size={14}
                                                        color={item.type === 'subtask' && item.isPendingAssignment ? '#f59e0b' : '#7c3aed'}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.metaText,
                                                            item.type === 'subtask' && item.isPendingAssignment && styles.pendingAssigneeText
                                                        ]}
                                                    >
                                                        {item.type === 'subtask' && item.isPendingAssignment
                                                            ? 'Đang chờ xác nhận'
                                                            : (item.nguoiThucHien?.hoten || 'Chưa gán')}
                                                    </Text>
                                                </View>
                                                
                                                <Text style={styles.helperText}>Giữ lâu để đổi trạng thái</Text>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bộ lọc</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Filter by Task */}
                            <Text style={styles.filterLabel}>Công việc lớn</Text>
                            <TouchableOpacity 
                                style={[styles.filterOption, !filterTask && styles.filterOptionActive]}
                                onPress={() => setFilterTask(null)}
                            >
                                <Text style={!filterTask ? styles.filterOptionTextActive : styles.filterOptionText}>
                                    Tất cả
                                </Text>
                            </TouchableOpacity>
                            {uniqueTasks.map(task => (
                                <TouchableOpacity 
                                    key={task.id}
                                    style={[styles.filterOption, filterTask === task.id && styles.filterOptionActive]}
                                    onPress={() => setFilterTask(task.id)}
                                >
                                    <Ionicons name="briefcase" size={16} color="#7c3aed" />
                                    <Text style={filterTask === task.id ? styles.filterOptionTextActive : styles.filterOptionText}>
                                        {task.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Filter by Assignee */}
                            <Text style={[styles.filterLabel, { marginTop: 20 }]}>Người thực hiện</Text>
                            <TouchableOpacity 
                                style={[styles.filterOption, !filterAssignee && styles.filterOptionActive]}
                                onPress={() => setFilterAssignee(null)}
                            >
                                <Text style={!filterAssignee ? styles.filterOptionTextActive : styles.filterOptionText}>
                                    Tất cả
                                </Text>
                            </TouchableOpacity>
                            {uniqueAssignees.map(assignee => (
                                <TouchableOpacity 
                                    key={assignee.id}
                                    style={[styles.filterOption, filterAssignee === assignee.id && styles.filterOptionActive]}
                                    onPress={() => setFilterAssignee(assignee.id)}
                                >
                                    <Ionicons name="person" size={16} color="#7c3aed" />
                                    <Text style={filterAssignee === assignee.id ? styles.filterOptionTextActive : styles.filterOptionText}>
                                        {assignee.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Filter by Status */}
                            <Text style={[styles.filterLabel, { marginTop: 20 }]}>Trạng thái</Text>
                            <TouchableOpacity 
                                style={[styles.filterOption, !filterStatus && styles.filterOptionActive]}
                                onPress={() => setFilterStatus(null)}
                            >
                                <Text style={!filterStatus ? styles.filterOptionTextActive : styles.filterOptionText}>
                                    Tất cả
                                </Text>
                            </TouchableOpacity>
                            {statusColumns.map((col, idx) => (
                                <TouchableOpacity 
                                    key={`status-${idx}`}
                                    style={[styles.filterOption, filterStatus === col.key && styles.filterOptionActive]}
                                    onPress={() => setFilterStatus(col.key)}
                                >
                                    <Ionicons name={col.icon as any} size={16} color={col.color} />
                                    <Text style={filterStatus === col.key ? styles.filterOptionTextActive : styles.filterOptionText}>
                                        {col.key}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                                <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
                                <Text style={styles.applyButtonText}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Column Modal */}
            <Modal
                visible={showColumnModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowColumnModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thêm cột mới</Text>
                            <TouchableOpacity onPress={() => setShowColumnModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.filterLabel}>Tên cột</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tên trạng thái mới"
                                placeholderTextColor="#9ca3af"
                                value={newColumnName}
                                onChangeText={setNewColumnName}
                            />

                            <Text style={[styles.filterLabel, { marginTop: 16 }]}>Màu sắc</Text>
                            <View style={styles.colorPicker}>
                                {['#9ca3af', '#2563eb', '#f97316', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'].map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            newColumnColor === color && styles.colorOptionActive
                                        ]}
                                        onPress={() => setNewColumnColor(color)}
                                    >
                                        {newColumnColor === color && (
                                            <Ionicons name="checkmark" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.applyButton} 
                                onPress={handleAddColumn}
                            >
                                <Text style={styles.applyButtonText}>Thêm cột</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Status Change Modal */}
            <Modal
                visible={showStatusModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowStatusModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn trạng thái</Text>
                            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <>
                                <View style={styles.modalBody}>
                                    <Text style={styles.subtaskNameInModal}>
                                        {selectedItem.type === 'task' ? selectedItem.tentask : selectedItem.tenSubtask}
                                    </Text>
                                    {statusColumns.map((col, idx) => (
                                        <TouchableOpacity
                                            key={`status-change-${idx}`}
                                            style={[
                                                styles.statusOption,
                                                selectedItem.trangThai === col.key && styles.statusOptionActive
                                            ]}
                                            onPress={() => handleChangeStatus(selectedItem, col.key)}
                                        >
                                            <Ionicons name={col.icon as any} size={20} color={col.color} />
                                            <Text style={[styles.statusOptionText, { color: col.color }]}>
                                                {col.key}
                                            </Text>
                                            {selectedItem.trangThai === col.key && (
                                                <Ionicons name="checkmark-circle" size={20} color={col.color} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 18
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4
    },
        pendingAssigneeText: {
            color: '#d97706',
            fontWeight: '600'
        },
    headerActions: {
        flexDirection: 'row',
        gap: 8
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#312e81'
    },
    headerSubtitle: {
        marginTop: 4,
        color: '#6b7280',
        fontSize: 13
    },
    typeFilterRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12
    },
    typeFilterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    typeFilterBtnActive: {
        backgroundColor: '#f3e8ff',
        borderColor: '#c4b5fd'
    },
    typeFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9ca3af'
    },
    typeFilterTextActive: {
        color: '#7c3aed'
    },
    searchContainer: {
        margin: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    searchInput: {
        flex: 1,
        height: 44,
        color: '#111827'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    board: {
        flex: 1
    },
    boardContent: {
        paddingHorizontal: 16,
        paddingBottom: 24
    },
    column: {
        width: 280,
        marginRight: 16,
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    columnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18
    },
    columnHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1
    },
    columnHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    columnTitle: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1
    },
    counterBadge: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2
    },
    counterText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12
    },
    deleteColumnBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    columnScroll: {
        maxHeight: 520
    },
    columnContent: {
        padding: 12,
        paddingBottom: 16
    },
    card: {
        backgroundColor: '#faf5ff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9d5ff'
    },
    taskCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
        backgroundColor: '#eff6ff'
    },
    subtaskCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#a855f7',
        backgroundColor: '#faf5ff'
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    cardActionButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ede9fe',
        justifyContent: 'center',
        alignItems: 'center'
    },
    cardActionPlaceholder: {
        width: 28
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#fff'
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2563eb',
        letterSpacing: 0.5
    },
    parentTaskInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
        marginBottom: 8
    },
    parentTaskText: {
        fontSize: 11,
        color: '#6b7280',
        flex: 1,
        fontStyle: 'italic'
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4
    },
    cardDescription: {
        marginTop: 6,
        color: '#4b5563',
        lineHeight: 18,
        fontSize: 13
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6
    },
    metaText: {
        fontSize: 12,
        color: '#4b5563',
        flex: 1
    },
    helperText: {
        marginTop: 10,
        fontSize: 10,
        color: '#9ca3af',
        fontStyle: 'italic'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24
    },
    emptyText: {
        marginTop: 8,
        color: '#9ca3af'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827'
    },
    modalBody: {
        padding: 20,
        maxHeight: 400
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        marginBottom: 8
    },
    filterOptionActive: {
        backgroundColor: '#ede9fe',
        borderWidth: 1,
        borderColor: '#7c3aed'
    },
    filterOptionText: {
        flex: 1,
        fontSize: 14,
        color: '#6b7280'
    },
    filterOptionTextActive: {
        flex: 1,
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: '600'
    },
    clearButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center'
    },
    clearButtonText: {
        color: '#6b7280',
        fontWeight: '600'
    },
    applyButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#7c3aed',
        alignItems: 'center'
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: '600'
    },
    input: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#111827'
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    colorOptionActive: {
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    subtaskNameInModal: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        marginBottom: 8
    },
    statusOptionActive: {
        backgroundColor: '#f3e8ff',
        borderWidth: 1,
        borderColor: '#e9d5ff'
    },
    statusOptionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600'
    }
});
