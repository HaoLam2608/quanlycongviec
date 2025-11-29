import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { getTaskById, getWorklogs, updateSubtask } from '@/src/axios/api';
import api from '@/src/axios/config';
import { PageHeader } from '../../components/ui/PageHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import CommentSection from '@/components/CommentSection';

interface Subtask {
    id: number;
    tenSubtask?: string;
    mota?: string;
    trangThai?: string;
    mucDoUuTien?: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiDuocGiao?: { id?: number; hoten?: string; manv?: string };
    nguoiGiao?: { id?: number; hoten?: string; manv?: string };
}

export default function SubtaskDetail() {
    const params = useLocalSearchParams();
    const id = params.id as string;
    const parentTaskId = params.taskId as string | undefined;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subtask, setSubtask] = useState<Subtask | null>(null);

    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);
    const [logText, setLogText] = useState('');
    const [logDate, setLogDate] = useState(new Date());
    const [logHours, setLogHours] = useState('');
    const [showLogDatePicker, setShowLogDatePicker] = useState(false);
    const [postingLog, setPostingLog] = useState(false);
    // Edit subtask modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editStart, setEditStart] = useState('');
    const [editEnd, setEditEnd] = useState('');
    const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false);
    const [showEditEndDatePicker, setShowEditEndDatePicker] = useState(false);
    const [editPriority, setEditPriority] = useState<string>('medium');
    const [editNotes, setEditNotes] = useState('');
    const [updatingSubtask, setUpdatingSubtask] = useState(false);
    const [currentParentTaskId, setCurrentParentTaskId] = useState<number | null>(parentTaskId ? Number(parentTaskId) : null);
    
    // Assignee change for subtask
    const [editAssigneeId, setEditAssigneeId] = useState<number | null>(null);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showAssigneeModal, setShowAssigneeModal] = useState(false);
    const [projectId, setProjectId] = useState<number | null>(null);

    useEffect(() => {
        if (id) load();
    }, [id]);

    const load = async () => {
        try {
            setLoading(true);
            // If we have a parent task id, fetch the parent and find the subtask inside it
            if (parentTaskId) {
                const taskData = await getTaskById(parentTaskId);
                const taskObj = taskData && taskData.id ? taskData : (taskData.task || taskData.data || null);
                if (taskObj) {
                    const found = (taskObj.subtasks || taskObj.children || []).find((s: any) => String(s.id) === String(id));
                    if (found) {
                        setSubtask(found);
                        // Get project ID from parent task
                        if (taskObj.duanId) {
                            setProjectId(taskObj.duanId);
                        } else if (taskObj.duan?.id) {
                            setProjectId(taskObj.duan.id);
                        }
                        // load logs for this subtask
                        fetchLogs();
                        return;
                    }
                }
            }

            // Fallback: try fetching subtask directly (some APIs expose /tasks/:id for subtasks)
            const data = await getTaskById(id);
            const s = data && data.id ? data : (data.task || data.data || null);
            setSubtask(s);
            // Try to get project ID
            if (s?.duanId) {
                setProjectId(s.duanId);
            } else if (s?.duan?.id) {
                setProjectId(s.duan.id);
            }
            // load related data
            fetchLogs();
        } catch (err) {
            console.error('Error loading subtask', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchLogs = async () => {
        try {
            setLogsLoading(true);
            const res = await getWorklogs({ subtaskId: Number(id) });
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
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung nhật ký');
            return;
        }
        if (!logHours || Number(logHours) <= 0) {
            Alert.alert('Lỗi', 'Số giờ phải lớn hơn 0');
            return;
        }
        try {
            setPostingLog(true);

            // get userId from storage - backend requires userId as part of body
            const userIdStr = await AsyncStorage.getItem('userId');
            if (!userIdStr) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                return;
            }

            const payload = {
                userId: Number(userIdStr),
                subtaskId: Number(id),
                hours: Number(logHours),
                note: logText.trim(),
                // send date as YYYY-MM-DD
                date: logDate.toISOString().split('T')[0],
            } as any;

            console.log('📤 Request data:', payload);

            await api.post('/worklogs', payload);
            setLogText('');
            setLogHours('');
            setLogDate(new Date());
            setShowLogForm(false);
            await fetchLogs();
            Alert.alert('Thành công', 'Đã ghi nhật ký hoạt động');
        } catch (err: any) {
            console.error('Error posting log', err);
            const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || String(err);
            Alert.alert('Lỗi', serverMsg || 'Không thể thêm nhật ký');
        } finally {
            setPostingLog(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const loadProjectMembers = async (projectIdParam: number) => {
        try {
            setLoadingMembers(true);
            // Get all groups
            const groupResponse = await api.get(`/groups`);
            const data = groupResponse.data || groupResponse;
            const allGroups = data.groups || data || [];
            
            // Get all regular members (not leaders) from groups in this project
            const members: any[] = [];
            
            for (const group of allGroups) {
                // Check if this group is assigned to the project
                const hasProject = group.projects?.some((p: any) => p.id === projectIdParam) || 
                                  group.groupProjects?.some((gp: any) => gp.projectId === projectIdParam && gp.status === 'active');
                
                if (hasProject && group.members && Array.isArray(group.members)) {
                    // Get all members except the leader
                    for (const member of group.members) {
                        const memberId = member.userId || member.id;
                        const isLeader = group.leaderId === memberId;
                        
                        // Skip if this is the leader
                        if (isLeader) continue;
                        
                        // Check if already added (avoid duplicates)
                        const existingMember = members.find(m => m.id === memberId);
                        if (!existingMember) {
                            const memberData = member.user || member;
                            members.push({
                                id: memberId,
                                userId: memberId,
                                hoten: memberData.hoten || 'Không rõ tên',
                                manv: memberData.manv || '',
                                user: memberData,
                                groupName: group.name,
                            });
                        }
                    }
                }
            }
            
            setProjectMembers(members);
        } catch (error) {
            console.error('Error loading project members:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
        } finally {
            setLoadingMembers(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết công việc nhỏ" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!subtask) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết công việc nhỏ" />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>❌</Text>
                    <Text style={styles.emptyText}>Không tìm thấy công việc</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title={subtask.tenSubtask || 'Chi tiết công việc nhỏ'} />
            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {/* Header card */}
                <View style={styles.headerCard}>
                    <Text style={styles.title}>{subtask.tenSubtask || 'Chi tiết công việc nhỏ'}</Text>
                    <View style={styles.badgesRow}>
                        <View style={[styles.statusBadge, { backgroundColor: subtask.trangThai === 'Hoàn thành' ? '#10b981' : subtask.trangThai === 'Đang chạy' ? '#f59e0b' : '#6b7280' }]}>
                            <Text style={styles.statusTextSmall}>{subtask.trangThai || 'Chưa rõ'}</Text>
                        </View>
                        {(subtask as any).mucDoUuTien ? (
                            <View style={[styles.priorityBadge, { backgroundColor: (subtask as any).mucDoUuTien === 'high' ? '#ef4444' : (subtask as any).mucDoUuTien === 'medium' ? '#f59e0b' : '#10b981' }]}>
                                <Text style={styles.badgeText}>{(subtask as any).mucDoUuTien === 'high' ? 'Cao' : (subtask as any).mucDoUuTien === 'medium' ? 'Trung bình' : 'Thấp'}</Text>
                            </View>
                        ) : null}
                    </View>
                    <TouchableOpacity style={styles.openEditBtn} onPress={() => {
                        // Prefill and open modal
                        setEditTitle(subtask.tenSubtask || '');
                        setEditDesc(subtask.mota || '');
                        setEditStart(subtask.ngayBatDau || '');
                        setEditEnd(subtask.ngayKetThuc || '');
                        setEditPriority((subtask as any).mucDoUuTien || 'medium');
                        setEditNotes((subtask as any).ghiChu || '');
                        setEditAssigneeId((subtask as any).nguoiThucHienId || (subtask as any).nguoiDuocGiaoId || subtask.nguoiDuocGiao?.id || null);
                        // ensure we have parent task id
                        if (!currentParentTaskId) {
                            const maybeTaskId = (subtask as any).taskId || (subtask as any).task?.id;
                            if (maybeTaskId) setCurrentParentTaskId(Number(maybeTaskId));
                        }
                        // Load members if we have project ID
                        if (projectId) {
                            loadProjectMembers(projectId);
                        }
                        setShowEditModal(true);
                    }}>
                        <Text style={styles.openEditBtnText}>Sửa</Text>
                    </TouchableOpacity>
                    {subtask.mota ? <Text style={styles.subtitle} numberOfLines={2}>{subtask.mota}</Text> : null}

                    {/* (Removed action buttons; logs now have their own input like comments) */}
                </View>

                {/* Info grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
                        <Text style={styles.infoValue}>{(subtask.ngayBatDau || (subtask as any).ngayBatDau) ? new Date((subtask.ngayBatDau || (subtask as any).ngayBatDau)!).toLocaleDateString('vi-VN') : 'N/A'}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Ngày kết thúc</Text>
                        <Text style={styles.infoValue}>{(subtask.ngayKetThuc || (subtask as any).ngayKetThuc) ? new Date((subtask.ngayKetThuc || (subtask as any).ngayKetThuc)!).toLocaleDateString('vi-VN') : 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Mô tả chi tiết</Text>
                    <Text style={styles.description}>{subtask.mota || 'Không có mô tả'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👥 Người liên quan</Text>

                    {/* Combobox-style assignee selector: opens the existing assignee modal */}
                    <View style={{ marginTop: 6 }}>
                        <Text style={styles.infoLabel}>Người thực hiện</Text>
                        <TouchableOpacity
                            style={styles.assigneeSelect}
                            onPress={() => {
                                if (projectId) loadProjectMembers(projectId);
                                setShowAssigneeModal(true);
                            }}
                        >
                            <Text style={styles.assigneeSelectText}>
                                {(subtask as any).nguoiThucHien?.hoten || subtask.nguoiDuocGiao?.hoten || 'Chọn người thực hiện'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Edit Subtask Modal */}
                <Modal visible={showEditModal} animationType="slide" transparent>
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContent}>
                            <Text style={modalStyles.modalTitle}>Sửa công việc nhỏ</Text>
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
                                        <Text style={{ color: editPriority === p ? '#fff' : '#111827', fontWeight: '700' }}>{p === 'high' ? 'Cao' : p === 'medium' ? 'Trung bình' : 'Thấp'}</Text>
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
                                        ? (projectMembers.find(m => (m.userId || m.id) === editAssigneeId)?.hoten || 
                                           (subtask as any).nguoiThucHien?.hoten ||
                                           subtask.nguoiDuocGiao?.hoten || 'Chọn người phụ trách')
                                        : ((subtask as any).nguoiThucHien?.hoten || subtask.nguoiDuocGiao?.hoten || 'Chọn người phụ trách')
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
                                <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#3b82f6' }]} onPress={async () => {
                                    // update handler
                                    if (!editTitle.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
                                    if (editStart && editEnd) {
                                        const s = new Date(editStart);
                                        const e = new Date(editEnd);
                                        if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return Alert.alert('Lỗi', 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
                                    }
                                    if (!currentParentTaskId) return Alert.alert('Lỗi', 'Không xác định công việc cha');
                                    
                                    // Check if assignee changed
                                    const currentAssigneeId = (subtask as any).nguoiThucHienId || (subtask as any).nguoiDuocGiaoId || subtask.nguoiDuocGiao?.id;
                                    const assigneeChanged = editAssigneeId !== null && editAssigneeId !== currentAssigneeId;
                                    
                                    if (assigneeChanged) {
                                        const newAssignee = projectMembers.find(m => (m.userId || m.id) === editAssigneeId);
                                        const currentAssigneeName = (subtask as any).nguoiThucHien?.hoten || subtask.nguoiDuocGiao?.hoten || 'người hiện tại';
                                        const newAssigneeName = newAssignee?.hoten || 'người mới';
                                        
                                        Alert.alert(
                                            'Xác nhận đổi người phụ trách',
                                            `Bạn có chắc chắn muốn đổi người phụ trách từ "${currentAssigneeName}" sang "${newAssigneeName}"?`,
                                            [
                                                { text: 'Hủy', style: 'cancel' },
                                                { 
                                                    text: 'Xác nhận', 
                                                    onPress: () => performSubtaskUpdate()
                                                }
                                            ]
                                        );
                                    } else {
                                        performSubtaskUpdate();
                                    }
                                    
                                    async function performSubtaskUpdate() {
                                        try {
                                            setUpdatingSubtask(true);
                                            const payload: any = {
                                                tenSubtask: editTitle,
                                                mota: editDesc,
                                                ngayBatDau: editStart || undefined,
                                                ngayKetThuc: editEnd || undefined,
                                                mucDoUuTien: editPriority || undefined,
                                                ghiChu: editNotes || undefined,
                                            };
                                            
                                            // Add assignee if changed
                                            if (editAssigneeId !== null && editAssigneeId !== currentAssigneeId) {
                                                payload.nguoiThucHienId = editAssigneeId;
                                            }
                                            
                                            await updateSubtask(Number(currentParentTaskId), Number(id), payload);
                                            Alert.alert('Thành công', 'Cập nhật công việc nhỏ thành công');
                                            setShowEditModal(false);
                                            await load();
                                        } catch (err:any) {
                                            console.error('Update subtask error', err);
                                            Alert.alert('Lỗi', err?.message || 'Không thể cập nhật công việc nhỏ');
                                        } finally {
                                            setUpdatingSubtask(false);
                                        }
                                    }
                                }} disabled={updatingSubtask}>
                                    {updatingSubtask ? <ActivityIndicator color="#fff" /> : <Text style={[modalStyles.modalBtnText, { color: '#fff' }]}>Lưu</Text>}
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
                                Chỉ thành viên (không phải nhóm trưởng) được hiển thị
                            </Text>
                            <ScrollView style={{ maxHeight: 400 }}>
                                {projectMembers.length === 0 ? (
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#6b7280' }}>Không có thành viên nào</Text>
                                    </View>
                                ) : (
                                    projectMembers.map((member) => {
                                        const memberId = member.userId || member.id;
                                        const memberName = member.hoten || 'Không rõ tên';
                                        const memberCode = member.manv || '';
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
                                                    <Text style={modalStyles.memberRole}>👤 Thành viên - {member.groupName}</Text>
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
                    
                    {/* Enhanced Log Form */}
                    <View style={styles.worklogForm}>
                        <View style={styles.worklogRow}>
                            <View style={styles.worklogField}>
                                <Text style={styles.worklogLabel}>Ngày</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowLogDatePicker(true)} 
                                    style={styles.dateInput}
                                >
                                    <Text style={styles.dateInputText}>
                                        📅 {logDate.toLocaleDateString('vi-VN')}
                                    </Text>
                                </TouchableOpacity>
                                {showLogDatePicker && (
                                    <DateTimePicker
                                        value={logDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowLogDatePicker(Platform.OS === 'ios');
                                            if (selectedDate) {
                                                setLogDate(selectedDate);
                                            }
                                        }}
                                    />
                                )}
                            </View>
                            <View style={styles.worklogField}>
                                <Text style={styles.worklogLabel}>Số giờ</Text>
                                <TextInput 
                                    value={logHours}
                                    onChangeText={setLogHours}
                                    placeholder="0"
                                    keyboardType="decimal-pad"
                                    style={styles.hoursInput}
                                />
                            </View>
                        </View>
                        <Text style={styles.worklogLabel}>Nội dung</Text>
                        <TextInput 
                            value={logText} 
                            onChangeText={setLogText} 
                            placeholder="Mô tả công việc đã làm..."
                            style={styles.worklogTextArea}
                            multiline
                        />
                        <TouchableOpacity 
                            style={styles.worklogButton} 
                            onPress={handlePostLog} 
                            disabled={postingLog}
                        >
                            <Text style={styles.worklogButtonText}>
                                {postingLog ? '⏳ Đang gửi...' : '✅ Gửi nhật ký'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Logs List */}
                    {logsLoading ? (
                        <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 12 }} />
                    ) : logs.length === 0 ? (
                        <Text style={styles.emptyLogText}>Chưa có nhật ký hoạt động nào</Text>
                    ) : (
                        <View style={styles.logsList}>
                            {logs.map((l: any) => (
                                <View key={l.id || l._id || String(Math.random())} style={styles.logItem}>
                                    <View style={styles.logHeader}>
                                        {l.date && (
                                            <View style={styles.logDateBadge}>
                                                <Text style={styles.logDateText}>
                                                    📅 {new Date(l.date).toLocaleDateString('vi-VN')}
                                                </Text>
                                            </View>
                                        )}
                                        {l.hours && (
                                            <View style={styles.logHoursBadge}>
                                                <Text style={styles.logHoursText}>
                                                    ⏱️ {l.hours}h
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.logText}>
                                        {l.message || l.note || l.action || JSON.stringify(l)}
                                    </Text>
                                    <Text style={styles.logTime}>
                                        {l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : 
                                         (l.time ? new Date(l.time).toLocaleDateString('vi-VN') : '')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Comments Section */}
                <CommentSection 
                    subtaskId={subtask.id} 
                    onCommentAdded={load}
                />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6b7280' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48 },
    emptyText: { color: '#6b7280' },
    section: { marginBottom: 16, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
    sectionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    description: { color: '#6b7280', lineHeight: 20 },
    sectionText: { color: '#6b7280', marginBottom: 6 },
    statusRow: { marginTop: 6 },
    statusTextSmall: { color: '#fff', fontSize: 13, fontWeight: '700' },
    personRow: { flexDirection: 'row', gap: 12 },
    personCardSmall: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    personLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
    personName: { fontWeight: '700', color: '#1f2937' },
    personCode: { color: '#6b7280' },
    timeRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
    timeItem: { flexDirection: 'row', alignItems: 'center' },
    timeIcon: { marginRight: 6 },
    timeText: { color: '#6b7280' },
    /* Header card */
    headerCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
    title: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    badgesRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
    openEditBtn: {
        marginTop: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#e6f0ff',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    openEditBtnText: { color: '#1e40af', fontWeight: '700' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    subtitle: { color: '#6b7280', fontSize: 14 },
    /* Info grid */
    infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    infoCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
    infoLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
    infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '700' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

    assigneeSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    assigneeSelectText: { color: '#0f172a', fontWeight: '600' },

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
        backgroundColor: '#10b981',
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
        color: '#10b981',
        fontWeight: '600',
    },
});
