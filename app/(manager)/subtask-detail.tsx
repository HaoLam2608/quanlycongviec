import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getTaskById, getWorklogs, updateSubtask } from '@/src/axios/api';
import api from '@/src/axios/config';
import { PageHeader } from '../../components/ui/PageHeader';

interface Subtask {
    id: number;
    tenSubtask?: string;
    mota?: string;
    trangThai?: string;
    mucDoUuTien?: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiDuocGiao?: { hoten?: string; manv?: string };
    nguoiGiao?: { hoten?: string; manv?: string };
}

export default function SubtaskDetail() {
    const params = useLocalSearchParams();
    const id = params.id as string;
    const parentTaskId = params.taskId as string | undefined;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subtask, setSubtask] = useState<Subtask | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);
    const [logText, setLogText] = useState('');
    const [postingLog, setPostingLog] = useState(false);
    // Edit subtask modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editStart, setEditStart] = useState('');
    const [editEnd, setEditEnd] = useState('');
    const [editPriority, setEditPriority] = useState<string>('medium');
    const [editNotes, setEditNotes] = useState('');
    const [updatingSubtask, setUpdatingSubtask] = useState(false);
    const [currentParentTaskId, setCurrentParentTaskId] = useState<number | null>(parentTaskId ? Number(parentTaskId) : null);

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
                        // load comments and logs for this subtask
                        fetchComments();
                        fetchLogs();
                        return;
                    }
                }
            }

            // Fallback: try fetching subtask directly (some APIs expose /tasks/:id for subtasks)
            const data = await getTaskById(id);
            const s = data && data.id ? data : (data.task || data.data || null);
            setSubtask(s);
            // load related data
            fetchComments();
            fetchLogs();
        } catch (err) {
            console.error('Error loading subtask', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchComments = async () => {
        try {
            setCommentsLoading(true);
            const res = await api.get(`/comments/subtask/${id}`);
            const data = res.data || res;
            // backend might return array or { comments: [...] }
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

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            setPostingComment(true);
            await api.post('/comments', { subtaskId: Number(id), content: newComment.trim() });
            setNewComment('');
            await fetchComments();
        } catch (err) {
            console.error('Error posting comment', err);
        } finally {
            setPostingComment(false);
        }
    };

    const handlePostLog = async () => {
        if (!logText.trim()) return;
        try {
            setPostingLog(true);
            // Try to create a simple worklog entry; backend may extract user from token
            await api.post('/worklogs', { subtaskId: Number(id), hours: 0, note: logText.trim(), date: new Date().toISOString() });
            setLogText('');
            setShowLogForm(false);
            await fetchLogs();
        } catch (err) {
            console.error('Error posting log', err);
        } finally {
            setPostingLog(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        load();
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
                        // ensure we have parent task id
                        if (!currentParentTaskId) {
                            const maybeTaskId = (subtask as any).taskId || (subtask as any).task?.id;
                            if (maybeTaskId) setCurrentParentTaskId(Number(maybeTaskId));
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
                    <View style={styles.personRow}>
                        {subtask.nguoiGiao && (
                            <View style={styles.personCardSmall}>
                                <Text style={styles.personLabel}>Người giao</Text>
                                <Text style={styles.personName}>{subtask.nguoiGiao.hoten}</Text>
                                {subtask.nguoiGiao.manv ? <Text style={styles.personCode}>{subtask.nguoiGiao.manv}</Text> : null}
                            </View>
                        )}

                        {((subtask as any).nguoiThucHien?.hoten || subtask.nguoiDuocGiao?.hoten) && (
                            <View style={styles.personCardSmall}>
                                <Text style={styles.personLabel}>Người thực hiện</Text>
                                <Text style={styles.personName}>{(subtask as any).nguoiThucHien?.hoten || subtask.nguoiDuocGiao?.hoten}</Text>
                                {((subtask as any).nguoiThucHien?.manv || subtask.nguoiDuocGiao?.manv) ? <Text style={styles.personCode}>{(subtask as any).nguoiThucHien?.manv || subtask.nguoiDuocGiao?.manv}</Text> : null}
                            </View>
                        )}
                    </View>
                </View>

                {/* Edit Subtask Modal */}
                <Modal visible={showEditModal} animationType="slide" transparent>
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContent}>
                            <Text style={modalStyles.modalTitle}>Sửa công việc nhỏ</Text>
                            <TextInput placeholder="Tiêu đề" value={editTitle} onChangeText={setEditTitle} style={modalStyles.input} />
                            <TextInput placeholder="Mô tả" value={editDesc} onChangeText={setEditDesc} style={[modalStyles.input, { height: 80 }]} multiline />
                            <TextInput placeholder="Ngày bắt đầu (YYYY-MM-DD)" value={editStart} onChangeText={setEditStart} style={modalStyles.input} />
                            <TextInput placeholder="Ngày kết thúc (YYYY-MM-DD)" value={editEnd} onChangeText={setEditEnd} style={modalStyles.input} />

                            <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Mức độ ưu tiên</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                {['high','medium','low'].map(p => (
                                    <TouchableOpacity key={p} onPress={() => setEditPriority(p)} style={[modalStyles.priorityOption, editPriority === p ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                                        <Text style={{ color: editPriority === p ? '#fff' : '#111827', fontWeight: '700' }}>{p === 'high' ? 'Cao' : p === 'medium' ? 'Trung bình' : 'Thấp'}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput placeholder="Ghi chú (tuỳ chọn)" value={editNotes} onChangeText={setEditNotes} style={[modalStyles.input, { height: 80 }]} multiline />

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
                                }} disabled={updatingSubtask}>
                                    {updatingSubtask ? <ActivityIndicator color="#fff" /> : <Text style={[modalStyles.modalBtnText, { color: '#fff' }]}>Lưu</Text>}
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
    /* Logs input uses same styles as comments; no extra action buttons */
    logInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    logButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
    logButtonText: { color: '#fff', fontWeight: '700' },
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
