import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getMyGroup } from '@/src/axios/api';

interface GroupMember {
    id: number;
    hoten: string;
    manv?: string;
    email?: string;
    sdt?: string;
    chucvu?: string;
}

interface GroupInfo {
    id: number;
    name: string;
    description?: string;
    status: string;
    members?: GroupMember[];
    leader?: GroupMember;
    createdAt?: string;
    groupProjects?: any[];
}

export default function TeamLeadGroupScreen() {
    const router = useRouter();
    const [activeGroups, setActiveGroups] = useState<GroupInfo[]>([]);
    const [closedGroups, setClosedGroups] = useState<GroupInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'active' | 'closed'>('active');

    const loadGroups = async () => {
        setLoading(true);
        try {
            const data = await getMyGroup();
            console.log('📊 Groups data:', data);
            
            // Xử lý nhiều format response
            let active: GroupInfo[] = [];
            let closed: GroupInfo[] = [];
            
            // Nếu có activeGroups và closedGroups trong response
            if (data.activeGroups || data.closedGroups) {
                active = data.activeGroups || [];
                closed = data.closedGroups || [];
            }
            // Nếu có groups array
            else if (data.groups && Array.isArray(data.groups)) {
                active = data.groups.filter((g: any) => g.status === 'active');
                closed = data.groups.filter((g: any) => g.status === 'closed');
            }
            // Nếu chỉ có 1 group object
            else if (data.group) {
                if (data.group.status === 'active') {
                    active = [data.group];
                } else {
                    closed = [data.group];
                }
            }
            // Fallback - data là group trực tiếp
            else if (data.id) {
                if (data.status === 'active') {
                    active = [data];
                } else {
                    closed = [data];
                }
            }
            
            setActiveGroups(active);
            setClosedGroups(closed);
            
            console.log('✅ Active groups:', active.length);
            console.log('✅ Closed groups:', closed.length);
        } catch (error) {
            console.error('Load team lead groups error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadGroups();
        setRefreshing(false);
    };

    const renderGroupCard = (group: GroupInfo) => (
        <TouchableOpacity
            key={group.id}
            style={[
                styles.groupCard,
                group.status === 'closed' && styles.groupCardClosed
            ]}
            onPress={() => {
                router.push(`/(teamlead)/group-detail?id=${group.id}`);
            }}
        >
            <View style={styles.groupHeader}>
                <View style={styles.groupIconContainer}>
                    <Ionicons 
                        name="people" 
                        size={24} 
                        color={group.status === 'active' ? '#7c3aed' : '#9ca3af'} 
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[
                            styles.groupName,
                            group.status === 'closed' && styles.groupNameClosed
                        ]}>
                            {group.name}
                        </Text>
                        <View style={[
                            styles.statusBadge,
                            group.status === 'active' ? styles.statusActive : styles.statusClosed
                        ]}>
                            <Text style={[
                                styles.statusText,
                                group.status === 'active' ? styles.statusTextActive : styles.statusTextClosed
                            ]}>
                                {group.status === 'active' ? 'Hoạt động' : 'Đã đóng'}
                            </Text>
                        </View>
                    </View>
                    {group.description && (
                        <Text 
                            style={[
                                styles.groupDesc,
                                group.status === 'closed' && styles.groupDescClosed
                            ]} 
                            numberOfLines={2}
                        >
                            {group.description}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.groupStats}>
                <View style={styles.statItem}>
                    <Ionicons name="person-outline" size={16} color="#6b7280" />
                    <Text style={styles.statText}>
                        {group.members?.length || 0} thành viên
                    </Text>
                </View>
                {group.groupProjects && (
                    <View style={styles.statItem}>
                        <Ionicons name="folder-outline" size={16} color="#6b7280" />
                        <Text style={styles.statText}>
                            {group.groupProjects.length} dự án
                        </Text>
                    </View>
                )}
            </View>

            {group.leader && (
                <View style={styles.leaderInfo}>
                    <View style={styles.leaderAvatar}>
                        <Text style={styles.leaderAvatarText}>
                            {group.leader.hoten?.charAt(0) || 'T'}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.leaderLabel}>Trưởng nhóm</Text>
                        <Text style={styles.leaderName}>{group.leader.hoten}</Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Đang tải danh sách nhóm...</Text>
            </SafeAreaView>
        );
    }

    const displayGroups = selectedTab === 'active' ? activeGroups : closedGroups;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Stats */}
            <View style={styles.headerStats}>
                <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                    <Text style={styles.statValue}>{activeGroups.length}</Text>
                    <Text style={styles.statLabel}>Đang hoạt động</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                    <Text style={styles.statValue}>{closedGroups.length}</Text>
                    <Text style={styles.statLabel}>Đã đóng</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="people" size={24} color="#3b82f6" />
                    <Text style={styles.statValue}>
                        {activeGroups.reduce((sum, g) => sum + (g.members?.length || 0), 0)}
                    </Text>
                    <Text style={styles.statLabel}>Tổng thành viên</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
                    onPress={() => setSelectedTab('active')}
                >
                    <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
                        Đang hoạt động ({activeGroups.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'closed' && styles.tabActive]}
                    onPress={() => setSelectedTab('closed')}
                >
                    <Text style={[styles.tabText, selectedTab === 'closed' && styles.tabTextActive]}>
                        Đã đóng ({closedGroups.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Groups List */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {displayGroups.length > 0 ? (
                    displayGroups.map(renderGroupCard)
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons 
                            name={selectedTab === 'active' ? 'people-outline' : 'archive-outline'} 
                            size={64} 
                            color="#c4b5fd" 
                        />
                        <Text style={styles.emptyTitle}>
                            {selectedTab === 'active' ? 'Chưa có nhóm hoạt động' : 'Chưa có nhóm đã đóng'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {selectedTab === 'active' 
                                ? 'Bạn chưa được gán làm trưởng nhóm nào đang hoạt động'
                                : 'Chưa có nhóm nào bị đóng'
                            }
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5ff'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
        fontSize: 14
    },
    headerStats: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ede9fe'
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 4
    },
    statLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2,
        textAlign: 'center'
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 8
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    tabActive: {
        borderBottomColor: '#7c3aed'
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af'
    },
    tabTextActive: {
        color: '#7c3aed'
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 32
    },
    groupCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ede9fe',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    groupCardClosed: {
        backgroundColor: '#fafafa',
        borderColor: '#e5e7eb',
        opacity: 0.8
    },
    groupHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12
    },
    groupIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    groupName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        flex: 1
    },
    groupNameClosed: {
        color: '#6b7280'
    },
    groupDesc: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
        lineHeight: 18
    },
    groupDescClosed: {
        color: '#9ca3af'
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusActive: {
        backgroundColor: '#dcfce7'
    },
    statusClosed: {
        backgroundColor: '#fee2e2'
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600'
    },
    statusTextActive: {
        color: '#16a34a'
    },
    statusTextClosed: {
        color: '#dc2626'
    },
    groupStats: {
        flexDirection: 'row',
        gap: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    statText: {
        fontSize: 13,
        color: '#6b7280'
    },
    leaderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 10
    },
    leaderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#ddd6fe',
        justifyContent: 'center',
        alignItems: 'center'
    },
    leaderAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#7c3aed'
    },
    leaderLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 2
    },
    leaderName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center'
    }
});
