import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/axios/config';

interface DashboardStats {
    totalUsers: number;
    totalAdmins: number;
    totalManagers: number;
    totalEmployees: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    pendingApprovals: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalAdmins: 0,
        totalManagers: 0,
        totalEmployees: 0,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingApprovals: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        loadUserInfo();
        loadStats();
    }, []);

    const loadUserInfo = async () => {
        const hoten = await AsyncStorage.getItem('hoten');
        setUserName(hoten || 'Admin');
    };

    const loadStats = async () => {
        try {
            console.log('🔄 Loading dashboard stats...');
            
            // Load user stats
            const userResponse = await api.get('/users/stats');
            console.log('📊 User stats response:', JSON.stringify(userResponse.data, null, 2));
            
            if (userResponse.data && userResponse.data.stats) {
                const backendStats = userResponse.data.stats;
                
                // Parse usersByRole để lấy số lượng theo role
                const roleMap = new Map<string, number>();
                if (backendStats.usersByRole) {
                    backendStats.usersByRole.forEach((item: any) => {
                        roleMap.set(item.role.toLowerCase(), parseInt(item.count) || 0);
                    });
                }
                console.log('👥 Role map:', Object.fromEntries(roleMap));

                // Load projects count
                let totalProjects = 0;
                let activeProjects = 0;
                let completedProjects = 0;
                try {
                    const projectsResponse = await api.get('/duan/getAll');
                    const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data : [];
                    totalProjects = projects.length;
                    activeProjects = projects.filter((p: any) => p.status === 'dang_chay' || p.status === 'in_progress').length;
                    completedProjects = projects.filter((p: any) => p.status === 'hoan_thanh' || p.status === 'completed').length;
                    console.log(`📁 Projects: ${totalProjects} total, ${activeProjects} active, ${completedProjects} completed`);
                } catch (err) {
                    console.log('❌ Error loading projects:', err);
                }

                // Load pending approvals
                let pendingApprovals = 0;
                try {
                    const approvalsResponse = await api.get('/approvals/pending');
                    if (approvalsResponse.data && approvalsResponse.data.data) {
                        pendingApprovals = approvalsResponse.data.data.total || 0;
                    }
                    console.log(`✅ Pending approvals: ${pendingApprovals}`);
                } catch (err) {
                    console.log('❌ Error loading approvals:', err);
                }

                const finalStats = {
                    totalUsers: backendStats.totalUsers || 0,
                    totalAdmins: roleMap.get('admin') || 0,
                    totalManagers: roleMap.get('manager') || 0,
                    totalEmployees: roleMap.get('employee') || 0,
                    totalProjects,
                    activeProjects,
                    completedProjects,
                    pendingApprovals,
                };
                
                console.log('📈 Final stats:', finalStats);
                setStats(finalStats);
            }
        } catch (error) {
            console.error('❌ Error loading stats:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'userId', 'hoten', 'manv', 'role']);
        router.replace('/login');
    };

    const menuItems = [
        { 
            title: 'Người dùng', 
            icon: 'people', 
            route: '/(admin)/users',
            color: '#3b82f6',
            count: stats.totalUsers
        },
        { 
            title: 'Vai trò', 
            icon: 'shield-checkmark', 
            route: '/(admin)/roles',
            color: '#8b5cf6',
            count: null
        },
        { 
            title: 'Dự án', 
            icon: 'folder', 
            route: '/(admin)/projects',
            color: '#10b981',
            count: stats.totalProjects
        },
        { 
            title: 'Nhóm', 
            icon: 'layers', 
            route: '/(admin)/groups',
            color: '#f59e0b',
            count: null
        },
        { 
            title: 'Phê duyệt', 
            icon: 'checkmark-done', 
            route: '/(admin)/approvals',
            color: '#ec4899',
            count: stats.pendingApprovals
        },
        { 
            title: 'Báo cáo', 
            icon: 'bar-chart', 
            route: '/(admin)/reports',
            color: '#06b6d4',
            count: null
        },
        { 
            title: 'Thông báo', 
            icon: 'notifications', 
            route: '/(admin)/notifications',
            color: '#f97316',
            count: null
        },
        { 
            title: 'Cài đặt', 
            icon: 'settings', 
            route: '/(admin)/settings',
            color: '#6b7280',
            count: null
        },
    ];

    const StatCard = ({ title, value, icon, color }: any) => (
        <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <View style={styles.statContent}>
                <View>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statTitle}>{title}</Text>
                </View>
                <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as any} size={24} color={color} />
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Xin chào, {userName}!</Text>
                    <Text style={styles.headerTitle}>Bảng điều khiển Admin</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Statistics */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>📊 Thống kê tổng quan</Text>
                    <View style={styles.statsGrid}>
                        <StatCard 
                            title="Tổng người dùng" 
                            value={stats.totalUsers} 
                            icon="people" 
                            color="#3b82f6"
                        />
                        <StatCard 
                            title="Quản trị viên" 
                            value={stats.totalAdmins} 
                            icon="shield-checkmark" 
                            color="#8b5cf6"
                        />
                        <StatCard 
                            title="Quản lý" 
                            value={stats.totalManagers} 
                            icon="briefcase" 
                            color="#10b981"
                        />
                        <StatCard 
                            title="Nhân viên" 
                            value={stats.totalEmployees} 
                            icon="person" 
                            color="#f59e0b"
                        />
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.projectStatCard, { backgroundColor: '#dbeafe' }]}>
                            <Text style={styles.projectStatValue}>{stats.activeProjects}</Text>
                            <Text style={styles.projectStatLabel}>Đang thực hiện</Text>
                        </View>
                        <View style={[styles.projectStatCard, { backgroundColor: '#d1fae5' }]}>
                            <Text style={styles.projectStatValue}>{stats.completedProjects}</Text>
                            <Text style={styles.projectStatLabel}>Hoàn thành</Text>
                        </View>
                        <View style={[styles.projectStatCard, { backgroundColor: '#fee2e2' }]}>
                            <Text style={styles.projectStatValue}>{stats.pendingApprovals}</Text>
                            <Text style={styles.projectStatLabel}>Chờ duyệt</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Grid */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>⚡ Quản lý nhanh</Text>
                    <View style={styles.menuGrid}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={styles.menuItem}
                                onPress={() => router.push(item.route as any)}
                            >
                                <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                                    {item.count !== null && item.count > 0 && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{item.count}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    welcomeText: {
        fontSize: 14,
        color: '#6b7280',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 4,
    },
    logoutButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    statsGrid: {
        marginBottom: 16,
    },
    statCard: {
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
    statContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    statTitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    projectStatCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    projectStatValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    projectStatLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center',
    },
    menuSection: {
        marginBottom: 24,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    menuItem: {
        width: '25%',
        padding: 8,
        alignItems: 'center',
    },
    menuIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    menuTitle: {
        fontSize: 12,
        color: '#374151',
        textAlign: 'center',
        fontWeight: '500',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});