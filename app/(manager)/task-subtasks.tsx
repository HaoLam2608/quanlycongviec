import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTaskById, createSubtask } from '@/src/axios/api';
import { getGroups } from '@/src/axios/adminApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageHeader } from '../../components/ui/PageHeader';

interface Subtask {
    id: number;
    tenSubtask?: string;
    trangThai?: string;
    name?: string;
    mota?: string;
    nguoiDuocGiao?: { hoten?: string };
    ngayKetThuc?: string;
}

export default function TaskSubtasks() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const taskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [taskName, setTaskName] = useState<string>('Công việc con');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState<string>('Chưa bắt đầu');
    const [newNotes, setNewNotes] = useState('');
    const [availableAssignees, setAvailableAssignees] = useState<Array<{id:number; hoten:string}>>([]);

    useEffect(() => {
        if (taskId) loadSubtasks();
    }, [taskId]);

    const loadSubtasks = async () => {
        try {
            setLoading(true);
            const data = await getTaskById(taskId);
            // data may be the task object directly
            const taskObj = data && data.id ? data : (data.task || data.data || null);
            if (taskObj) {
                setTaskName(taskObj.tentask || taskObj.ten || 'Công việc con');
                setSubtasks(Array.isArray(taskObj.subtasks) ? taskObj.subtasks : (taskObj.children || []));
                // load groups for this project's duanId to build assignee list
                try {
                    const duanId = taskObj.duan?.id || taskObj.duanId || taskObj.projectId || null;
                    if (duanId) {
                        const groupsResp = await getGroups({ duanId: Number(duanId) });
                        const normalizeToList = (r: any) => {
                            if (Array.isArray(r)) return r;
                            if (Array.isArray(r?.data)) return r.data;
                            if (Array.isArray(r?.groups)) return r.groups;
                            if (Array.isArray(r?.rows)) return r.rows;
                            if (Array.isArray(r?.items)) return r.items;
                            if (r && typeof r === 'object') {
                                for (const k of Object.keys(r)) if (Array.isArray(r[k])) return r[k];
                            }
                            return [];
                        };
                        const groups = normalizeToList(groupsResp || []);
                        const seen = new Set<number>();
                        const members: Array<{id:number; hoten:string}> = [];
                        for (const g of groups) {
                            const leaderId = g?.leader?.id || g?.truong?.id || g?.leaderId || null;
                            const ms = Array.isArray(g.members) ? g.members : (g.Users || g.userList || []);
                            for (const m of ms) {
                                const id = m?.id || m?.userId || m?.nguoiId;
                                if (!id) continue;
                                if (leaderId && Number(leaderId) === Number(id)) continue; // exclude leader
                                if (seen.has(Number(id))) continue;
                                seen.add(Number(id));
                                members.push({ id: Number(id), hoten: m.hoten || m.name || m.fullName || String(id) });
                            }
                        }
                        setAvailableAssignees(members);
                    } else {
                        setAvailableAssignees([]);
                    }
                } catch (e) {
                    console.error('Error loading groups for assignees', e);
                    setAvailableAssignees([]);
                }
            } else {
                setSubtasks([]);
            }
        } catch (error) {
            console.error('Error loading subtasks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadSubtasks();
    };

    const handleCreateSubtask = async () => {
        try {
            if (!newTitle.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề công việc con');
            if (!newDesc.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập mô tả công việc con');
            if (!selectedAssigneeId) return Alert.alert('Lỗi', 'Vui lòng chọn người thực hiện');
            if (!newStartDate.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập ngày bắt đầu (YYYY-MM-DD)');
            if (!newDueDate.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập ngày kết thúc (YYYY-MM-DD)');
            // validate date order
            const s = new Date(newStartDate);
            const e = new Date(newDueDate);
            if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return Alert.alert('Lỗi', 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
            // Always pass a numeric assignee id (API requires a number)
            const assigneePayload = Number(selectedAssigneeId);
            await createSubtask(taskId, {
                tenSubtask: newTitle,
                mota: newDesc,
                nguoiThucHienId: assigneePayload,
                ngayBatDau: newStartDate,
                ngayKetThuc: newDueDate || undefined,
                ghiChu: newNotes,
            });
            Alert.alert('Thành công', 'Tạo công việc con thành công');
            setShowCreateModal(false);
            setNewTitle('');
            setNewDesc('');
            setNewDueDate('');
            setNewStartDate('');
            setSelectedAssigneeId(null);
            setNewStatus('Chưa bắt đầu');
            setNewNotes('');
            setRefreshing(true);
            await loadSubtasks();
        } catch (err: any) {
            console.error('Create subtask error', err);
            Alert.alert('Lỗi', err?.message || 'Không thể tạo công việc con');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title={taskName || 'Công việc con'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title={taskName || 'Công việc con'} />

            {/* Sub header to indicate this is subtask list */}
            <View style={styles.subHeaderRow}>
                <View style={styles.subHeaderPill}><Text style={styles.subHeaderPillText}>Danh sách công việc con</Text></View>
                <Text style={styles.subHeaderInfo}>Công việc cha: {taskName}</Text>
            </View>

            <FlatList
                data={subtasks}
                keyExtractor={(item) => (item.id || Math.random()).toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/(manager)/subtask-detail', params: { id: String(item.id), taskId: String((item as any).taskId || '') } } as any)}
                    >
                        <View style={styles.cardTopBadges}>
                            <View style={[styles.statusBadgeSmall, { backgroundColor: item.trangThai === 'Hoàn thành' ? '#10b981' : item.trangThai === 'Đang chạy' ? '#f59e0b' : '#6b7280' }]}>
                                <Text style={styles.statusTextSmall}>{item.trangThai || 'Chưa rõ'}</Text>
                            </View>
                            {(item as any).mucDoUuTien ? (
                                <View style={[styles.priorityBadge, { backgroundColor: (item as any).mucDoUuTien === 'high' ? '#ef4444' : (item as any).mucDoUuTien === 'medium' ? '#f59e0b' : '#10b981' }]}>
                                    <Text style={styles.badgeText}>{(item as any).mucDoUuTien === 'high' ? 'Cao' : (item as any).mucDoUuTien === 'medium' ? 'Trung bình' : 'Thấp'}</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.cardMain}>
                            <Text style={styles.cardTitleLarge} numberOfLines={2}>{item.tenSubtask || item.name || 'Không có tên'}</Text>
                            { (item as any).mota ? <Text style={styles.cardDesc} numberOfLines={2}>{(item as any).mota}</Text> : null }

                            <View style={styles.cardFooterRow}>
                                <Text style={styles.projectTag}>🗂️ Công việc cha: {taskName}</Text>
                            </View>

                            <View style={styles.cardFooterRow}> 
                                {( (item as any).nguoiThucHien?.hoten || (item as any).nguoiDuocGiao?.hoten ) && (
                                    <Text style={styles.assigneeText}>👤 Người thực hiện: <Text style={{fontWeight:'700'}}>{(item as any).nguoiThucHien?.hoten || (item as any).nguoiDuocGiao?.hoten}</Text></Text>
                                )}
                            </View>

                            <View style={styles.cardFooterRowRight}>
                                {(item as any).ngayBatDau ? <Text style={styles.dateText}>⏱ {new Date((item as any).ngayBatDau).toLocaleDateString('vi-VN')}</Text> : null}
                                {(item as any).ngayKetThuc ? <Text style={[styles.dateText, { marginLeft: 12 }]}>📅 {new Date((item as any).ngayKetThuc).toLocaleDateString('vi-VN')}</Text> : null}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>Không có công việc con</Text>
                    </View>
                )}
                contentContainerStyle={{ padding: 16 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />

            {/* Floating create subtask button */}
            <TouchableOpacity style={styles.fab} onPress={() => { setNewTitle(''); setNewDesc(''); setNewDueDate(''); setShowCreateModal(true); }}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create Subtask Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View style={modalStyles.modalOverlay}>
                            <View style={modalStyles.modalContent}>
                                <Text style={modalStyles.modalTitle}>Tạo công việc con</Text>
                                <TextInput placeholder="Tiêu đề" value={newTitle} onChangeText={setNewTitle} style={modalStyles.input} />
                                <TextInput placeholder="Mô tả" value={newDesc} onChangeText={setNewDesc} style={[modalStyles.input, { height: 80 }]} multiline />
                                <TextInput placeholder="Ngày bắt đầu (YYYY-MM-DD)" value={newStartDate} onChangeText={setNewStartDate} style={modalStyles.input} />
                                <TextInput placeholder="Ngày kết thúc (YYYY-MM-DD)" value={newDueDate} onChangeText={setNewDueDate} style={modalStyles.input} />

                                <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Người thực hiện (chỉ các thành viên dự án)</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                                    {availableAssignees.length === 0 ? (
                                        <Text style={{ color: '#6b7280' }}>Không có thành viên dự án</Text>
                                    ) : availableAssignees.map(a => (
                                        <TouchableOpacity key={a.id} onPress={() => setSelectedAssigneeId(a.id)} style={[modalStyles.pill, selectedAssigneeId === a.id ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                                            <Text style={{ color: selectedAssigneeId === a.id ? '#fff' : '#111827', fontWeight: '600' }}>{a.hoten}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Trạng thái</Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                                    {['Chưa bắt đầu','Đang chạy','Hoàn thành'].map(s => (
                                        <TouchableOpacity key={s} onPress={() => setNewStatus(s)} style={[modalStyles.statusOption, newStatus === s ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                                            <Text style={{ color: newStatus === s ? '#fff' : '#111827', fontWeight: '600' }}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TextInput placeholder="Ghi chú (tuỳ chọn)" value={newNotes} onChangeText={setNewNotes} style={[modalStyles.input, { height: 80 }]} multiline />
                        <View style={modalStyles.modalActions}>
                            <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowCreateModal(false)}>
                                <Text style={modalStyles.modalBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[modalStyles.modalBtn, { backgroundColor: '#3b82f6' }]} onPress={handleCreateSubtask}>
                                <Text style={[modalStyles.modalBtnText, { color: '#fff' }]}>Tạo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6b7280' },
    subtaskCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth:1, borderColor:'#e5e7eb' },
    subtaskName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    subtaskStatus: { marginTop: 6, fontSize: 13, color: '#6b7280' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: '#6b7280' },
    /* Card styles */
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
    cardAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    cardBody: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1f2937', marginRight: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    cardDesc: { marginTop: 6, color: '#6b7280', fontSize: 13 },
    cardFooter: { flexDirection: 'row', gap: 10, marginTop: 8 },
    cardMeta: { color: '#6b7280', fontSize: 13, marginRight: 12 },
    /* New layout styles */
    cardRowTop: { flexDirection: 'row', alignItems: 'flex-start' },
    cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginTop: 4 },
    metaIcon: { marginRight: 6, fontSize: 14 },
    metaText: { color: '#6b7280', fontSize: 13 },
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
    /* Subheader */
    subHeaderRow: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eef2ff' , flexDirection: 'column'},
    subHeaderPill: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginBottom: 6 },
    subHeaderPillText: { color: '#92400e', fontWeight: '700' },
    subHeaderInfo: { color: '#6b7280', fontSize: 13 },
    /* Card top badges */
    cardTopBadges: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
    statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    statusTextSmall: { color: '#fff', fontSize: 12, fontWeight: '700' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cardMain: { paddingHorizontal: 12, paddingVertical: 10 },
    cardTitleLarge: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    cardFooterRow: { marginTop: 6 },
    projectTag: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
    assigneeText: { color: '#6b7280', fontSize: 13 },
    cardFooterRowRight: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 },
    dateText: { color: '#6b7280', fontSize: 12 },
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
    pill: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    statusOption: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    }
});

// (fab and meta styles are included in StyleSheet above)
