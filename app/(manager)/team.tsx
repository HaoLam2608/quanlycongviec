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
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjectsByManager } from '@/src/axios/api';
import { getGroups, createGroup, getUsers, closeGroup, deleteGroup } from '@/src/axios/adminApi';
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
    const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
    const [selectedLeaderId, setSelectedLeaderId] = useState<number | undefined>(undefined);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
    const [projectSearch, setProjectSearch] = useState<string>('');
    const [regularEmployees, setRegularEmployees] = useState<any[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<string>('all'); // 'all', 'active', 'closed'

    useEffect(() => {
        loadGroups();
        loadLeaders();
        loadEmployees();
    }, []);

    const loadLeaders = async () => {
        try {
            // load users with role teamleader
            const res = await getUsers({ page: 1, limit: 1000, role: 'teamleader' });
            const users = Array.isArray(res.users) ? res.users : (res.data?.users || res.users || []);
            setTeamLeaders(users || []);
        } catch (err) {
            console.warn('Không lấy được danh sách trưởng nhóm', err);
        }
    };

    const loadEmployees = async () => {
        try {
            const res = await getUsers({ page: 1, limit: 1000, role: 'employee' });
            const users = Array.isArray(res.users) ? res.users : (res.data?.users || res.users || []);
            setRegularEmployees(users || []);
        } catch (err) {
            console.warn('Không lấy được danh sách nhân viên', err);
        }
    };

    const toggleMember = (id: number) => {
        setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

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

    const filteredProjects = (projects || []).filter((p:any) => (p.tenduan || p.name || p.title || '').toLowerCase().includes(projectSearch.toLowerCase()));

    const onRefresh = () => {
        setRefreshing(true);
        loadGroups();
    };

    const handleCreateGroup = async () => {
        try {
            if (!newGroupName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
            const payload: any = { name: newGroupName.trim() };
            if (newGroupDesc.trim()) payload.description = newGroupDesc.trim();
            // follow web API: send projectIds array and optional leaderId
            if (selectedProjectIds && selectedProjectIds.length > 0) payload.projectIds = selectedProjectIds;
            if (selectedLeaderId) payload.leaderId = selectedLeaderId;
            if (selectedMemberIds && selectedMemberIds.length > 0) payload.memberIds = selectedMemberIds;
            await createGroup(payload);
            Alert.alert('Thành công', 'Tạo nhóm thành công');
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            setSelectedProjectIds([]);
            setSelectedLeaderId(undefined);
            setSelectedMemberIds([]);
            setRefreshing(true);
            await loadGroups();
        } catch (err: any) {
            console.error('Create group error', err);
            Alert.alert('Lỗi', err?.message || 'Không thể tạo nhóm');
        }
    };

    const handleCloseGroup = async (id: number) => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn đóng nhóm này? Hành động này có thể không thể hoàn tác.', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đóng nhóm',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await closeGroup(id);
                        Alert.alert('Thành công', 'Nhóm đã được đóng');
                        setRefreshing(true);
                        await loadGroups();
                    } catch (err: any) {
                        console.error('Close group error', err);
                        Alert.alert('Lỗi', err?.message || 'Không thể đóng nhóm');
                    }
                }
            }
        ]);
    };

    // Memoized header component to avoid remounting TextInputs when FlatList updates
    const Header = React.memo((props: any) => {
        const {
            newGroupName,
            setNewGroupName,
            newGroupDesc,
            setNewGroupDesc,
            teamLeaders,
            selectedLeaderId,
            setSelectedLeaderId,
            regularEmployees,
            selectedMemberIds,
            toggleMember,
            projectSearch,
            setProjectSearch,
            selectedProjectIds,
            setSelectedProjectIds,
            projects,
        } = props;

        return (
            <>
                <Text style={[teamModalStyles.modalTitle, { textAlign: 'center', fontSize: 20, marginBottom: 18 }]}>Tạo nhóm mới</Text>

                <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6 }}><Ionicons name="people-outline" size={18} color="#2563eb" />  Tên nhóm</Text>
                    <TextInput placeholder="Nhập tên nhóm" value={newGroupName} onChangeText={setNewGroupName} style={[teamModalStyles.input, { fontWeight: '600', fontSize: 15 }]} />
                </View>

                <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6 }}><Ionicons name="document-text-outline" size={18} color="#2563eb" />  Mô tả (tùy chọn)</Text>
                    <TextInput placeholder="Mô tả nhóm" value={newGroupDesc} onChangeText={setNewGroupDesc} style={[teamModalStyles.input, { height: 60, fontSize: 14 }]} multiline />
                </View>

                <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6 }}><Ionicons name="person-circle-outline" size={18} color="#2563eb" />  Chọn trưởng nhóm (tuỳ chọn)</Text>
                    <View style={{ maxHeight: 120, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, backgroundColor: '#f8fafc' }}>
                        {teamLeaders && teamLeaders.length > 0 ? (
                            teamLeaders.map((l:any) => (
                                <TouchableOpacity key={l.id} onPress={() => setSelectedLeaderId(l.id)} style={{ paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name={selectedLeaderId === l.id ? "radio-button-on" : "radio-button-off"} size={18} color={selectedLeaderId === l.id ? "#2563eb" : "#9ca3af"} style={{ marginRight: 8 }} />
                                    <Text style={{ color: selectedLeaderId === l.id ? '#0f172a' : '#6b7280', fontWeight: selectedLeaderId === l.id ? '700' : '400' }}>{l.hoten || l.fullName || l.manv}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={{ color: '#6b7280' }}>Không có trưởng nhóm</Text>
                        )}
                    </View>
                </View>

                <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 6 }}><Ionicons name="people" size={18} color="#2563eb" />  Chọn thành viên</Text>
                    <View style={{ maxHeight: 160, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, backgroundColor: '#f8fafc' }}>
                        {regularEmployees && regularEmployees.length > 0 ? (
                            regularEmployees.map((u:any) => {
                                const disabled = selectedLeaderId === u.id;
                                const checked = selectedMemberIds.includes(u.id);
                                return (
                                    <TouchableOpacity key={u.id} onPress={() => !disabled && toggleMember(u.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                                        <Ionicons name={checked ? "checkbox" : "square-outline"} size={18} color={checked ? "#2563eb" : "#9ca3af"} style={{ marginRight: 8 }} />
                                        <Text style={{ color: disabled ? '#9ca3af' : '#111827' }}>{u.hoten} {disabled ? '(Trưởng nhóm)' : ''}</Text>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <Text style={{ color: '#6b7280' }}>Không có nhân viên</Text>
                        )}
                    </View>
                </View>

                <View style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name="folder-open-outline" size={18} color="#2563eb" />
                        <Text style={{ fontWeight: '700', color: '#374151', marginLeft: 6 }}>Gắn vào dự án (tùy chọn)</Text>
                        {selectedProjectIds.length > 0 && (
                            <View style={{ backgroundColor: '#2563eb', borderRadius: 10, marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ color: '#fff', fontSize: 12 }}>{selectedProjectIds.length} đã chọn</Text>
                            </View>
                        )}
                        {selectedProjectIds.length > 0 && (
                            <TouchableOpacity onPress={() => setSelectedProjectIds([])} style={{ marginLeft: 10 }}>
                                <Ionicons name="close-circle" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TextInput
                        placeholder="Tìm dự án..."
                        value={projectSearch}
                        onChangeText={setProjectSearch}
                        style={{
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                            marginBottom: 8,
                            backgroundColor: '#fff',
                        }}
                    />

                    {selectedProjectIds.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                            {selectedProjectIds.map((id: number) => {
                                const p = projects.find((pr: any) => pr.id === id) || {};
                                const name = p.tenduan || p.name || p.title || 'Dự án';
                                return (
                                    <View key={id} style={{ backgroundColor: '#e6f0ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ color: '#1e3a8a', marginRight: 8, fontSize: 13 }}>{name}</Text>
                                        <TouchableOpacity onPress={() => setSelectedProjectIds((prev: number[]) => prev.filter((x: number) => x !== id))}>
                                            <Ionicons name="close" size={15} color="#1e3a8a" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </>
        );
    });

    const headerElement = React.useMemo(() => (
        <Header
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            newGroupDesc={newGroupDesc}
            setNewGroupDesc={setNewGroupDesc}
            teamLeaders={teamLeaders}
            selectedLeaderId={selectedLeaderId}
            setSelectedLeaderId={setSelectedLeaderId}
            regularEmployees={regularEmployees}
            selectedMemberIds={selectedMemberIds}
            toggleMember={toggleMember}
            projectSearch={projectSearch}
            setProjectSearch={setProjectSearch}
            selectedProjectIds={selectedProjectIds}
            setSelectedProjectIds={setSelectedProjectIds}
            projects={projects}
        />
    ), [newGroupName, newGroupDesc, teamLeaders, selectedLeaderId, regularEmployees, selectedMemberIds, projectSearch, selectedProjectIds, projects]);

    // Filter and search logic
    const filteredGroups = groups.filter(group => {
        // Filter by status
        const matchesStatus = filter === 'all' || 
            (filter === 'active' && !group.closed) ||
            (filter === 'closed' && group.closed);
        
        // Filter by search query
        const matchesSearch = searchQuery.trim() === '' || 
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.roleBadge, { backgroundColor: '#3b82f6' }]}>
                            <Text style={styles.roleText}>{item.memberCount} thành viên</Text>
                        </View>
                        <TouchableOpacity onPress={() => {
                            Alert.alert('Hành động', 'Chọn hành động cho nhóm này', [
                                { text: 'Hủy', style: 'cancel' },
                                { text: 'Đóng nhóm', onPress: () => handleCloseGroup(item.id) },
                                { text: 'Xóa vĩnh viễn', style: 'destructive', onPress: async () => {
                                    Alert.alert('Xác nhận xóa', 'Xóa nhóm là hành động không thể hoàn tác. Bạn có chắc muốn xóa vĩnh viễn?', [
                                        { text: 'Hủy', style: 'cancel' },
                                        { text: 'Xóa', style: 'destructive', onPress: async () => {
                                            try {
                                                // call deleteGroup wrapper
                                                const res = await deleteGroup(item.id);
                                                Alert.alert('Thành công', res?.message || 'Đã xóa nhóm');
                                                setRefreshing(true);
                                                await loadGroups();
                                            } catch (err: any) {
                                                console.error('Delete group error', err);
                                                Alert.alert('Lỗi', err?.message || 'Không thể xóa nhóm');
                                            }
                                        } }
                                    ]);
                                } },
                            ]);
                        }} style={{ marginLeft: 10, padding: 6 }}>
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
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

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm nhóm, dự án..."
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
                        Tất cả ({groups.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
                    onPress={() => setFilter('active')}
                >
                    <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
                        Hoạt động
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'closed' && styles.filterTabActive]}
                    onPress={() => setFilter('closed')}
                >
                    <Text style={[styles.filterText, filter === 'closed' && styles.filterTextActive]}>
                        Đã đóng
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredGroups}
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
                        <Text style={styles.emptyText}>
                            {searchQuery.trim() !== '' 
                                ? `Không tìm thấy kết quả cho "${searchQuery}"`
                                : filter === 'active'
                                ? 'Không có nhóm đang hoạt động'
                                : filter === 'closed'
                                ? 'Không có nhóm đã đóng'
                                : 'Bạn chưa có nhóm thuộc dự án bạn quản lý'
                            }
                        </Text>
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
                        <FlatList
                            data={filteredProjects}
                            keyExtractor={item => item.id.toString()}
                            nestedScrollEnabled
                            contentContainerStyle={{ paddingBottom: 12 }}
                            ListHeaderComponent={headerElement}
                            renderItem={({ item: p }) => {
                                const checked = selectedProjectIds.includes(p.id);
                                return (
                                    <TouchableOpacity onPress={() => {
                                        if (checked) {
                                            setSelectedProjectIds(prev => prev.filter(id => id !== p.id));
                                        } else {
                                            setSelectedProjectIds(prev => {
                                                if (prev.length >= 2) {
                                                    Alert.alert('Giới hạn', 'Chỉ được chọn tối đa 2 dự án');
                                                    return prev;
                                                }
                                                return [...prev, p.id];
                                            });
                                        }
                                    }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                                        <Ionicons name={checked ? "checkbox" : "square-outline"} size={18} color={checked ? "#2563eb" : "#9ca3af"} style={{ marginRight: 8 }} />
                                        <Text style={{ color: checked ? '#0f172a' : '#6b7280', fontWeight: checked ? '700' : '400', fontSize: 14 }}>{p.tenduan || p.name || p.title}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={<Text style={{ color: '#6b7280' }}>Không có dự án</Text>}
                        />

                        <View style={teamModalStyles.modalActions}>
                            <TouchableOpacity style={[teamModalStyles.modalBtn, { backgroundColor: '#9ca3af' }]} onPress={() => {
                                setShowCreateModal(false);
                                setSelectedLeaderId(undefined);
                                setSelectedMemberIds([]);
                                setSelectedProjectIds([]);
                            }}>
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
        backgroundColor: '#3b82f6',
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
        maxHeight: '85%',
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
