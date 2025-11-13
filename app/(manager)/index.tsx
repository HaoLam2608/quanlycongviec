import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Modal,
    Pressable,
    StatusBar,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoutButton from '../../components/ui/LogoutButton';
import { PageHeader } from '../../components/ui/PageHeader';
import { fetchProjectsByManager, getTasksByProject } from '@/src/axios/api';

interface ProjectStats {
    total: number;
    chua_bat_dau: number;
    dang_chay: number;
    da_hoan_thanh: number;
    da_dong: number;
}

interface TaskStats {
    total: number;
    chua_bat_dau: number;
    dang_chay: number;
    hoan_thanh: number;
    cho_xac_nhan: number;
}

export default function ManagerDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [projectStats, setProjectStats] = useState<ProjectStats>({
        total: 0,
        chua_bat_dau: 0,
        dang_chay: 0,
        da_hoan_thanh: 0,
        da_dong: 0,
    });
    const [taskStats, setTaskStats] = useState<TaskStats>({
        total: 0,
        chua_bat_dau: 0,
        dang_chay: 0,
        hoan_thanh: 0,
        cho_xac_nhan: 0,
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
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
            console.log('📋 Projects loaded:', projects.length, projects);
            
            // Calculate project stats - database field is 'status' not 'trangThai'
            const pStats: ProjectStats = {
                total: projects.length,
                chua_bat_dau: projects.filter((p: any) => p.status === 'chua_bat_dau').length,
                dang_chay: projects.filter((p: any) => p.status === 'dang_chay').length,
                da_hoan_thanh: projects.filter((p: any) => p.status === 'da_hoan_thanh').length,
                da_dong: projects.filter((p: any) => p.status === 'da_dong').length,
            };
            console.log('📊 Project stats:', pStats);
            setProjectStats(pStats);

            // Load tasks from all projects
            let allTasks: any[] = [];
            for (const project of projects) {
                try {
                    const tasks = await getTasksByProject(project.id);
                    console.log(`✅ Tasks for project ${project.id}:`, tasks.length);
                    allTasks = [...allTasks, ...tasks];
                } catch (error) {
                    console.log(`❌ No tasks for project ${project.id}:`, error);
                }
            }

            // Calculate task stats - database uses Vietnamese with accents
            const tStats: TaskStats = {
                total: allTasks.length,
                chua_bat_dau: allTasks.filter((t: any) => t.trangThai === 'Chưa bắt đầu').length,
                dang_chay: allTasks.filter((t: any) => t.trangThai === 'Đang chạy').length,
                hoan_thanh: allTasks.filter((t: any) => t.trangThai === 'Hoàn thành').length,
                cho_xac_nhan: allTasks.filter((t: any) => t.trangThai === 'Chờ xác nhận hoàn thành').length,
            };
            console.log('📊 Task stats:', tStats);
            setTaskStats(tStats);
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <PageHeader
                        title="Bảng điều khiển Manager"
                        subtitle="Quản lý dự án và nhóm làm việc"
                        role="manager"
                    />
                    <LogoutButton variant="icon" size="md" iconType="door" className="absolute top-4 right-4" />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar 
                barStyle="light-content" 
                backgroundColor="#3b82f6" 
                translucent={false}
            />
            {/* Header with menu button */}
            <View style={styles.headerContainer}>
                <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(true)}
                >
                    <Text style={styles.menuButtonText}>☰</Text>
                </TouchableOpacity>
                
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Manager</Text>
                    <Text style={styles.headerSubtitle}>Bảng điều khiển</Text>
                </View>
                
                <LogoutButton variant="icon" size="sm" iconType="door" />
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Project Statistics */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>📊 Thống kê dự án</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
                            <Text style={styles.statNumber}>{projectStats.total}</Text>
                            <Text style={styles.statLabel}>Tổng dự án</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#6b7280' }]}>
                            <Text style={styles.statNumber}>{projectStats.chua_bat_dau}</Text>
                            <Text style={styles.statLabel}>Chưa bắt đầu</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
                            <Text style={styles.statNumber}>{projectStats.dang_chay}</Text>
                            <Text style={styles.statLabel}>Đang chạy</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                            <Text style={styles.statNumber}>{projectStats.da_hoan_thanh}</Text>
                            <Text style={styles.statLabel}>Hoàn thành</Text>
                        </View>
                    </View>
                </View>

                {/* Task Statistics */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>✅ Thống kê công việc</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
                            <Text style={styles.statNumber}>{taskStats.total}</Text>
                            <Text style={styles.statLabel}>Tổng công việc</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#6b7280' }]}>
                            <Text style={styles.statNumber}>{taskStats.chua_bat_dau}</Text>
                            <Text style={styles.statLabel}>Chưa bắt đầu</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
                            <Text style={styles.statNumber}>{taskStats.dang_chay}</Text>
                            <Text style={styles.statLabel}>Đang thực hiện</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                            <Text style={styles.statNumber}>{taskStats.hoan_thanh}</Text>
                            <Text style={styles.statLabel}>Hoàn thành</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Drawer Menu Modal */}
            <Modal
                visible={menuVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.drawerMenu}>
                        <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>⚡ Menu</Text>
                            <TouchableOpacity onPress={() => setMenuVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={styles.drawerItem}
                            onPress={() => {
                                setMenuVisible(false);
                                router.push('/(manager)/my-projects');
                            }}
                        >
                            <Text style={styles.drawerIcon}>📋</Text>
                            <View style={styles.drawerItemContent}>
                                <Text style={styles.drawerItemTitle}>Dự án của tôi</Text>
                                <Text style={styles.drawerItemSubtitle}>Quản lý các dự án</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.drawerItem}
                            onPress={() => {
                                setMenuVisible(false);
                                router.push('/(manager)/tasks');
                            }}
                        >
                            <Text style={styles.drawerIcon}>✅</Text>
                            <View style={styles.drawerItemContent}>
                                <Text style={styles.drawerItemTitle}>Quản lý công việc</Text>
                                <Text style={styles.drawerItemSubtitle}>Phân công và theo dõi</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.drawerItem}
                            onPress={() => {
                                setMenuVisible(false);
                                router.push('/(manager)/team');
                            }}
                        >
                            <Text style={styles.drawerIcon}>👥</Text>
                            <View style={styles.drawerItemContent}>
                                <Text style={styles.drawerItemTitle}>Quản lý nhóm</Text>
                                <Text style={styles.drawerItemSubtitle}>Quản lý thành viên</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.drawerItem}
                            onPress={() => {
                                setMenuVisible(false);
                                router.push('/(manager)/kanban');
                            }}
                        >
                            <Text style={styles.drawerIcon}>📋</Text>
                            <View style={styles.drawerItemContent}>
                                <Text style={styles.drawerItemTitle}>Kanban Board</Text>
                                <Text style={styles.drawerItemSubtitle}>Theo dõi tiến độ</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuButtonText: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#dbeafe',
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: 16,
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
    statsContainer: {
        marginBottom: 24,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '47%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
    },
    // Drawer Menu Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    drawerMenu: {
        width: '80%',
        height: '100%',
        backgroundColor: '#fff',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    drawerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        fontSize: 28,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    drawerIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    drawerItemContent: {
        flex: 1,
    },
    drawerItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    drawerItemSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
});
