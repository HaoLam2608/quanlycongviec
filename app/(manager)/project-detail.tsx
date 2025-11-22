import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, FlatList, RefreshControl, Modal, TextInput, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTask, deleteTask } from '@/src/axios/api';
import { PRIORITY_LEVELS, PRIORITY_LABELS } from '../../constants/roles';
import { getProjectById, getTasksByProject } from '@/src/axios/api';
import { getGroups, groupAPI } from '@/src/axios/adminApi';
import { PageHeader } from '../../components/ui/PageHeader';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Project {
    id: number;
    tenduan: string;
    mota: string;
    status: string;
    ngaybatdau: string;
    ngayketthuc: string;
    nguoiDamNhan?: {
        hoten: string;
        manv: string;
    };
}

interface Task {
    id: number;
    tentask: string;
    trangThai: string;
    mucDoUuTien: string;
    nguoiDuocGiao?: {
        hoten: string;
    };
}

type TabType = 'overview' | 'tasks' | 'groups';

export default function ProjectDetail() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const projectId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
    const [newPriority, setNewPriority] = useState<string>('trung_binh');
    const [newNotes, setNewNotes] = useState('');
    const [groupsAttached, setGroupsAttached] = useState<any[]>([]);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const isGroupClosed = (g: any) => {
        if (!g) return false;
        const closedFlags = [g.closed, g.isClosed, g.dong, g.trangthai, g.status, g.state, g.is_closed, g.closedAt, g.closed_at];
        for (const v of closedFlags) {
            if (v === true) return true;
            if (v === '1' || v === 1) return true;
            if (typeof v === 'string') {
                const s = v.toLowerCase();
                if (s.includes('đã đóng') || s.includes('da dong') || s.includes('closed') || s.includes('dong')) return true;
            }
        }
        return false;
    };

    const getGroupProjectCount = (g: any) => {
        if (!g) return 0;
        if (Array.isArray(g.groupProjects)) return g.groupProjects.length;
        if (Array.isArray(g.projects)) return g.projects.length;
        if (Array.isArray(g.duans)) return g.duans.length;
        if (Array.isArray(g.projectIds)) return g.projectIds.length;
        if (Array.isArray(g.duanIds)) return g.duanIds.length;
        if (typeof g.projectCount === 'number') return g.projectCount;
        if (typeof g.projectsCount === 'number') return g.projectsCount;
        if (typeof g.memberCount === 'number') return g.memberCount; // fallback but not ideal
        return 0;
    };

    const isGroupFull = (g: any) => {
        return getGroupProjectCount(g) >= 2;
    };
    // debug state removed

    useEffect(() => {
        if (projectId) {
            loadProjectData();
        }
    }, [projectId]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            const [projectData, tasksData] = await Promise.all([
                getProjectById(projectId),
                getTasksByProject(projectId)
            ]);
            setProject(projectData);
            setTasks(tasksData);
        } catch (error) {
            console.error('Error loading project:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin dự án');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProjectData();
    };

    const loadGroupsForProject = async () => {
        if (!projectId) return;
        try {
            setLoadingGroups(true);
            // 1) Try server-side filter first (duanId param)
            let resp = await getGroups({ duanId: Number(projectId) });
            // debug logs removed
            let list: any[] = [];

            // use component-level isGroupClosed helper
            if (Array.isArray(resp)) list = resp;
            else if (Array.isArray(resp?.data)) list = resp.data;
            else if (Array.isArray(resp?.groups)) list = resp.groups;
            else if (Array.isArray(resp?.rows)) list = resp.rows;
            else if (Array.isArray(resp?.items)) list = resp.items;
            else if (resp && typeof resp === 'object') {
                // try to find first array-valued property
                const keys = Object.keys(resp);
                for (const k of keys) {
                    if (Array.isArray((resp as any)[k])) {
                        list = (resp as any)[k];
                        break;
                    }
                }
            }

            // If server returned nothing useful, fallback: fetch all groups and filter by group_projects relation
            const pid = Number(projectId);
            const normalizeToList = (r: any) => {
                if (Array.isArray(r)) return r;
                if (Array.isArray(r?.data)) return r.data;
                if (Array.isArray(r?.groups)) return r.groups;
                if (Array.isArray(r?.rows)) return r.rows;
                if (Array.isArray(r?.items)) return r.items;
                // try first array property
                if (r && typeof r === 'object') {
                    for (const k of Object.keys(r)) if (Array.isArray(r[k])) return r[k];
                }
                return [];
            };

            let filtered = (normalizeToList(resp) || []).filter((g: any) => {
                if (!g) return false;
                if (g.duanId && Number(g.duanId) === pid) return true;
                if (g.projectId && Number(g.projectId) === pid) return true;
                if (Array.isArray(g.projectIds) && g.projectIds.map(Number).includes(pid)) return true;
                if (Array.isArray(g.duanIds) && g.duanIds.map(Number).includes(pid)) return true;
                // check groupProjects mapping entries (table group_projects)
                if (Array.isArray(g.groupProjects)) {
                    for (const gp of g.groupProjects) {
                        if (!gp) continue;
                        if (gp.projectId && Number(gp.projectId) === pid) return true;
                        if (gp.duanId && Number(gp.duanId) === pid) return true;
                        if (gp.duan_id && Number(gp.duan_id) === pid) return true;
                        if (gp.project_id && Number(gp.project_id) === pid) return true;
                    }
                }
                // check duans/projects nested in the group (some backends embed project objects)
                if (Array.isArray(g.duans)) {
                    for (const d of g.duans) if (d && (Number(d.id) === pid || Number(d.duanId) === pid || Number(d.projectId) === pid)) return true;
                }
                if (Array.isArray(g.projects)) {
                    for (const d of g.projects) if (d && (Number(d.id) === pid || Number(d.duanId) === pid || Number(d.projectId) === pid)) return true;
                }
                return false;
            });

            // If nothing matched from server-side filtered response, try fetching all groups and filter client-side
            if (!filtered || filtered.length === 0) {
                const allResp = await getGroups();
                const allList = normalizeToList(allResp || []);
                filtered = (allList || []).filter((g: any) => {
                    if (!g) return false;
                    if (g.duanId && Number(g.duanId) === pid) return true;
                    if (g.projectId && Number(g.projectId) === pid) return true;
                    if (Array.isArray(g.projectIds) && g.projectIds.map(Number).includes(pid)) return true;
                    if (Array.isArray(g.duanIds) && g.duanIds.map(Number).includes(pid)) return true;
                    if (Array.isArray(g.groupProjects)) {
                        for (const gp of g.groupProjects) {
                            if (!gp) continue;
                            if (gp.projectId && Number(gp.projectId) === pid) return true;
                            if (gp.duanId && Number(gp.duanId) === pid) return true;
                            if (gp.duan_id && Number(gp.duan_id) === pid) return true;
                            if (gp.project_id && Number(gp.project_id) === pid) return true;
                        }
                    }
                    if (Array.isArray(g.duans)) {
                        for (const d of g.duans) if (d && (Number(d.id) === pid || Number(d.duanId) === pid || Number(d.projectId) === pid)) return true;
                    }
                    if (Array.isArray(g.projects)) {
                        for (const d of g.projects) if (d && (Number(d.id) === pid || Number(d.duanId) === pid || Number(d.projectId) === pid)) return true;
                    }
                    return false;
                });
            }

            // Also compute available groups (all groups minus attached) to show in "Add" modal
            try {
                const allResp2 = await getGroups();
                const allList2 = normalizeToList(allResp2 || []);
                const attachedIds = new Set((filtered || []).map((g: any) => g.id));
                const avail = (allList2 || []).filter((g: any) => g && !attachedIds.has(g.id) && !isGroupClosed(g) && !isGroupFull(g));
                setAvailableGroups(avail || []);
            } catch (e) {
                setAvailableGroups([]);
            }

            setGroupsAttached(filtered || []);
        } catch (err) {
            console.error('Error loading groups for project', err);
        } finally {
            setLoadingGroups(false);
        }
    };

    const openAddGroup = async () => {
        setShowAddGroupModal(true);
        // ensure availableGroups up-to-date
        try {
            setLoadingGroups(true);
            const allResp = await getGroups();
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
            const allList = normalizeToList(allResp || []);
            const attachedIds = new Set((groupsAttached || []).map((g: any) => g.id));
            const avail = (allList || []).filter((g: any) => g && !attachedIds.has(g.id) && !isGroupClosed(g) && !isGroupFull(g));
            setAvailableGroups(avail || []);
        } catch (e) {
            console.error('Error loading available groups', e);
            setAvailableGroups([]);
        } finally {
            setLoadingGroups(false);
        }
    };

    const handleAddGroup = async (groupId: number) => {
        try {
            setLoading(true);
            await groupAPI.addGroupToProject(groupId, Number(projectId));
            Alert.alert('Thành công', 'Đã thêm nhóm vào dự án');
            setShowAddGroupModal(false);
            await loadGroupsForProject();
        } catch (err: any) {
            console.error('Add group error', err);
            // Try to show backend message when possible
            const backendMsg = err?.response?.data?.message || err?.data?.message || err?.message;
            Alert.alert('Lỗi', backendMsg || 'Không thể thêm nhóm');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveGroup = async (groupId: number) => {
        try {
            setLoading(true);
            await groupAPI.removeGroupFromProject(groupId, Number(projectId));
            Alert.alert('Thành công', 'Đã xóa nhóm khỏi dự án');
            await loadGroupsForProject();
        } catch (err: any) {
            console.error('Remove group error', err);
            const backendMsg = err?.response?.data?.message || err?.data?.message || err?.message;
            Alert.alert('Lỗi', backendMsg || 'Không thể xóa nhóm');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setNewTitle('');
        setNewDesc('');
        setNewDueDate('');
        setNewStartDate('');
        setSelectedAssigneeId(null);
        setNewPriority('trung_binh');
        setNewNotes('');
        // ensure groupsAttached is loaded so we can show leaders as assignee options
        loadGroupsForProject().finally(() => setShowCreateModal(true));
    };

    // Note: only displaying groups attached to this project (no add/remove UI)

    const createNewTask = async () => {
        try {
            if (!newTitle.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề công việc');
            if (!newDesc.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập mô tả công việc');
            if (!newStartDate.trim()) return Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu');
            if (!newDueDate.trim()) return Alert.alert('Lỗi', 'Vui lòng chọn ngày kết thúc');
            if (!selectedAssigneeId) return Alert.alert('Lỗi', 'Vui lòng chọn người thực hiện (trưởng nhóm)');
            if (!newPriority) return Alert.alert('Lỗi', 'Vui lòng chọn mức độ ưu tiên');

            setLoading(true);
            // map client priority values to backend enums
            const priorityMap: any = {
                thap: 'low',
                trung_binh: 'medium',
                cao: 'high',
                khan_cap: 'high'
            };
            const priorityForBackend = priorityMap[newPriority] || 'medium';

            const payload: any = {
                tentask: newTitle,
                mota: newDesc,
                duanId: Number(projectId),
                nguoiDuocGiaoId: Number(selectedAssigneeId),
                ngayBatDau: newStartDate,
                ngayKetThuc: newDueDate,
                mucDoUuTien: priorityForBackend,
                ghiChu: newNotes,
            };

            const res = await createTask(payload as any);

            Alert.alert('Thành công', 'Tạo công việc mới thành công');
            setShowCreateModal(false);
            loadProjectData();
        } catch (err: any) {
            console.error('Create task error', err);
            Alert.alert('Lỗi', err?.message || 'Không thể tạo công việc');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'chua_bat_dau': return '#6b7280';
            case 'dang_chay': return '#f59e0b';
            case 'da_hoan_thanh': return '#10b981';
            case 'da_dong': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'chua_bat_dau': return 'Chưa bắt đầu';
            case 'dang_chay': return 'Đang chạy';
            case 'da_hoan_thanh': return 'Đã hoàn thành';
            case 'da_dong': return 'Đã đóng';
            default: return status;
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'Chưa bắt đầu': return '#6b7280';
            case 'Đang chạy': return '#f59e0b';
            case 'Chờ xác nhận hoàn thành': return '#3b82f6';
            case 'Hoàn thành': return '#10b981';
            default: return '#6b7280';
        }
    };

    const renderOverview = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Mô tả</Text>
                <Text style={styles.description}>
                    {project?.mota || 'Không có mô tả'}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Trạng thái</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(project?.status || '') }]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(project?.status || '')}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Thời gian</Text>
                <View style={styles.dateContainer}>
                    <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Ngày bắt đầu:</Text>
                        <Text style={styles.dateValue}>
                            {project?.ngaybatdau ? new Date(project.ngaybatdau).toLocaleDateString('vi-VN') : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Ngày kết thúc:</Text>
                        <Text style={styles.dateValue}>
                            {project?.ngayketthuc ? new Date(project.ngayketthuc).toLocaleDateString('vi-VN') : 'N/A'}
                        </Text>
                    </View>
                </View>
            </View>

            {project?.nguoiDamNhan && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 Người quản lý</Text>
                    <View style={styles.managerCard}>
                        <Text style={styles.managerName}>{project.nguoiDamNhan.hoten}</Text>
                        <Text style={styles.managerCode}>{project.nguoiDamNhan.manv}</Text>
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Thống kê công việc</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{tasks?.length || 0}</Text>
                        <Text style={styles.statLabel}>Tổng số</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
                            {tasks?.filter(t => t.trangThai === 'Đang chạy').length || 0}
                        </Text>
                        <Text style={styles.statLabel}>Đang làm</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: '#10b981' }]}>
                            {tasks?.filter(t => t.trangThai === 'Hoàn thành').length || 0}
                        </Text>
                        <Text style={styles.statLabel}>Hoàn thành</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const handleDeleteTask = async (taskId: number, title?: string) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa công việc "${title || ''}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deleteTask(taskId);
                            Alert.alert('Thành công', 'Đã xóa công việc');
                            await loadProjectData();
                        } catch (err: any) {
                            console.error('Delete task error', err);
                            const backendMsg = err?.response?.data?.message || err?.message;
                            Alert.alert('Lỗi', backendMsg || 'Không thể xóa công việc');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderTaskItem = ({ item }: { item: Task }) => (
        <View style={[styles.card, { flexDirection: 'row', alignItems: 'stretch' }]}> 
            <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.95}
                onPress={() => router.push(`/(manager)/task-detail?id=${item.id}`)}
            >
                <View style={styles.cardTopBadges}>
                    <View style={[styles.statusBadgeSmall, { backgroundColor: getTaskStatusColor(item.trangThai) }]}>
                        <Text style={styles.statusTextSmall}>{item.trangThai || 'Chưa rõ'}</Text>
                    </View>
                    {(item as any).mucDoUuTien ? (
                        <View style={[styles.priorityBadge, { backgroundColor: (item as any).mucDoUuTien === 'high' ? '#ef4444' : (item as any).mucDoUuTien === 'medium' ? '#f59e0b' : '#10b981' }]}>
                            <Text style={styles.badgeText}>{(item as any).mucDoUuTien === 'high' ? 'Cao' : (item as any).mucDoUuTien === 'medium' ? 'Trung bình' : 'Thấp'}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.cardMain}>
                    <Text style={styles.cardTitleLarge} numberOfLines={2}>{item.tentask}</Text>
                    { (item as any).mota ? <Text style={styles.cardDesc} numberOfLines={2}>{(item as any).mota}</Text> : null }

                    {item.nguoiDuocGiao && (
                        <Text style={styles.assigneeText}>👤 Người thực hiện: <Text style={{fontWeight:'700'}}>{item.nguoiDuocGiao.hoten}</Text></Text>
                    )}

                    <View style={styles.cardFooterRowRight}>
                        {(item as any).ngayBatDau ? <Text style={styles.dateText}>⏱ {new Date((item as any).ngayBatDau).toLocaleDateString('vi-VN')}</Text> : null}
                        {(item as any).ngayKetThuc ? <Text style={[styles.dateText, { marginLeft: 12 }]}>📅 {new Date((item as any).ngayKetThuc).toLocaleDateString('vi-VN')}</Text> : null}
                    </View>
                </View>
            </TouchableOpacity>

            <View style={{ justifyContent: 'center', paddingLeft: 8 }}>
                <TouchableOpacity
                    style={styles.removeBtnInline}
                    onPress={() => handleDeleteTask(item.id, item.tentask)}
                >
                    <Text style={styles.removeBtnSmallText}>Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderTasks = () => (
        <View style={styles.tabContent}>
            <FlatList
                data={tasks || []}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>Chưa có công việc nào</Text>
                    </View>
                }
            />
        </View>
    );

    // Timeline removed

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết dự án" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!project) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết dự án" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.errorText}>Không tìm thấy dự án</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title={project.tenduan} />

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                        Tổng quan
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
                    onPress={() => setActiveTab('tasks')}
                >
                    <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
                        Công việc ({tasks.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
                    onPress={() => { setActiveTab('groups'); loadGroupsForProject(); }}
                >
                    <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Nhóm</Text>
                </TouchableOpacity>
                {/* Timeline tab removed */}
            </View>

            {/* Create task button: chỉ hiển thị khi đang ở tab Công việc */}

            {/* Tab Content: render overview or timeline inside ScrollView (they're static), but render tasks as a top-level FlatList to avoid nesting VirtualizedLists */}
            {activeTab === 'overview' && (
                <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
                    {renderOverview()}
                </ScrollView>
            )}

            {/* Timeline removed */}

            {activeTab === 'tasks' && (
                <View style={styles.tabContent}>
                    <View style={styles.createRow}>
                        <TouchableOpacity style={styles.createButton} onPress={openCreate}>
                            <Text style={styles.createButtonText}>+ Tạo công việc mới</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={tasks || []}
                        renderItem={renderTaskItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>📋</Text>
                                <Text style={styles.emptyText}>Chưa có công việc nào</Text>
                            </View>
                        }
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                </View>
            )}

            {activeTab === 'groups' && (
                <View style={styles.tabContent}>
                    <View style={styles.createRow}>
                        <TouchableOpacity style={[styles.createButton, { backgroundColor: '#1e40af' }]} onPress={openAddGroup}>
                            <Text style={styles.createButtonText}>+ Thêm nhóm</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 8 }}>
                        {loadingGroups ? (
                            <ActivityIndicator size="small" color="#1e40af" />
                        ) : groupsAttached.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>👥</Text>
                                <Text style={styles.emptyText}>Chưa có nhóm nào trong dự án</Text>
                                {/* debug box removed */}
                            </View>
                        ) : (
                            <FlatList
                                data={groupsAttached}
                                keyExtractor={(item) => item.id?.toString?.() || Math.random().toString()}
                                renderItem={({ item }) => {
                                    const leaderName = item.leader?.hoten || item.leaderName || item.truong?.hoten || item.leader?.name || '';
                                    const memberCount = (Array.isArray(item.members) && item.members.length) || item.memberCount || item.membersCount || '';
                                    const initial = (item.name || item.ten || leaderName || '').charAt(0).toUpperCase();
                                    return (
                                        <View style={styles.groupCardRow}>
                                            <TouchableOpacity style={styles.groupCard} onPress={() => router.push(`/(manager)/group-detail?id=${item.id}`)}>
                                                <View style={styles.groupAvatar}>
                                                    <Text style={styles.groupAvatarText}>{initial}</Text>
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 12 }}>
                                                    <Text style={styles.groupName}>{item.name || item.ten || 'Nhóm'}</Text>
                                                    {item.description ? <Text style={styles.groupDesc}>{item.description}</Text> : null}
                                                    {leaderName ? <Text style={styles.groupLeader}>Trưởng nhóm: {leaderName}</Text> : null}
                                                </View>
                                                <View style={styles.groupMeta}>
                                                    {memberCount ? <Text style={styles.groupMetaText}>{memberCount} thành viên</Text> : null}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Text style={styles.groupArrow}>›</Text>
                                                        <TouchableOpacity
                                                            style={styles.removeBtnInline}
                                                            disabled={loading}
                                                            onPress={() => {
                                                                Alert.alert(
                                                                    'Xác nhận',
                                                                    'Bạn có chắc muốn xóa nhóm khỏi dự án?',
                                                                    [
                                                                        { text: 'Hủy', style: 'cancel' },
                                                                        { text: 'Xóa', style: 'destructive', onPress: () => handleRemoveGroup(item.id) }
                                                                    ]
                                                                );
                                                            }}
                                                        >
                                                            <Text style={styles.removeBtnSmallText}>Xóa</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }}
                            />
                        )}
                    </View>
                </View>
            )}

            {/* Create Task Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tạo công việc mới</Text>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '75%' }}>
                            <TextInput placeholder="Tiêu đề" value={newTitle} onChangeText={setNewTitle} style={styles.input} />
                            <TextInput placeholder="Mô tả" value={newDesc} onChangeText={setNewDesc} style={[styles.input, { height: 80 }]} multiline />
                            
                            <Text style={{ fontWeight: '700', marginBottom: 6, color: '#374151' }}>Ngày bắt đầu</Text>
                            <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.datePickerButton}>
                                <Text style={[styles.datePickerText, !newStartDate && { color: '#9ca3af' }]}>
                                    {newStartDate ? `📅 ${new Date(newStartDate).toLocaleDateString('vi-VN')}` : '📅 Chọn ngày bắt đầu'}
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
                            <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.datePickerButton}>
                                <Text style={[styles.datePickerText, !newDueDate && { color: '#9ca3af' }]}>
                                    {newDueDate ? `📅 ${new Date(newDueDate).toLocaleDateString('vi-VN')}` : '📅 Chọn ngày kết thúc'}
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

                            {/* Assignee selection: only group leaders of groupsAttached */}
                            <Text style={{ marginTop: 6, marginBottom: 6, fontWeight: '700', color: '#374151' }}>Người thực hiện (Chọn trưởng nhóm)</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                {(() => {
                                    const seen = new Set();
                                    const leaders = (groupsAttached || []).map((g: any) => g.leader || g.truong || g.leaderInfo || null).filter(Boolean).reduce((acc: any[], l: any) => {
                                        const id = l.id || l.userId || l.leaderId || l.uid;
                                        if (!id || seen.has(id)) return acc;
                                        seen.add(id);
                                        acc.push({ id, name: l.hoten || l.name || l.fullName || l.hoTen || 'Không rõ' });
                                        return acc;
                                    }, [] as any[]);
                                    if (!leaders || leaders.length === 0) return <Text style={{ color: '#6b7280' }}>Không có trưởng nhóm để chọn</Text>;
                                    return leaders.map((L: any) => (
                                        <TouchableOpacity key={L.id} onPress={() => setSelectedAssigneeId(Number(L.id))} style={[styles.tagPill, selectedAssigneeId === Number(L.id) ? { backgroundColor: '#1e40af' } : { backgroundColor: '#eef2ff' }]}>
                                            <Text style={{ color: selectedAssigneeId === Number(L.id) ? '#fff' : '#111827', fontWeight: '600' }}>{L.name}</Text>
                                        </TouchableOpacity>
                                    ));
                                })()}
                            </View>

                            {/* Priority */}
                            <Text style={{ marginTop: 6, marginBottom: 6, fontWeight: '700', color: '#374151' }}>Mức độ ưu tiên</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                                {Object.keys(PRIORITY_LEVELS).map((k) => {
                                    const key = (PRIORITY_LEVELS as any)[k];
                                    return (
                                        <TouchableOpacity key={key} onPress={() => setNewPriority(key)} style={[styles.priorityOption, newPriority === key ? { backgroundColor: '#1e40af' } : { backgroundColor: '#f3f4f6' }] }>
                                            <Text style={{ color: newPriority === key ? '#fff' : '#111827', fontWeight: '600' }}>{(PRIORITY_LABELS as any)[key]}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TextInput placeholder="Ghi chú (tuỳ chọn)" value={newNotes} onChangeText={setNewNotes} style={[styles.input, { height: 80 }]} multiline />
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowCreateModal(false)}>
                                <Text style={styles.modalBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#3b82f6' }]} onPress={createNewTask}>
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Tạo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Existing Group Modal */}
            <Modal visible={showAddGroupModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thêm nhóm vào dự án</Text>
                        {loadingGroups ? (
                            <ActivityIndicator size="small" color="#1e40af" />
                        ) : availableGroups.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>🔎</Text>
                                <Text style={styles.emptyText}>Không có nhóm sẵn có để thêm</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={availableGroups}
                                keyExtractor={(item) => item.id?.toString?.() || Math.random().toString()}
                                renderItem={({ item }) => {
                                    const isClosed = isGroupClosed(item);
                                    const isFull = isGroupFull(item);
                                    const disabled = isClosed || isFull;
                                    return (
                                        <View style={styles.groupItem}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.groupName}>{item.name || item.ten || 'Nhóm'}</Text>
                                                {item.description ? <Text style={styles.groupDesc}>{item.description}</Text> : null}
                                            </View>
                                            <TouchableOpacity
                                                disabled={disabled}
                                                style={[styles.createButton, disabled ? { backgroundColor: '#9ca3af' } : { backgroundColor: '#1e40af' }]}
                                                onPress={() => {
                                                    if (disabled) {
                                                        if (isClosed) Alert.alert('Lỗi', 'Nhóm đã đóng, không thể thêm vào dự án');
                                                        else if (isFull) Alert.alert('Lỗi', 'Nhóm đã tham gia tối đa 2 dự án đồng thời');
                                                        return;
                                                    }
                                                    handleAddGroup(item.id);
                                                }}
                                            >
                                                <Text style={[styles.createButtonText]}>{isClosed ? 'Đã đóng' : isFull ? 'Đã tham gia 2 dự án' : 'Thêm'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }}
                            />
                        )}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowAddGroupModal(false)}>
                                <Text style={styles.modalBtnText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 100,
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
        paddingTop: 100,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#6b7280',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#f59e0b',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    tabTextActive: {
        color: '#f59e0b',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
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
    },
    statusBadgeLarge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    dateContainer: {
        gap: 12,
    },
    dateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    managerCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    managerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    managerCode: {
        fontSize: 14,
        color: '#6b7280',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    taskItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginRight: 8,
    },
    taskStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    taskStatusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    taskAssignee: {
        fontSize: 13,
        color: '#6b7280',
    },
    viewSubtasksBtn: {
        backgroundColor: '#eef2ff',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dbeafe'
    },
    viewSubtasksBtnText: {
        color: '#1e40af',
        fontWeight: '700'
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
    },
    debugBox: {
        padding: 12,
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    createRow: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        alignItems: 'center',
    },
    createButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
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
    groupItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
    },
    
    groupCard: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    groupLeader: {
        marginTop: 6,
        fontSize: 12,
        color: '#1e40af',
    },
    groupMeta: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    groupMetaText: {
        fontSize: 12,
        color: '#1e3a8a',
    },
    groupArrow: {
        fontSize: 20,
        color: '#1e3a8a',
        marginTop: 6,
    },
    groupAvatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#1e40af',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1e3a8a',
        shadowOpacity: 0.12,
        elevation: 2,
    },
    groupAvatarText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    groupDesc: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 6,
    },
    groupCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    removeBtnSmall: {
        backgroundColor: '#ef4444',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginLeft: 8,
        alignSelf: 'center',
        marginBottom: 12,
    },
    removeBtnSmallText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    removeBtnInline: {
        backgroundColor: '#ef4444',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    tagPill: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginRight: 8,
    },
    priorityOption: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    datePickerText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    /* Card styles (match subtask list) */
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
    cardTopBadges: { flexDirection: 'row', gap: 8, paddingTop: 6, paddingLeft: 2 },
    statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    statusTextSmall: { color: '#fff', fontSize: 12, fontWeight: '700' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cardMain: { paddingHorizontal: 4, paddingTop: 8 },
    cardTitleLarge: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    cardDesc: { marginTop: 6, color: '#6b7280', fontSize: 13 },
    projectTag: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
    assigneeText: { color: '#6b7280', fontSize: 13, marginTop: 6 },
    cardFooterRowRight: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 },
    dateText: { color: '#6b7280', fontSize: 12 },
    /* add/remove buttons removed: groups tab now displays only attached groups */
});
