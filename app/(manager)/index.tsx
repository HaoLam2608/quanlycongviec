import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjectsByManager, getTasksByProject } from '@/src/axios/api';

interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    pendingProjects: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    pendingTasks: number;
}

export default function ManagerDashboard() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('');
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingProjects: 0,
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
    });

    useEffect(() => {
        loadUserInfo();
        loadStats();
    }, []);

    const loadUserInfo = async () => {
        const hoten = await AsyncStorage.getItem('hoten');
        setUserName(hoten || 'Manager');
    };

    const loadStats = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            console.log('📱 User data from storage:', userData);
            
            let userId = null;
            
            if (userData) {
                // Try to parse user object
                const user = JSON.parse(userData);
                console.log('👤 Parsed user:', user);
                userId = user.id;
            } else {
                // Fallback: try to get userId directly
                const userIdStr = await AsyncStorage.getItem('userId');
                console.log('🔑 UserId from storage:', userIdStr);
                userId = userIdStr ? parseInt(userIdStr) : null;
            }
            
            if (!userId) {
                console.log('❌ No user ID found in AsyncStorage');
                return;
            }

            // Load projects
            console.log('🔄 Fetching projects for manager:', userId);
            const projects = await fetchProjectsByManager(userId);
            console.log('📋 Projects loaded:', projects.length);
            
            const totalProjects = projects.length;
            const activeProjects = projects.filter((p: any) => p.status === 'dang_chay').length;
            const completedProjects = projects.filter((p: any) => p.status === 'da_hoan_thanh').length;
            const pendingProjects = projects.filter((p: any) => p.status === 'chua_bat_dau').length;

            // Load tasks from all projects
            let allTasks: any[] = [];
            for (const project of projects) {
                try {
                    const tasks = await getTasksByProject(project.id);
                    allTasks = [...allTasks, ...tasks];
                } catch (error) {
                    console.log(`❌ No tasks for project ${project.id}`);
                }
            }

            const totalTasks = allTasks.length;
            const activeTasks = allTasks.filter((t: any) => t.trangThai === 'Đang chạy').length;
            const completedTasks = allTasks.filter((t: any) => t.trangThai === 'Hoàn thành').length;
            const pendingTasks = allTasks.filter((t: any) => t.trangThai === 'Chưa bắt đầu').length;

            const finalStats = {
                totalProjects,
                activeProjects,
                completedProjects,
                pendingProjects,
                totalTasks,
                activeTasks,
                completedTasks,
                pendingTasks,
            };
            
            console.log('📈 Final stats:', finalStats);
            setStats(finalStats);
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
            title: 'Dự án của tôi', 
            icon: 'folder', 
            route: '/(manager)/my-projects',
            color: '#3b82f6',
            count: stats.totalProjects
        },
        { 
            title: 'Công việc', 
            icon: 'checkmark-done', 
            route: '/(manager)/tasks',
            color: '#8b5cf6',
            count: stats.totalTasks
        },
        { 
            title: 'Nhóm', 
            icon: 'people', 
            route: '/(manager)/team',
            color: '#10b981',
            count: null
        },
        { 
            title: 'Kanban', 
            icon: 'grid', 
            route: '/(manager)/kanban',
            color: '#f59e0b',
            count: null
        },
        { 
            title: 'Lịch', 
            icon: 'calendar', 
            route: '/(manager)/timeline',
            color: '#ec4899',
            count: null
        },
        { 
            title: 'Báo cáo', 
            icon: 'bar-chart', 
            route: '/(manager)/reports',
            color: '#06b6d4',
            count: null
        },
        { 
            title: 'Tài liệu', 
            icon: 'document-text', 
            route: '/(manager)/documents',
            color: '#f97316',
            count: null
        },
        { 
            title: 'Phê duyệt', 
            icon: 'checkmark-done', 
            route: '/(manager)/approvals',
            color: '#ec4899',
            count: null
        },
        { 
            title: 'Thông báo', 
            icon: 'notifications', 
            route: '/(manager)/notifications',
            color: '#8b5cf6',
            count: null
        },
        { 
            title: 'Cài đặt', 
            icon: 'settings', 
            route: '/(manager)/settings',
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
                    <Text style={styles.headerTitle}>Bảng điều khiển Manager</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#f59e0b" />
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
                            title="Tổng dự án" 
                            value={stats.totalProjects} 
                            icon="folder" 
                            color="#3b82f6"
                        />
                        <StatCard 
                            title="Đang thực hiện" 
                            value={stats.activeProjects} 
                            icon="play-circle" 
                            color="#f59e0b"
                        />
                        <StatCard 
                            title="Hoàn thành" 
                            value={stats.completedProjects} 
                            icon="checkmark-circle" 
                            color="#10b981"
                        />
                        <StatCard 
                            title="Chưa bắt đầu" 
                            value={stats.pendingProjects} 
                            icon="time" 
                            color="#6b7280"
                        />
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.projectStatCard, { backgroundColor: '#dbeafe' }]}>
                            <Text style={styles.projectStatValue}>{stats.totalTasks}</Text>
                            <Text style={styles.projectStatLabel}>Tổng công việc</Text>
                        </View>
                        <View style={[styles.projectStatCard, { backgroundColor: '#fef3c7' }]}>
                            <Text style={styles.projectStatValue}>{stats.activeTasks}</Text>
                            <Text style={styles.projectStatLabel}>Đang thực hiện</Text>
                        </View>
                        <View style={[styles.projectStatCard, { backgroundColor: '#d1fae5' }]}>
                            <Text style={styles.projectStatValue}>{stats.completedTasks}</Text>
                            <Text style={styles.projectStatLabel}>Hoàn thành</Text>
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
    logoutButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 4,
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
        backgroundColor: '#f59e0b',
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
