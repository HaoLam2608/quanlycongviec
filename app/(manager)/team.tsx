import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, StyleSheet, Text, View, FlatList, ActivityIndicator,
    RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUsers } from '@/src/axios/api';
import { PageHeader } from '../../components/ui/PageHeader';

interface User {
    id: number;
    manv: string;
    hoten: string;
    chucvu: string;
    email?: string;
    sdt?: string;
    role?: string | { id: number; name: string; description?: string };
}

// Helper function to get role name from role object or string
const getRoleName = (role?: string | { name: string }): string => {
    if (!role) return 'employee';
    if (typeof role === 'string') return role;
    return role.name || 'employee';
};

export default function TeamManagement() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            const usersData = await fetchUsers();
            // Filter out admins, show only managers and employees
            const teamMembers = usersData.filter((u: User) => {
                const roleName = getRoleName(u.role);
                return roleName !== 'admin';
            });
            setUsers(teamMembers);
        } catch (error) {
            console.error('Error loading team:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadTeam();
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'manager': return '#f59e0b';
            case 'employee': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getRoleText = (role: string) => {
        switch (role) {
            case 'manager': return 'Quản lý';
            case 'employee': return 'Nhân viên';
            default: return role;
        }
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        const roleName = getRoleName(user.role);
        return roleName === filter;
    });

    const renderUser = ({ item }: { item: User }) => {
        const roleName = getRoleName(item.role);
        
        return (
            <TouchableOpacity style={styles.userCard}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: getRoleColor(roleName) }]}>
                        <Text style={styles.avatarText}>
                            {item.hoten.split(' ').pop()?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                        <Text style={styles.userName}>{item.hoten}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(roleName) }]}>
                            <Text style={styles.roleText}>{getRoleText(roleName)}</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.userDetail}>👤 {item.manv}</Text>
                    {item.chucvu && (
                        <Text style={styles.userDetail}>💼 {item.chucvu}</Text>
                    )}
                    {item.email && (
                        <Text style={styles.userDetail}>✉️ {item.email}</Text>
                    )}
                    {item.sdt && (
                        <Text style={styles.userDetail}>📱 {item.sdt}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Quản lý nhóm" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Quản lý nhóm" />
            
            {/* Filter tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Tất cả ({users.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'manager' && styles.filterTabActive]}
                    onPress={() => setFilter('manager')}
                >
                    <Text style={[styles.filterText, filter === 'manager' && styles.filterTextActive]}>
                        Quản lý ({users.filter(u => getRoleName(u.role) === 'manager').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'employee' && styles.filterTabActive]}
                    onPress={() => setFilter('employee')}
                >
                    <Text style={[styles.filterText, filter === 'employee' && styles.filterTextActive]}>
                        Nhân viên ({users.filter(u => getRoleName(u.role) === 'employee').length})
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{users.filter(u => getRoleName(u.role) === 'manager').length}</Text>
                    <Text style={styles.statLabel}>Quản lý</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{users.filter(u => getRoleName(u.role) === 'employee').length}</Text>
                    <Text style={styles.statLabel}>Nhân viên</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{users.length}</Text>
                    <Text style={styles.statLabel}>Tổng cộng</Text>
                </View>
            </View>

            <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyTitle}>Không có thành viên</Text>
                        <Text style={styles.emptyText}>Chưa có thành viên nào trong hệ thống</Text>
                    </View>
                }
            />
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
});
