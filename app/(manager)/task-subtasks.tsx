import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTaskById, createSubtask, deleteSubtask } from '@/src/axios/api';
import { getGroups } from '@/src/axios/adminApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageHeader } from '../../components/ui/PageHeader';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    const [parentStartDate, setParentStartDate] = useState<string>('');
    const [parentDueDate, setParentDueDate] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState<string>('Chưa bắt đầu');
    const [newNotes, setNewNotes] = useState('');
    const [showAssigneeList, setShowAssigneeList] = useState(false);
    const [availableAssignees, setAvailableAssignees] = useState<Array<{id:number; hoten:string}>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<string>('all');

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
                // save parent task start date for client-side validation
                const pStart = taskObj.ngayBatDau || taskObj.startDate || taskObj.ngaybatdau || taskObj.start_date || '';
                setParentStartDate(pStart ? (pStart.split && pStart.split('T') ? pStart.split('T')[0] : String(pStart)) : '');
                const pEnd = taskObj.ngayKetThuc || taskObj.dueDate || taskObj.ngayketthuc || taskObj.end_date || '';
                setParentDueDate(pEnd ? (pEnd.split && pEnd.split('T') ? pEnd.split('T')[0] : String(pEnd)) : '');
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

    // Xóa subtask (sử dụng API deleteSubtask(taskId, subtaskId))
    const handleDeleteSubtask = async (subtaskId: number, subtaskName?: string) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa công việc con "${subtaskName || ''}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSubtask(taskId, subtaskId);
                            Alert.alert('Thành công', 'Đã xóa công việc con');
                            setRefreshing(true);
                            await loadSubtasks();
                        } catch (error: any) {
                            console.error('Delete subtask error', error);
                            Alert.alert('Lỗi', error?.message || 'Không thể xóa công việc con');
                        }
                    },
                },
            ]
        );
    };

    const getErrorMessage = (err: any) => {
        if (!err) return 'Không thể tạo công việc con';
        return err?.response?.data?.error || err?.response?.data?.message || err?.data?.error || err?.data?.message || err?.error || err?.message || String(err);
    };

    const handleCreateSubtask = async () => {
        try {
            if (!newTitle.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề công việc con');
            if (!newDesc.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập mô tả công việc con');
            // Assignee is optional now
            if (!newStartDate.trim()) return Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu');
            if (!newDueDate.trim()) return Alert.alert('Lỗi', 'Vui lòng chọn ngày kết thúc');
            // Client-side validation: subtask start must be >= parent task start
            if (parentStartDate) {
                const parent = new Date(parentStartDate);
                const s = new Date(newStartDate);
                if (isNaN(parent.getTime()) === false && isNaN(s.getTime()) === false && s < parent) {
                    return Alert.alert('Lỗi', `Ngày bắt đầu của công việc nhỏ phải lớn hơn hoặc bằng ngày bắt đầu của công việc chính (${new Date(parentStartDate).toLocaleDateString('vi-VN')})`);
                }
            }
            // Client-side validation: subtask due date must be <= parent task due date
            if (parentDueDate) {
                const parentEnd = new Date(parentDueDate);
                const due = new Date(newDueDate);
                if (isNaN(parentEnd.getTime()) === false && isNaN(due.getTime()) === false && due > parentEnd) {
                    return Alert.alert('Lỗi', `Ngày kết thúc của công việc nhỏ không được muộn hơn ngày kết thúc của công việc chính (${new Date(parentDueDate).toLocaleDateString('vi-VN')})`);
                }
            }
            // validate date order
            const s = new Date(newStartDate);
            const e = new Date(newDueDate);
            if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return Alert.alert('Lỗi', 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
            // Build payload; only include assignee if selected (allow unassigned)
            const payload: any = {
                tenSubtask: newTitle,
                mota: newDesc,
                ngayBatDau: newStartDate,
                ngayKetThuc: newDueDate || undefined,
                ghiChu: newNotes,
            };
            if (selectedAssigneeId !== null && typeof selectedAssigneeId !== 'undefined') {
                payload.nguoiThucHienId = Number(selectedAssigneeId);
            }
            await createSubtask(taskId, payload);
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
            const msg = getErrorMessage(err);
            Alert.alert('Lỗi', msg || 'Không thể tạo công việc con');
        }
    };

    // Filter and search logic
    const filteredSubtasks = subtasks.filter(task => {
        // Filter by status
        const matchesStatus = filter === 'all' || task.trangThai === filter;
        
        // Filter by search query
        const matchesSearch = searchQuery.trim() === '' || 
            task.tenSubtask?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.mota?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task as any).nguoiThucHien?.hoten?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task as any).nguoiDuocGiao?.hoten?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

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
            {/* <View style={styles.subHeaderRow}>
                <View style={styles.subHeaderPill}><Text style={styles.subHeaderPillText}>Danh sách công việc con</Text></View>
                <Text style={styles.subHeaderInfo}>Công việc cha: {taskName}</Text>
            </View> */}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm công việc con, người thực hiện..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Tất cả ({subtasks.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'Chưa bắt đầu' && styles.filterTabActive]}
                    onPress={() => setFilter('Chưa bắt đầu')}
                >
                    <Text style={[styles.filterText, filter === 'Chưa bắt đầu' && styles.filterTextActive]}>
                        Chưa bắt đầu
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'Đang chạy' && styles.filterTabActive]}
                    onPress={() => setFilter('Đang chạy')}
                >
                    <Text style={[styles.filterText, filter === 'Đang chạy' && styles.filterTextActive]}>
                        Đang làm
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'Hoàn thành' && styles.filterTabActive]}
                    onPress={() => setFilter('Hoàn thành')}
                >
                    <Text style={[styles.filterText, filter === 'Hoàn thành' && styles.filterTextActive]}>
                        Hoàn thành
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredSubtasks}
                keyExtractor={(item) => (item.id || Math.random()).toString()}
                renderItem={({ item }) => (
                    <View style={[styles.card, { flexDirection: 'row', alignItems: 'stretch' }]}> 
                        <TouchableOpacity
                            style={{ flex: 1 }}
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
                        <TouchableOpacity
                            style={{ alignSelf: 'center', marginLeft: 8, backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}
                            onPress={() => handleDeleteSubtask(item.id, item.tenSubtask || item.name)}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700' }}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>Không có công việc con</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery.trim() !== '' 
                                ? `Không tìm thấy kết quả cho "${searchQuery}"`
                                : filter !== 'all'
                                ? `Không có công việc con "${filter}"`
                                : 'Chưa có công việc con nào được tạo'
                            }
                        </Text>
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
                                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '75%' }}>
                                    <TextInput placeholder="Tiêu đề" value={newTitle} onChangeText={setNewTitle} style={modalStyles.input} />
                                    <TextInput placeholder="Mô tả" value={newDesc} onChangeText={setNewDesc} style={[modalStyles.input, { height: 80 }]} multiline />
                                    
                                    <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Ngày bắt đầu</Text>
                                    <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={modalStyles.dateButton}>
                                        <Text style={modalStyles.dateButtonText}>
                                            {newStartDate ? new Date(newStartDate).toLocaleDateString('vi-VN') : '📅 Chọn ngày bắt đầu'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showStartDatePicker && (
                                        <DateTimePicker
                                            value={newStartDate ? new Date(newStartDate) : new Date()}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                setShowStartDatePicker(Platform.OS === 'ios');
                                                if (selectedDate) {
                                                    setNewStartDate(selectedDate.toISOString().split('T')[0]);
                                                }
                                            }}
                                        />
                                    )}

                                    <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Ngày kết thúc</Text>
                                    <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={modalStyles.dateButton}>
                                        <Text style={modalStyles.dateButtonText}>
                                            {newDueDate ? new Date(newDueDate).toLocaleDateString('vi-VN') : '📅 Chọn ngày kết thúc'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showEndDatePicker && (
                                        <DateTimePicker
                                            value={newDueDate ? new Date(newDueDate) : new Date()}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                setShowEndDatePicker(Platform.OS === 'ios');
                                                if (selectedDate) {
                                                    setNewDueDate(selectedDate.toISOString().split('T')[0]);
                                                }
                                            }}
                                        />
                                    )}

                                    <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Người thực hiện (tuỳ chọn, chỉ các thành viên dự án)</Text>
                                    <View>
                                        <TouchableOpacity style={modalStyles.assigneeSelect} onPress={() => setShowAssigneeList(!showAssigneeList)}>
                                            <Text style={modalStyles.assigneeSelectText}>{selectedAssigneeId ? (availableAssignees.find(a => a.id === selectedAssigneeId)?.hoten) : 'Không phân công (tuỳ chọn)'}</Text>
                                            <Ionicons name={showAssigneeList ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
                                        </TouchableOpacity>
                                        {showAssigneeList && (
                                            <View style={{ marginTop: 8, maxHeight: 220 }}>
                                                <ScrollView>
                                                    {/* Allow no assignee */}
                                                    <TouchableOpacity key={'no-assignee'} onPress={() => { setSelectedAssigneeId(null); setShowAssigneeList(false); }} style={[modalStyles.pill, selectedAssigneeId === null ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                                                        <Text style={{ color: selectedAssigneeId === null ? '#fff' : '#111827', fontWeight: '600' }}>Không phân công</Text>
                                                    </TouchableOpacity>
                                                    {availableAssignees.length === 0 ? (
                                                        <Text style={{ color: '#6b7280', marginTop: 8 }}>Không có thành viên dự án</Text>
                                                    ) : availableAssignees.map(a => (
                                                        <TouchableOpacity key={a.id} onPress={() => { setSelectedAssigneeId(a.id); setShowAssigneeList(false); }} style={[modalStyles.pill, selectedAssigneeId === a.id ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }]}>
                                                            <Text style={{ color: selectedAssigneeId === a.id ? '#fff' : '#111827', fontWeight: '600' }}>{a.hoten}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
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
                                </ScrollView>
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
    searchContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        padding: 0,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    clearIcon: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '700',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: '#3b82f6',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#fff',
    },
    subtaskCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth:1, borderColor:'#e5e7eb' },
    subtaskName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
    subtaskStatus: { marginTop: 6, fontSize: 13, color: '#6b7280' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
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
    },
    assigneeSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    assigneeSelectText: { color: '#0f172a', fontWeight: '600' },
    dateButton: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    dateButtonText: {
        fontSize: 14,
        color: '#111827',
    },
});

// (fab and meta styles are included in StyleSheet above)
