import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl, TextInput, Modal, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTaskById, getWorklogs, updateTask } from '@/src/axios/api';
import api from '@/src/axios/config';
import { PageHeader } from '../../components/ui/PageHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import CommentSection from '@/components/CommentSection';

interface Task {
    id: number;
    tentask: string;
    mota: string;
    trangThai: string;
    mucDoUuTien: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    ngayHoanThanh?: string;
    tienDo: number;
    ghiChu?: string;
    duan?: {
        id: number;
        tenduan: string;
    };
    nguoiDuocGiao?: {
        id: number;
        hoten: string;
        manv: string;
    };
    nguoiGiao?: {
        id: number;
        hoten: string;
        manv: string;
    };
    subtasks?: any[];
}

export default function TaskDetail() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const taskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [task, setTask] = useState<Task | null>(null);

    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logText, setLogText] = useState('');
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [logHours, setLogHours] = useState('');
    const [postingLog, setPostingLog] = useState(false);
    const [showLogDatePicker, setShowLogDatePicker] = useState(false);

    // Edit task modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editStart, setEditStart] = useState('');
    const [editEnd, setEditEnd] = useState('');
    const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false);
    const [showEditEndDatePicker, setShowEditEndDatePicker] = useState(false);
    const [editPriority, setEditPriority] = useState<string>('medium');
    const [editNotes, setEditNotes] = useState('');
    const [updatingTask, setUpdatingTask] = useState(false);
    
    // Assignee change
    const [editAssigneeId, setEditAssigneeId] = useState<number | null>(null);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showAssigneeModal, setShowAssigneeModal] = useState(false);

    useEffect(() => {
        if (taskId) {
            loadTaskData();
        }
    }, [taskId]);

    const loadTaskData = async () => {
        try {
            setLoading(true);
            const taskData = await getTaskById(taskId);
            setTask(taskData);
            // fetch related logs
            fetchLogs();
        } catch (error) {
            console.error('Error loading task:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin công việc');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchLogs = async () => {
        try {
            setLogsLoading(true);
            const res = await getWorklogs({ taskId: Number(taskId) });
            const data = res || [];
            const arr = Array.isArray(data) ? data : (data.worklogs || data.data || []);
            setLogs(arr);
        } catch (err) {
            console.error('Error loading logs', err);
        } finally {
            setLogsLoading(false);
        }
    };

    const handlePostLog = async () => {
        if (!logText.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập mô tả công việc');
        }
        if (!logHours.trim() || isNaN(Number(logHours)) || Number(logHours) <= 0) {
            return Alert.alert('Lỗi', 'Vui lòng nhập số giờ hợp lệ (lớn hơn 0)');
        }
        try {
            setPostingLog(true);

            const userIdStr = await AsyncStorage.getItem('userId');
            if (!userIdStr) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                return;
            }

            const payload = {
                userId: Number(userIdStr),
                taskId: Number(taskId),
                hours: Number(logHours),
                note: logText.trim(),
                date: logDate,
            } as any;

            console.log('📤 Worklog data:', payload);

            await api.post('/worklogs', payload);
            setLogText('');
            setLogHours('');
            setLogDate(new Date().toISOString().split('T')[0]);
            await fetchLogs();
            Alert.alert('Thành công', 'Đã ghi nhật ký hoạt động');
        } catch (err: any) {
            console.error('Error posting log', err);
            const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || String(err);
            Alert.alert('Lỗi', serverMsg || 'Không thể gửi nhật ký');
        } finally {
            setPostingLog(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTaskData();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Chưa bắt đầu': return '#6b7280';
            case 'Đang chạy': return '#f59e0b';
            case 'Chờ xác nhận hoàn thành': return '#3b82f6';
            case 'Hoàn thành': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return priority;
        }
    };

    const openEditModal = () => {
        if (!task) return;
        setEditTitle(task.tentask || '');
        setEditDesc(task.mota || '');
        setEditStart(task.ngayBatDau || '');
        setEditEnd(task.ngayKetThuc || '');
        setEditPriority(task.mucDoUuTien || 'medium');
        setEditNotes(task.ghiChu || '');
        setEditAssigneeId(task.nguoiDuocGiao?.id || null);
        setShowEditModal(true);
        
        // Load team leaders from project
        if (task.duan?.id) {
            loadProjectMembers(task.duan.id);
        }
    };

    const loadProjectMembers = async (projectId: number) => {
        try {
            setLoadingMembers(true);
            // Get all groups
            const groupResponse = await api.get(`/groups`);
            const data = groupResponse.data || groupResponse;
            const allGroups = data.groups || data || [];
            
            // Get all group members who are leaders
            const leaders: any[] = [];
            
            for (const group of allGroups) {
                // Check if this group is assigned to the project
                const hasProject = group.projects?.some((p: any) => p.id === projectId) || 
                                  group.groupProjects?.some((gp: any) => gp.projectId === projectId && gp.status === 'active');
                
                if (hasProject && group.leaderId) {
                    // Check if leader already exists
                    const existingLeader = leaders.find(l => l.id === group.leaderId);
                    
                    if (!existingLeader) {
                        // Use leader info from group response if available
                        if (group.leader) {
                            leaders.push({
                                id: group.leader.id,
                                userId: group.leader.id,
                                hoten: group.leader.hoten,
                                manv: group.leader.manv,
                                user: group.leader,
                                nhomtruong: true,
                                groupName: group.name,
                            });
                        } else {
                            // Fallback: fetch leader info separately
                            try {
                                const leaderResponse = await api.get(`/users/${group.leaderId}`);
                                const leaderData = leaderResponse.data || leaderResponse;
                                leaders.push({
                                    id: leaderData.id,
                                    userId: leaderData.id,
                                    hoten: leaderData.hoten,
                                    manv: leaderData.manv,
                                    user: leaderData,
                                    nhomtruong: true,
                                    groupName: group.name,
                                });
                            } catch (error) {
                                console.error('Error fetching leader:', error);
                            }
                        }
                    }
                }
            }
            
            setProjectMembers(leaders);
        } catch (error) {
            console.error('Error loading project members:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách nhóm trưởng');
        } finally {
            setLoadingMembers(false);
        }
    };

    const mapPriorityLabelToValue = (label: string) => {
        switch (label) {
            case 'Cao': return 'high';
            case 'Trung bình': return 'medium';
            case 'Thấp': return 'low';
            default: return label;
        }
    };

    const handleUpdateTask = async () => {
        if (!task) return;
        if (!editTitle.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
        // validate dates if provided
        if (editStart && editEnd) {
            const s = new Date(editStart);
            const e = new Date(editEnd);
            if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return Alert.alert('Lỗi', 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
        }

        // Check if assignee changed
        const assigneeChanged = editAssigneeId !== null && editAssigneeId !== task.nguoiDuocGiao?.id;
        
        if (assigneeChanged) {
            const newAssignee = projectMembers.find(m => m.userId === editAssigneeId || m.id === editAssigneeId);
            const assigneeName = newAssignee?.user?.hoten || newAssignee?.hoten || 'người dùng mới';
            
            Alert.alert(
                'Xác nhận đổi người phụ trách',
                `Bạn có chắc chắn muốn đổi người phụ trách từ "${task.nguoiDuocGiao?.hoten}" sang "${assigneeName}"?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    { 
                        text: 'Xác nhận', 
                        onPress: () => performUpdate()
                    }
                ]
            );
        } else {
            performUpdate();
        }
    };

    const performUpdate = async () => {
        if (!task) return;
        try {
            setUpdatingTask(true);
            const payload: any = {
                tentask: editTitle,
                mota: editDesc,
                ngayBatDau: editStart || undefined,
                ngayKetThuc: editEnd || undefined,
                mucDoUuTien: editPriority || undefined,
                ghiChu: editNotes || undefined,
            };
            
            // Add assignee if changed
            if (editAssigneeId !== null && editAssigneeId !== task.nguoiDuocGiao?.id) {
                payload.nguoiDuocGiaoId = editAssigneeId;
            }
            
            // normalize priority (allow labels or values)
            if (['Cao','Trung bình','Thấp'].includes(String(editPriority))) {
                payload.mucDoUuTien = mapPriorityLabelToValue(editPriority);
            }
            await updateTask(Number(task.id), payload);
            Alert.alert('Thành công', 'Cập nhật công việc thành công');
            setShowEditModal(false);
            await loadTaskData();
        } catch (err: any) {
            console.error('Update task error', err);
            Alert.alert('Lỗi', err?.message || 'Không thể cập nhật công việc');
        } finally {
            setUpdatingTask(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết công việc" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!task) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết công việc" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.errorText}>Không tìm thấy công việc</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Chi tiết công việc" />
            
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.taskTitle}>{task.tentask}</Text>
                    <View style={styles.badges}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.trangThai) }]}>
                            <Text style={styles.badgeText}>{task.trangThai}</Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.mucDoUuTien) }]}>
                            <Text style={styles.badgeText}>{getPriorityText(task.mucDoUuTien)}</Text>
                        </View>
                        <TouchableOpacity style={styles.openEditBtn} onPress={openEditModal}>
                            <Text style={styles.openEditBtnText}>Sửa</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Project */}
                {task.duan && (
                    <TouchableOpacity
                        style={styles.projectLink}
                        onPress={() => router.push(`/(manager)/project-detail?id=${task.duan?.id}`)}
                    >
                        <Text style={styles.projectLinkText}>📁 {task.duan.tenduan}</Text>
                        <Text style={styles.projectLinkArrow}>›</Text>
                    </TouchableOpacity>
                )}

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Mô tả</Text>
                    <Text style={styles.description}>{task.mota || 'Không có mô tả'}</Text>
                </View>

                {/* People */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Người liên quan</Text>
                    
                    {task.nguoiGiao && (
                        <View style={styles.personCard}>
                            <View style={styles.personAvatar}>
                                <Text style={styles.personInitial}>
                                    {task.nguoiGiao.hoten.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personRole}>Người giao việc</Text>
                                <Text style={styles.personName}>{task.nguoiGiao.hoten}</Text>
                                <Text style={styles.personCode}>{task.nguoiGiao.manv}</Text>
                            </View>
                        </View>
                    )}

                    {task.nguoiDuocGiao && (
                        <View style={styles.personCard}>
                            <View style={[styles.personAvatar, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.personInitial}>
                                    {task.nguoiDuocGiao.hoten.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personRole}>Người thực hiện</Text>
                                <Text style={styles.personName}>{task.nguoiDuocGiao.hoten}</Text>
                                <Text style={styles.personCode}>{task.nguoiDuocGiao.manv}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Thời gian</Text>
                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineItem}>
                            <Text style={styles.timelineLabel}>Bắt đầu:</Text>
                            <Text style={styles.timelineValue}>
                                {task.ngayBatDau ? new Date(task.ngayBatDau).toLocaleDateString('vi-VN') : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.timelineItem}>
                            <Text style={styles.timelineLabel}>Kết thúc:</Text>
                            <Text style={styles.timelineValue}>
                                {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                        {task.ngayHoanThanh && (
                            <View style={styles.timelineItem}>
                                <Text style={styles.timelineLabel}>Hoàn thành:</Text>
                                <Text style={[styles.timelineValue, { color: '#10b981' }]}>
                                    {new Date(task.ngayHoanThanh).toLocaleDateString('vi-VN')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Tiến độ</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${task.tienDo}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{task.tienDo}%</Text>
                    </View>
                </View>

                {/* Notes */}
                {task.ghiChu && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📌 Ghi chú</Text>
                        <View style={styles.noteCard}>
                            <Text style={styles.noteText}>{task.ghiChu}</Text>
                        </View>
                    </View>
                )}

                {/* Subtasks: always show link to subtasks list (even if empty) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Công việc con ({(task.subtasks || []).length})</Text>
                    <TouchableOpacity style={styles.openSubtasksBtn} onPress={() => router.push(`/(manager)/task-subtasks?id=${task.id}`)}>
                        <Text style={styles.openSubtasksText}>Xem danh sách công việc con</Text>
                    </TouchableOpacity>
                </View>

                {/* Edit Task Modal */}
                <Modal visible={showEditModal} animationType="slide" transparent>
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContent}>
                            <Text style={modalStyles.modalTitle}>Sửa công việc</Text>
                            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '70%' }}>
                                <TextInput placeholder="Tiêu đề" value={editTitle} onChangeText={setEditTitle} style={modalStyles.input} />
                                <TextInput placeholder="Mô tả" value={editDesc} onChangeText={setEditDesc} style={[modalStyles.input, { height: 80 }]} multiline />
                                
                                <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Ngày bắt đầu</Text>
                                <TouchableOpacity onPress={() => setShowEditStartDatePicker(true)} style={modalStyles.dateButton}>
                                    <Text style={[modalStyles.dateButtonText, !editStart && { color: '#9ca3af' }]}>
                                        {editStart ? `📅 ${new Date(editStart).toLocaleDateString('vi-VN')}` : '📅 Chọn ngày bắt đầu'}
                                    </Text>
                                </TouchableOpacity>
                                {showEditStartDatePicker && (
                                    <DateTimePicker
                                        value={editStart ? new Date(editStart) : new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowEditStartDatePicker(Platform.OS === 'ios');
                                            if (selectedDate) {
                                                setEditStart(selectedDate.toISOString().split('T')[0]);
                                            }
                                        }}
                                    />
                                )}
                                
                                <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Ngày kết thúc</Text>
                                <TouchableOpacity onPress={() => setShowEditEndDatePicker(true)} style={modalStyles.dateButton}>
                                    <Text style={[modalStyles.dateButtonText, !editEnd && { color: '#9ca3af' }]}>
                                        {editEnd ? `📅 ${new Date(editEnd).toLocaleDateString('vi-VN')}` : '📅 Chọn ngày kết thúc'}
                                    </Text>
                                </TouchableOpacity>
                                {showEditEndDatePicker && (
                                    <DateTimePicker
                                        value={editEnd ? new Date(editEnd) : new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowEditEndDatePicker(Platform.OS === 'ios');
                                            if (selectedDate) {
                                                setEditEnd(selectedDate.toISOString().split('T')[0]);
                                            }
                                        }}
                                    />
                                )}

                                <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Mức độ ưu tiên</Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                    {['high','medium','low'].map(p => (
                                        <TouchableOpacity key={p} onPress={() => setEditPriority(p)} style={[modalStyles.priorityOption, editPriority === p ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                                            <Text style={{ color: editPriority === p ? '#fff' : '#111827', fontWeight: '700' }}>{getPriorityText(p)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TextInput placeholder="Ghi chú (tuỳ chọn)" value={editNotes} onChangeText={setEditNotes} style={[modalStyles.input, { height: 80 }]} multiline />
                                
                                <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Người phụ trách</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowAssigneeModal(true)} 
                                    style={modalStyles.assigneeButton}
                                >
                                    <Text style={modalStyles.assigneeButtonText}>
                                        {editAssigneeId 
                                            ? (projectMembers.find(m => (m.userId || m.id) === editAssigneeId)?.user?.hoten || 
                                               projectMembers.find(m => (m.userId || m.id) === editAssigneeId)?.hoten || 
                                               task?.nguoiDuocGiao?.hoten || 'Chọn người phụ trách')
                                            : (task?.nguoiDuocGiao?.hoten || 'Chọn người phụ trách')
                                        }
                                    </Text>
                                    <Text style={{ fontSize: 18, color: '#6b7280' }}>›</Text>
                                </TouchableOpacity>
                                {loadingMembers && <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 8 }} />}
                            </ScrollView>

                            <View style={modalStyles.modalActions}>
                                <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowEditModal(false)}>
                                    <Text style={modalStyles.modalBtnText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#3b82f6' }]} onPress={handleUpdateTask} disabled={updatingTask}>
                                    {updatingTask ? <ActivityIndicator color="#fff" /> : <Text style={[modalStyles.modalBtnText, { color: '#fff' }]}>Lưu</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Assignee Selection Modal */}
                <Modal visible={showAssigneeModal} animationType="slide" transparent>
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContent}>
                            <Text style={modalStyles.modalTitle}>Chọn người phụ trách</Text>
                            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                                Chỉ nhóm trưởng tham gia dự án được hiển thị
                            </Text>
                            <ScrollView style={{ maxHeight: 400 }}>
                                {projectMembers.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#6b7280' }}>Không có nhóm trưởng nào</Text>
                                    </View>
                                ) : (
                                    projectMembers.map((member) => {
                                        const memberId = member.userId || member.id;
                                        const memberName = member.user?.hoten || member.hoten || 'Không rõ tên';
                                        const memberCode = member.user?.manv || member.manv || '';
                                        const isSelected = editAssigneeId === memberId;
                                        
                                        return (
                                            <TouchableOpacity
                                                key={memberId}
                                                style={[
                                                    modalStyles.memberItem,
                                                    isSelected && modalStyles.memberItemSelected
                                                ]}
                                                onPress={() => {
                                                    setEditAssigneeId(memberId);
                                                    setShowAssigneeModal(false);
                                                }}
                                            >
                                                <View style={modalStyles.memberAvatar}>
                                                    <Text style={modalStyles.memberInitial}>
                                                        {memberName.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={modalStyles.memberName}>{memberName}</Text>
                                                    {memberCode && (
                                                        <Text style={modalStyles.memberCode}>{memberCode}</Text>
                                                    )}
                                                    <Text style={modalStyles.memberRole}>👑 Nhóm trưởng</Text>
                                                </View>
                                                {isSelected && (
                                                    <Text style={{ fontSize: 20, color: '#3b82f6' }}>✓</Text>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </ScrollView>
                            <TouchableOpacity 
                                style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af', marginTop: 12 }]} 
                                onPress={() => setShowAssigneeModal(false)}
                            >
                                <Text style={modalStyles.modalBtnText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Logs - Moved before Comments */}
                <View style={[styles.section, styles.logsContainer]}>
                    <Text style={styles.sectionTitle}>🕘 Nhật ký hoạt động</Text>
                    
                    {/* Worklog Input Form */}
                    <View style={styles.worklogForm}>
                        <View style={styles.worklogRow}>
                            <View style={styles.worklogField}>
                                <Text style={styles.worklogLabel}>Ngày làm việc</Text>
                                <TouchableOpacity 
                                    style={styles.dateInput} 
                                    onPress={() => setShowLogDatePicker(true)}
                                >
                                    <Text style={styles.dateInputText}>
                                        📅 {new Date(logDate).toLocaleDateString('vi-VN')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.worklogField, { flex: 0.4 }]}>
                                <Text style={styles.worklogLabel}>Số giờ</Text>
                                <TextInput 
                                    value={logHours} 
                                    onChangeText={setLogHours}
                                    placeholder="0.0"
                                    keyboardType="decimal-pad"
                                    style={styles.hoursInput}
                                />
                            </View>
                        </View>
                        
                        <Text style={styles.worklogLabel}>Mô tả công việc</Text>
                        <TextInput 
                            value={logText} 
                            onChangeText={setLogText} 
                            placeholder="Nhập mô tả công việc đã làm..." 
                            style={styles.worklogTextArea} 
                            multiline 
                            numberOfLines={3}
                        />
                        
                        <TouchableOpacity 
                            style={styles.worklogButton} 
                            onPress={handlePostLog} 
                            disabled={postingLog}
                        >
                            {postingLog ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.worklogButtonText}>✓ Ghi nhật ký</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Date Picker Modal */}
                    {showLogDatePicker && (
                        <DateTimePicker
                            value={logDate ? new Date(logDate) : new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowLogDatePicker(Platform.OS === 'ios');
                                if (selectedDate) {
                                    setLogDate(selectedDate.toISOString().split('T')[0]);
                                }
                            }}
                        />
                    )}
                    
                    {/* Worklogs List */}
                    {logsLoading ? <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 12 }} /> : null}
                    {logs.length === 0 && !logsLoading ? (
                        <Text style={styles.emptyLogText}>Chưa có nhật ký hoạt động</Text>
                    ) : (
                        <View style={styles.logsList}>
                            {logs.map((l:any)=>(
                                <View key={l.id || l._id || String(Math.random())} style={styles.logItem}>
                                    <View style={styles.logHeader}>
                                        <View style={styles.logDateBadge}>
                                            <Text style={styles.logDateText}>
                                                📅 {l.date ? new Date(l.date).toLocaleDateString('vi-VN') : 'N/A'}
                                            </Text>
                                        </View>
                                        <View style={styles.logHoursBadge}>
                                            <Text style={styles.logHoursText}>
                                                ⏱️ {l.hours || l.hoursSpent || 0}h
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.logText}>{l.note || l.message || l.action || 'Không có mô tả'}</Text>
                                    <Text style={styles.logTime}>
                                        Ghi lúc: {l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Comments Section */}
                <CommentSection 
                    taskId={task.id} 
                    onCommentAdded={loadTaskData}
                />
            </ScrollView>
        </SafeAreaView>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#6b7280',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
        lineHeight: 28,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    projectLink: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    projectLinkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },
    projectLinkArrow: {
        fontSize: 20,
        color: '#3b82f6',
    },
    section: {
        marginBottom: 24,
    },
    /* Comments */
    commentsContainer: { marginBottom: 16 },
    commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    commentInput: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    commentButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
    commentButtonText: { color: '#fff', fontWeight: '700' },
    commentItem: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    commentAuthor: { fontWeight: '700', color: '#0f172a' },
    commentTime: { color: '#6b7280', fontSize: 12 },
    commentContent: { color: '#374151', marginTop: 6 },

    /* Logs */
    logsContainer: { marginBottom: 24 },
    worklogForm: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 16,
    },
    worklogRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    worklogField: {
        flex: 1,
    },
    worklogLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    dateInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    dateInputText: {
        fontSize: 14,
        color: '#111827',
    },
    hoursInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#111827',
    },
    worklogTextArea: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#111827',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    worklogButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    worklogButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    logsList: {
        marginTop: 16,
    },
    logItem: { 
        backgroundColor: '#fff', 
        padding: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#e5e7eb', 
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    logHeader: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    logDateBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    logDateText: {
        color: '#1e40af',
        fontSize: 12,
        fontWeight: '600',
    },
    logHoursBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    logHoursText: {
        color: '#166534',
        fontSize: 12,
        fontWeight: '600',
    },
    logText: { 
        color: '#374151',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 6,
    },
    logTime: { 
        color: '#9ca3af', 
        fontSize: 11,
        fontStyle: 'italic',
    },
    emptyLogText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 22,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    personCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    personAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    personInitial: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    personInfo: {
        flex: 1,
    },
    personRole: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    personName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    personCode: {
        fontSize: 13,
        color: '#6b7280',
    },
    timelineContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12,
    },
    timelineItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timelineLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    timelineValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 12,
    },
    progressText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        minWidth: 50,
        textAlign: 'right',
    },
    noteCard: {
        backgroundColor: '#fef3c7',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    noteText: {
        fontSize: 14,
        color: '#92400e',
        lineHeight: 22,
    },
    subtaskCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    subtaskName: {
        flex: 1,
        fontSize: 14,
        color: '#1f2937',
        marginRight: 8,
    },
    subtaskStatus: {
        fontSize: 12,
        color: '#6b7280',
    },
    openSubtasksBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    openSubtasksText: {
        color: '#fff',
        fontWeight: '600',
    },
    openEditBtn: {
        marginLeft: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#e6f0ff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    openEditBtnText: {
        color: '#1e40af',
        fontWeight: '700',
    },
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
    dateButton: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    dateButtonText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    assigneeButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    assigneeButtonText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    memberItemSelected: {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
        borderWidth: 2,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberInitial: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    memberName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    memberCode: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    memberRole: {
        fontSize: 11,
        color: '#f59e0b',
        fontWeight: '600',
    },
});
