import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, RefreshControl, TextInput, Modal, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTaskById, getWorklogs, updateTask } from '@/src/axios/api';
import api from '@/src/axios/config';
import { PageHeader } from '../../components/ui/PageHeader';

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
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logText, setLogText] = useState('');
    const [postingLog, setPostingLog] = useState(false);

    // Edit task modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editStart, setEditStart] = useState('');
    const [editEnd, setEditEnd] = useState('');
    const [editPriority, setEditPriority] = useState<string>('medium');
    const [editNotes, setEditNotes] = useState('');
    const [updatingTask, setUpdatingTask] = useState(false);

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
            // fetch related comments & logs
            fetchComments();
            fetchLogs();
        } catch (error) {
            console.error('Error loading task:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin công việc');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchComments = async () => {
        try {
            setCommentsLoading(true);
            const res = await api.get(`/comments/task/${taskId}`);
            const data = res.data || res;
            const arr = Array.isArray(data) ? data : (data.comments || data.data || []);
            setComments(arr);
        } catch (err) {
            console.error('Error loading comments', err);
        } finally {
            setCommentsLoading(false);
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

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            setPostingComment(true);
            await api.post('/comments', { taskId: Number(taskId), content: newComment.trim() });
            setNewComment('');
            await fetchComments();
        } catch (err) {
            console.error('Error posting comment', err);
            Alert.alert('Lỗi', 'Không thể gửi bình luận');
        } finally {
            setPostingComment(false);
        }
    };

    const handlePostLog = async () => {
        if (!logText.trim()) return;
        try {
            setPostingLog(true);
            await api.post('/worklogs', { taskId: Number(taskId), hours: 0, note: logText.trim(), date: new Date().toISOString() });
            setLogText('');
            await fetchLogs();
        } catch (err) {
            console.error('Error posting log', err);
            Alert.alert('Lỗi', 'Không thể gửi nhật ký');
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
        setShowEditModal(true);
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
                            <TextInput placeholder="Tiêu đề" value={editTitle} onChangeText={setEditTitle} style={modalStyles.input} />
                            <TextInput placeholder="Mô tả" value={editDesc} onChangeText={setEditDesc} style={[modalStyles.input, { height: 80 }]} multiline />
                            <TextInput placeholder="Ngày bắt đầu (YYYY-MM-DD)" value={editStart} onChangeText={setEditStart} style={modalStyles.input} />
                            <TextInput placeholder="Ngày kết thúc (YYYY-MM-DD)" value={editEnd} onChangeText={setEditEnd} style={modalStyles.input} />

                            <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Mức độ ưu tiên</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                {['high','medium','low'].map(p => (
                                    <TouchableOpacity key={p} onPress={() => setEditPriority(p)} style={[modalStyles.priorityOption, editPriority === p ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                                        <Text style={{ color: editPriority === p ? '#fff' : '#111827', fontWeight: '700' }}>{getPriorityText(p)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput placeholder="Ghi chú (tuỳ chọn)" value={editNotes} onChangeText={setEditNotes} style={[modalStyles.input, { height: 80 }]} multiline />

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

                {/* Comments */}
                <View style={[styles.section, styles.commentsContainer]}>
                    <Text style={styles.sectionTitle}>💬 Bình luận</Text>
                    <View style={styles.commentInputRow}>
                        <TextInput value={newComment} onChangeText={setNewComment} placeholder="Viết bình luận..." style={styles.commentInput} multiline />
                        <TouchableOpacity style={styles.commentButton} onPress={handlePostComment} disabled={postingComment}>
                            <Text style={styles.commentButtonText}>{postingComment ? 'Đang gửi...' : 'Gửi'}</Text>
                        </TouchableOpacity>
                    </View>
                    {commentsLoading ? <ActivityIndicator size="small" color="#2563eb" /> : null}
                    {comments.length === 0 && !commentsLoading ? (
                        <Text style={{ color: '#6b7280' }}>Chưa có bình luận</Text>
                    ) : (
                        <View>
                            {comments.map((item:any) => (
                                <View key={String(item.id)} style={styles.commentItem}>
                                    <Text style={styles.commentAuthor}>{item.author?.hoten || item.authorName || item.manv || 'Người dùng'}</Text>
                                    <Text style={styles.commentTime}>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</Text>
                                    <Text style={styles.commentContent}>{item.content}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Logs */}
                <View style={[styles.section, styles.logsContainer]}>
                    <Text style={styles.sectionTitle}>🕘 Nhật ký hoạt động</Text>
                    <View style={styles.commentInputRow}>
                        <TextInput value={logText} onChangeText={setLogText} placeholder="Ghi nhật ký..." style={styles.commentInput} multiline />
                        <TouchableOpacity style={styles.commentButton} onPress={handlePostLog} disabled={postingLog}>
                            <Text style={styles.commentButtonText}>{postingLog ? 'Đang gửi...' : 'Gửi'}</Text>
                        </TouchableOpacity>
                    </View>
                    {logsLoading ? <ActivityIndicator size="small" color="#2563eb" /> : null}
                    {logs.length === 0 && !logsLoading ? <Text style={{ color: '#6b7280' }}>Chưa có nhật ký</Text> : (
                        <View>
                            {logs.map((l:any)=>(
                                <View key={l.id || l._id || String(Math.random())} style={styles.logItem}>
                                    <Text style={styles.logText}>{l.message || l.note || l.action || JSON.stringify(l)}</Text>
                                    <Text style={styles.logTime}>{l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : (l.time ? new Date(l.time).toLocaleDateString('vi-VN') : '')}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
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
    logItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef8', marginBottom: 8 },
    logText: { color: '#374151' },
    logTime: { color: '#6b7280', fontSize: 12, marginTop: 6 },
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
    }
});
