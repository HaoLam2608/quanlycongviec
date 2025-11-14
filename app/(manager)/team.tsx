import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TouchableOpacity,
    Modal,
    TextInput,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjectsByManager } from '@/src/axios/api';
import { getGroups, createGroup } from '@/src/axios/adminApi';
import { PageHeader } from '../../components/ui/PageHeader';



interface Group {
    id: number;
    name: string;
    projectName: string;
    memberCount: number;
    closed?: boolean;
}

export default function TeamManagement() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) throw new Error('Không tìm thấy userId');

            // 1) Lấy danh sách dự án mà manager quản lý
            const projects = await fetchProjectsByManager(Number(userId));
            const projectIds: number[] = Array.isArray(projects) ? projects.map((p: any) => p.id) : [];
            setProjects(Array.isArray(projects) ? projects : (projects.data || []));

            // 2) Với mỗi project, lấy groups thuộc project (api admin getGroups supports duanId param)
            const groupsPerProject = await Promise.all(projectIds.map(async (pid) => {
                try {
                    const res = await getGroups({ duanId: pid });
                    return Array.isArray(res) ? res : (res.groups || res.data || []);
                } catch (e) {
                    console.warn('Không lấy được nhóm cho project', pid, e);
                    return [];
                }
            }));

            // 3) Flatten and dedupe groups by id
            const flat = groupsPerProject.flat();
            const map = new Map<number, any>();
            flat.forEach((g: any) => {
                if (!g || !g.id) return;
                if (!map.has(g.id)) {
                    // detect closed status from several possible fields
                    const closed = Boolean(
                        g.isClosed || g.is_closed || g.closed || g.dong ||
                        g.trangthai === 'Đã đóng' ||
                        (typeof g.status === 'string' && ['closed', 'đóng', 'Đã đóng', 'dong'].includes(g.status))
                    );

                    map.set(g.id, {
                        id: g.id,
                        name: g.name,
                        projectName: g.duanName || g.projectName || (g.DuAn && g.DuAn.tenduan) || '',
                        memberCount: (g.memberCount != null) ? g.memberCount : (Array.isArray(g.members) ? g.members.length : 0),
                        closed,
                    });
                }
            });

            setGroups(Array.from(map.values()));
        } catch (error) {
            console.error('Error loading groups:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách nhóm');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadGroups();
    };

    const handleCreateGroup = async () => {
        try {
            if (!newGroupName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
            const payload: any = { name: newGroupName.trim() };
            if (newGroupDesc.trim()) payload.description = newGroupDesc.trim();
            if (selectedProjectId) payload.duanId = selectedProjectId;
            await createGroup(payload);
            Alert.alert('Thành công', 'Tạo nhóm thành công');
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            setSelectedProjectId(undefined);
            setRefreshing(true);
            await loadGroups();
        } catch (err: any) {
            console.error('Create group error', err);
            Alert.alert('Lỗi', err?.message || 'Không thể tạo nhóm');
        }
    };

    const renderGroup = ({ item }: { item: Group }) => (
        <TouchableOpacity style={styles.userCard} activeOpacity={0.85} onPress={() => router.push(`/(manager)/group-detail?id=${item.id}`)}>
            <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: '#2563eb' }]}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                    <View style={styles.nameRow}>
                        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                        {item.closed ? (
                            <View style={styles.closedBadge}>
                                <Text style={styles.closedText}>Đã đóng</Text>
                            </View>
                        ) : null}
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: '#3b82f6' }]}>
                        <Text style={styles.roleText}>{item.memberCount} thành viên</Text>
                    </View>
                </View>

                <Text style={styles.userDetail}>📁 Dự án: {item.projectName}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Quản lý nhóm" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Quản lý nhóm" />

            <FlatList
                data={groups}
                renderItem={renderGroup}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyTitle}>Không có nhóm</Text>
                        <Text style={styles.emptyText}>Bạn chưa có nhóm thuộc dự án bạn quản lý</Text>
                    </View>
                }
            />

            {/* Floating create group button */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create Group Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View style={teamModalStyles.modalOverlay}>
                    <View style={teamModalStyles.modalContent}>
                        <Text style={teamModalStyles.modalTitle}>Tạo nhóm mới</Text>
                        <TextInput placeholder="Tên nhóm" value={newGroupName} onChangeText={setNewGroupName} style={teamModalStyles.input} />
                        <TextInput placeholder="Mô tả (tùy chọn)" value={newGroupDesc} onChangeText={setNewGroupDesc} style={[teamModalStyles.input, { height: 80 }]} multiline />

                        <Text style={{ marginBottom: 8, color: '#6b7280' }}>Gắn vào dự án (tùy chọn)</Text>
                        <View style={{ maxHeight: 140, marginBottom: 12 }}>
                            {projects && projects.length > 0 ? (
                                projects.map((p:any)=> (
                                    <TouchableOpacity key={p.id} onPress={() => setSelectedProjectId(p.id)} style={{ paddingVertical: 8 }}>
                                        <Text style={{ color: selectedProjectId === p.id ? '#0f172a' : '#6b7280', fontWeight: selectedProjectId === p.id ? '700' : '400' }}>{p.tenduan || p.name || p.title}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ color: '#6b7280' }}>Không có dự án</Text>
                            )}
                        </View>

                        <View style={teamModalStyles.modalActions}>
                            <TouchableOpacity style={[teamModalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => setShowCreateModal(false)}>
                                <Text style={teamModalStyles.modalBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[teamModalStyles.modalBtn, { backgroundColor: '#3b82f6' }]} onPress={handleCreateGroup}>
                                <Text style={[teamModalStyles.modalBtnText, { color: '#fff' }]}>Tạo</Text>
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
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: '#f59e0b',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f59e0b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    listContent: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    userInfo: {
        flex: 1,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        flex: 1,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    closedBadge: {
        marginLeft: 8,
        backgroundColor: '#6b7280',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    closedText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    userDetail: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    /* FAB */
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
});

const teamModalStyles = StyleSheet.create({
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
});
