import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../../src/axios/config';
import GroupFormModal from './components/GroupFormModal';

interface Group {
    id: number;
    name: string;
    description: string;
    status: string;
    members: any[];
    createdAt: string;
}

export default function GroupsManagement() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [groupFilter, setGroupFilter] = useState<'all' | 'active' | 'closed'>('all');

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const response = await api.get('/groups');

            if (response.data) {
                setGroups(response.data.groups || response.data);
            }
        } catch (error) {
            console.error('Error loading groups:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách nhóm');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadGroups();
        setRefreshing(false);
    };

    const handleDeleteGroup = (group: Group) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa nhóm "${group.name}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/groups/${group.id}`);
                            Alert.alert('Thành công', 'Đã xóa nhóm');
                            loadGroups();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa nhóm');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#10b981';
            case 'closed':
                return '#6b7280';
            default:
                return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Hoạt động';
            case 'closed':
                return 'Đã đóng';
            default:
                // Treat any unknown status as closed — UI expects only active / closed
                return 'Đã đóng';
        }
    };

    const GroupCard = ({ group }: { group: Group }) => {
        const statusColor = getStatusColor(group.status);
        
        return (
            <TouchableOpacity 
                style={styles.groupCard}
                onPress={() => router.push(`/(admin)/group-detail?id=${group.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.groupHeader}>
                    <View style={styles.groupIcon}>
                        <Ionicons name="layers" size={24} color="#f59e0b" />
                    </View>
                    <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupDescription} numberOfLines={2}>
                            {group.description || 'Không có mô tả'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {getStatusText(group.status)}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.groupFooter}>
                    <View style={styles.memberCount}>
                        <Ionicons name="people" size={16} color="#6b7280" />
                        <Text style={styles.memberCountText}>
                            {group.members?.length || 0} thành viên
                        </Text>
                    </View>
                    <View style={styles.groupActions}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                setEditingGroup(group);
                                setShowFormModal(true);
                            }}
                        >
                            <Ionicons name="create-outline" size={18} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.deleteBtn]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group);
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Apply filter to groups list
    const filteredGroups = groups.filter(g => {
        if (groupFilter === 'all') return true;
        if (groupFilter === 'active') return g.status === 'active';
        if (groupFilter === 'closed') return g.status === 'closed';
        return true;
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý nhóm</Text>
                <Text style={styles.subtitle}>Tổng số: {groups.length} nhóm · Hiển thị: {filteredGroups.length}</Text>
            </View>

            {/* Filter pills: All / Active / Closed */}
            <View style={styles.filterRow}>
                <TouchableOpacity onPress={() => setGroupFilter('all')} style={[styles.filterPill, groupFilter === 'all' && styles.filterPillActive]}>
                    <Text style={[styles.filterPillText, groupFilter === 'all' && styles.filterPillTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGroupFilter('active')} style={[styles.filterPill, groupFilter === 'active' && styles.filterPillActive]}>
                    <Text style={[styles.filterPillText, groupFilter === 'active' && styles.filterPillTextActive]}>Hoạt động</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGroupFilter('closed')} style={[styles.filterPill, groupFilter === 'closed' && styles.filterPillActive]}>
                    <Text style={[styles.filterPillText, groupFilter === 'closed' && styles.filterPillTextActive]}>Đã đóng</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
                    <Text style={styles.statValue}>
                        {groups.filter(g => g.status === 'active').length}
                    </Text>
                    <Text style={styles.statLabel}>Hoạt động</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#e5e7eb' }]}>
                    <Text style={styles.statValue}>
                        {groups.filter(g => g.status === 'closed').length}
                    </Text>
                    <Text style={styles.statLabel}>Đã đóng</Text>
                </View>
            </View>

            {/* Groups List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#f59e0b" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : groups.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="layers-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>Chưa có nhóm</Text>
                    </View>
                ) : (
                    filteredGroups.map((group) => <GroupCard key={group.id} group={group} />)
                )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => {
                    setEditingGroup(null);
                    setShowFormModal(true);
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Form Modal */}
            <GroupFormModal
                visible={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingGroup(null);
                }}
                onSuccess={() => {
                    setShowFormModal(false);
                    setEditingGroup(null);
                    loadGroups();
                }}
                group={editingGroup}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    groupCard: {
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
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    groupInfo: {
        flex: 1,
        marginRight: 8,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    groupDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    groupFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    memberCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    memberCountText: {
        fontSize: 14,
        color: '#6b7280',
    },
    groupActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        backgroundColor: '#fee2e2',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
    },
    filterPillActive: {
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
    },
    filterPillText: {
        fontSize: 14,
        color: '#374151',
    },
    filterPillTextActive: {
        color: '#fff',
    },
});
