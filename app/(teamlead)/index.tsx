import { useLogout } from '@/hooks/useLogout';
import { getGroupSubtasks, getMyGroup } from '@/src/axios/api';
import { approvalAPI } from '@/src/axios/approvalApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface DashboardStats {
    totalMembers: number;
    totalSubtasks: number;
    pendingSubtasks: number;
    inProgressSubtasks: number;
    completedSubtasks: number;
    pendingApprovals: number;
    completionRate: number;
    groupName: string;
    groupDescription?: string;
}

const DEFAULT_STATS: DashboardStats = {
    totalMembers: 0,
    totalSubtasks: 0,
    pendingSubtasks: 0,
    inProgressSubtasks: 0,
    completedSubtasks: 0,
    pendingApprovals: 0,
    completionRate: 0,
    groupName: 'Nhóm của tôi',
    groupDescription: ''
};

export default function TeamLeadDashboardScreen() {
    const router = useRouter();
    const { logout } = useLogout();
    const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
    const [refreshing, setRefreshing] = useState(false);

    const computeStats = useCallback((rawSubtasks: any[], pendingApprovals: number, group: any) => {
        const totalSubtasks = rawSubtasks.length;
        const completedSubtasks = rawSubtasks.filter(item => item.trangThai === 'Hoàn thành').length;
        const inProgressSubtasks = rawSubtasks.filter(item => item.trangThai === 'Đang chạy').length;
        const pendingSubtasks = rawSubtasks.filter(item => item.trangThai === 'Chưa bắt đầu').length;
        const completionRate = totalSubtasks > 0
            ? Math.round((completedSubtasks / totalSubtasks) * 100)
            : 0;

        setStats({
            totalMembers: group?.members?.length || group?.Members?.length || 0,
            totalSubtasks,
            pendingSubtasks,
            inProgressSubtasks,
            completedSubtasks,
            pendingApprovals,
            completionRate,
            groupName: group?.name || group?.Group?.name || 'Nhóm của tôi',
            groupDescription: group?.description || ''
        });

    }, []);

    const loadData = useCallback(async () => {
        try {
            const [groupRes, subtasksRes, approvalsRes] = await Promise.all([
                getMyGroup().catch(() => null),
                getGroupSubtasks().catch(() => ({ subtasks: [] })),
                approvalAPI.getPendingApprovals({ type: 'subtasks' }).catch(() => ({ data: { subtasks: [] } }))
            ]);

            // Kiểm tra nếu nhóm bị đóng hoặc không có quyền
            if (!groupRes || groupRes.status === 'closed') {
                setStats({
                    ...DEFAULT_STATS,
                    groupName: groupRes?.name || 'Nhóm đã đóng',
                    groupDescription: 'Nhóm của bạn đã bị đóng hoặc bạn không còn là trưởng nhóm'
                });
                return;
            }

            const rawSubtasks: any[] = Array.isArray(subtasksRes?.subtasks)
                ? subtasksRes.subtasks
                : Array.isArray(subtasksRes)
                    ? subtasksRes
                    : subtasksRes?.data?.subtasks || [];

            const pendingApprovals = approvalsRes?.subtasks?.length ??
                approvalsRes?.data?.subtasks?.length ??
                Array.isArray(approvalsRes) ? approvalsRes.length : 0;

            computeStats(rawSubtasks, pendingApprovals, groupRes);
        } catch (error: any) {
            console.error('Load team lead dashboard error:', error);
            // Hiển thị thông báo lỗi thân thiện
            setStats({
                ...DEFAULT_STATS,
                groupDescription: error?.message || 'Không thể tải dữ liệu nhóm'
            });
        }
    }, [computeStats]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const menuItems = [
        {
            title: 'Dự án',
            icon: 'layers',
            color: '#facc15',
            route: '/(teamlead)/projects'
        },
        {
            title: 'Nhóm của tôi',
            icon: 'people',
            color: '#3b82f6',
            route: '/(teamlead)/group',
            count: stats.totalMembers
        },
        {
            title: 'Kanban',
            icon: 'grid',
            color: '#8b5cf6',
            route: '/(teamlead)/subtasks',
            count: stats.totalSubtasks
        },
        {
            title: 'Công việc chính',
            icon: 'clipboard',
            color: '#f97316',
            route: '/(teamlead)/tasks'
        },
        {
            title: 'Yêu cầu nhận task',
            icon: 'hand-right',
            color: '#06b6d4',
            route: '/(teamlead)/available-tasks'
        },
        {
            title: 'Phê duyệt',
            icon: 'checkbox',
            color: '#f59e0b',
            route: '/(teamlead)/approvals',
            count: stats.pendingApprovals
        },
        {
            title: 'Báo cáo',
            icon: 'bar-chart',
            color: '#22c55e',
            route: '/(teamlead)/reports'
        },
        {
            title: 'Cài đặt',
            icon: 'settings',
            color: '#94a3b8',
            route: '/(teamlead)/profile'
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <Text style={styles.welcomeText}>Xin chào, Team Lead!</Text>
                    <Text style={styles.headerTitle}>Bảng điều khiển Nhóm trưởng</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerActionButton}
                        onPress={() => router.push('/(teamlead)/profile' as any)}
                    >
                        <Ionicons name="person-circle" size={32} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerActionButton}
                        onPress={logout}
                    >
                        <Ionicons name="log-out-outline" size={26} color="#f59e0b" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>📊 Thống kê tổng quan</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Tổng công việc con"
                            value={stats.totalSubtasks}
                            icon="file-tray-full"
                            color="#3b82f6"
                        />
                        <StatCard
                            title="Đang thực hiện"
                            value={stats.inProgressSubtasks}
                            icon="play-circle"
                            color="#f59e0b"
                        />
                        <StatCard
                            title="Hoàn thành"
                            value={stats.completedSubtasks}
                            icon="checkmark-circle"
                            color="#10b981"
                        />
                        <StatCard
                            title="Chưa bắt đầu"
                            value={stats.pendingSubtasks}
                            icon="time"
                            color="#6b7280"
                        />
                    </View>

                    <View style={styles.statsRow}>
                        <InfoCard
                            label="Thành viên"
                            value={stats.totalMembers}
                            background="#ede9fe"
                            textColor="#4338ca"
                        />
                        <InfoCard
                            label="Tỷ lệ hoàn thành"
                            value={`${stats.completionRate}%`}
                            background="#fef3c7"
                            textColor="#b45309"
                        />
                        <InfoCard
                            label="Chờ phê duyệt"
                            value={stats.pendingApprovals}
                            background="#fee2e2"
                            textColor="#b91c1c"
                        />
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>⚡ Quản lý nhanh</Text>
                    <View style={styles.menuGrid}>
                        {menuItems.map(item => (
                            <TouchableOpacity
                                key={item.route}
                                style={styles.menuItem}
                                onPress={() => router.push(item.route as any)}
                            >
                                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                                    <Ionicons name={item.icon as any} size={26} color={item.color} />
                                    {item.count !== undefined && item.count !== null && item.count > 0 && (
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

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
    return (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statContent}>
                <View>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{title}</Text>
                </View>
                <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon as any} size={24} color={color} />
                </View>
            </View>
        </View>
    );
}

function InfoCard({ value, label, background, textColor }: {
    value: number | string;
    label: string;
    background: string;
    textColor: string;
}) {
    return (
        <View style={[styles.infoCard, { backgroundColor: background }]}>
            <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
            <Text style={styles.infoLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    headerInfo: {
        flex: 1,
        paddingRight: 12
    },
    welcomeText: {
        fontSize: 14,
        color: '#6b7280'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 4
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 6
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerActionButton: {
        marginLeft: 12,
        padding: 4
    },
    content: {
        flex: 1,
        padding: 16
    },
    statsSection: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16
    },
    statsGrid: {},
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3
    },
    statContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827'
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center'
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        gap: 12
    },
    infoCard: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    infoValue: {
        fontSize: 20,
        fontWeight: '600'
    },
    infoLabel: {
        fontSize: 13,
        color: '#4b5563',
        marginTop: 4,
        textAlign: 'center'
    },
    menuSection: {
        marginBottom: 24
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    menuItem: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3
    },
    menuIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827'
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700'
    }
});
