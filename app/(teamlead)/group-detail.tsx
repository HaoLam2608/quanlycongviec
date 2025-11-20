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
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getMyGroup } from '@/src/axios/api';

interface GroupMember {
    id: number;
    hoten: string;
    manv?: string;
    email?: string;
    sdt?: string;
    chucvu?: string;
}

interface GroupProject {
    id: number;
    tenDuAn: string;
    moTa?: string;
    trangThai?: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
}

interface GroupInfo {
    id: number;
    name: string;
    description?: string;
    status: string;
    members?: GroupMember[];
    leader?: GroupMember;
    createdAt?: string;
    updatedAt?: string;
    groupProjects?: GroupProject[];
}

export default function GroupDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const groupId = params.id as string;

    const [group, setGroup] = useState<GroupInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadGroupDetail = async () => {
        setLoading(true);
        try {
            const data = await getMyGroup();
            console.log('📊 Group detail data:', data);
            
            let foundGroup: GroupInfo | null = null;
            
            // Tìm group theo ID
            if (data.activeGroups || data.closedGroups) {
                const allGroups = [...(data.activeGroups || []), ...(data.closedGroups || [])];
                foundGroup = allGroups.find((g: any) => g.id.toString() === groupId);
            } else if (data.groups && Array.isArray(data.groups)) {
                foundGroup = data.groups.find((g: any) => g.id.toString() === groupId);
            } else if (data.group && data.group.id.toString() === groupId) {
                foundGroup = data.group;
            } else if (data.id && data.id.toString() === groupId) {
                foundGroup = data;
            }
            
            if (foundGroup) {
                setGroup(foundGroup);
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin nhóm');
                router.back();
            }
        } catch (error) {
            console.error('Load group detail error:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin nhóm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            loadGroupDetail();
        }
    }, [groupId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadGroupDetail();
        setRefreshing(false);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN');
        } catch {
            return dateString;
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Đang tải thông tin nhóm...</Text>
            </SafeAreaView>
        );
    }

    if (!group) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#c4b5fd" />
                <Text style={styles.emptyTitle}>Không tìm thấy nhóm</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity 
                            style={styles.backBtn} 
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#7c3aed" />
                        </TouchableOpacity>
                        <View style={[
                            styles.statusBadge,
                            group.status === 'active' ? styles.statusActive : styles.statusClosed
                        ]}>
                            <Text style={[
                                styles.statusText,
                                group.status === 'active' ? styles.statusTextActive : styles.statusTextClosed
                            ]}>
                                {group.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.groupIconLarge}>
                        <Ionicons 
                            name="people" 
                            size={40} 
                            color={group.status === 'active' ? '#7c3aed' : '#9ca3af'} 
                        />
                    </View>
                    
                    <Text style={styles.groupNameLarge}>{group.name}</Text>
                    
                    {group.description && (
                        <Text style={styles.groupDescLarge}>{group.description}</Text>
                    )}
                    
                    <View style={styles.dateInfo}>
                        {group.createdAt && (
                            <View key="created" style={styles.dateItem}>
                                <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                <Text style={styles.dateText}>
                                    Tạo: {formatDate(group.createdAt)}
                                </Text>
                            </View>
                        )}
                        {group.updatedAt && (
                            <View key="updated" style={styles.dateItem}>
                                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                                <Text style={styles.dateText}>
                                    Cập nhật: {formatDate(group.updatedAt)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Ionicons name="people" size={28} color="#7c3aed" />
                        <Text style={styles.statNumber}>{group.members?.length || 0}</Text>
                        <Text style={styles.statLabel}>Thành viên</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Ionicons name="folder" size={28} color="#3b82f6" />
                        <Text style={styles.statNumber}>{group.groupProjects?.length || 0}</Text>
                        <Text style={styles.statLabel}>Dự án</Text>
                    </View>
                </View>

                {/* Leader Card */}
                {group.leader && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            <Ionicons name="star" size={18} color="#f59e0b" /> Trưởng nhóm
                        </Text>
                        <View style={styles.leaderCard}>
                            <View style={styles.leaderAvatar}>
                                <Text style={styles.leaderAvatarText}>
                                    {group.leader.hoten?.charAt(0) || 'T'}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.leaderName}>{group.leader.hoten}</Text>
                                {group.leader.manv && (
                                    <Text style={styles.leaderMeta}>Mã NV: {group.leader.manv}</Text>
                                )}
                                {group.leader.chucvu && (
                                    <Text style={styles.leaderMeta}>Chức vụ: {group.leader.chucvu}</Text>
                                )}
                                {group.leader.email && (
                                    <Text style={styles.leaderMeta}>
                                        <Ionicons name="mail-outline" size={12} /> {group.leader.email}
                                    </Text>
                                )}
                                {group.leader.sdt && (
                                    <Text style={styles.leaderMeta}>
                                        <Ionicons name="call-outline" size={12} /> {group.leader.sdt}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Members Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        <Ionicons name="people" size={18} color="#7c3aed" /> Thành viên ({group.members?.length || 0})
                    </Text>
                    {group.members && group.members.length > 0 ? (
                        group.members.map((member) => (
                            <View key={member.id} style={styles.memberCard}>
                                <View style={styles.memberAvatar}>
                                    <Text style={styles.memberAvatarText}>
                                        {member.hoten?.charAt(0) || 'M'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.memberName}>{member.hoten}</Text>
                                    <View style={styles.memberMetaRow}>
                                        {member.manv && (
                                            <Text style={styles.memberMeta}>#{member.manv}</Text>
                                        )}
                                        {member.chucvu && (
                                            <Text style={styles.memberMeta}>• {member.chucvu}</Text>
                                        )}
                                    </View>
                                    {member.email && (
                                        <Text style={styles.memberMeta}>
                                            <Ionicons name="mail-outline" size={11} /> {member.email}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={40} color="#c4b5fd" />
                            <Text style={styles.emptyText}>Chưa có thành viên</Text>
                        </View>
                    )}
                </View>

                {/* Projects Card */}
                {group.groupProjects && group.groupProjects.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            <Ionicons name="folder" size={18} color="#3b82f6" /> Dự án ({group.groupProjects.length})
                        </Text>
                        {group.groupProjects.map((groupProject: any, index: number) => {
                            const project = groupProject.project || groupProject;
                            return (
                                <View key={`project-${groupProject.projectId || project.id || index}`} style={styles.projectCard}>
                                    <View style={styles.projectIcon}>
                                        <Ionicons name="folder-open" size={20} color="#3b82f6" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.projectName}>
                                            {project.tenDuAn || project.name || 'Dự án'}
                                        </Text>
                                        {project.moTa && (
                                            <Text style={styles.projectDesc} numberOfLines={2}>
                                                {project.moTa}
                                            </Text>
                                        )}
                                        <View style={styles.projectMeta}>
                                            {(project.trangThai || groupProject.status) && (
                                                <View style={[
                                                    styles.projectStatus,
                                                    (project.trangThai === 'Hoàn thành' || groupProject.status === 'completed') && styles.projectStatusDone
                                                ]}>
                                                    <Text style={styles.projectStatusText}>
                                                        {project.trangThai || groupProject.status || 'active'}
                                                    </Text>
                                                </View>
                                            )}
                                            {(project.ngayBatDau || project.createdAt) && (
                                                <Text style={styles.projectDate}>
                                                    {formatDate(project.ngayBatDau || project.createdAt)}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
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
        backgroundColor: '#f5f5ff',
        padding: 20
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280',
        fontSize: 14
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 32
    },
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ede9fe',
        alignItems: 'center'
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    groupIconLarge: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    groupNameLarge: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8
    },
    groupDescLarge: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 12
    },
    dateInfo: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    dateText: {
        fontSize: 12,
        color: '#9ca3af'
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    statusActive: {
        backgroundColor: '#dcfce7'
    },
    statusClosed: {
        backgroundColor: '#fee2e2'
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600'
    },
    statusTextActive: {
        color: '#16a34a'
    },
    statusTextClosed: {
        color: '#dc2626'
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16
    },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16
    },
    leaderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        gap: 12
    },
    leaderAvatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#fbbf24',
        justifyContent: 'center',
        alignItems: 'center'
    },
    leaderAvatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff'
    },
    leaderName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4
    },
    leaderMeta: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginBottom: 10,
        gap: 12
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#ddd6fe',
        justifyContent: 'center',
        alignItems: 'center'
    },
    memberAvatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#7c3aed'
    },
    memberName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2
    },
    memberMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap'
    },
    memberMeta: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2
    },
    projectCard: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        marginBottom: 10,
        gap: 12
    },
    projectIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center'
    },
    projectName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4
    },
    projectDesc: {
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 16,
        marginBottom: 6
    },
    projectMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
    },
    projectStatus: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: '#fef3c7',
        borderRadius: 8
    },
    projectStatusDone: {
        backgroundColor: '#dcfce7'
    },
    projectStatusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#92400e'
    },
    projectDate: {
        fontSize: 11,
        color: '#9ca3af'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32
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
    },
    backButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#7c3aed',
        borderRadius: 12
    },
    backButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    }
});
