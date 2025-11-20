import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import api from '../../src/axios/config';

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
}

export default function RoleDetail() {
    const router = useRouter();
    const { roleId } = useLocalSearchParams();
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (roleId) {
            loadRoleDetail();
        }
    }, [roleId]);

    const loadRoleDetail = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/roles/${roleId}`);
            if (response.data) {
                setRole(response.data);
            }
        } catch (error) {
            console.error('Error loading role detail:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin vai trò');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const getRoleColor = (roleName: string) => {
        switch (roleName?.toLowerCase()) {
            case 'admin':
                return '#8b5cf6';
            case 'manager':
                return '#10b981';
            case 'employee':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    const groupPermissionsByCategory = (permissions: Permission[]) => {
        const grouped: { [key: string]: Permission[] } = {};
        
        permissions.forEach(permission => {
            const category = permission.name.split(':')[0] || 'Khác';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(permission);
        });
        
        return grouped;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!role) {
        return null;
    }

    const color = getRoleColor(role.name);
    const groupedPermissions = groupPermissionsByCategory(role.permissions || []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Chi tiết vai trò</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Role Info Card */}
                <View style={styles.roleInfoCard}>
                    <View style={[styles.roleIcon, { backgroundColor: color + '20' }]}>
                        <Ionicons name="shield-checkmark" size={48} color={color} />
                    </View>
                    <Text style={styles.roleName}>{role.name}</Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{role.permissions?.length || 0}</Text>
                            <Text style={styles.statLabel}>Quyền hạn</Text>
                        </View>
                    </View>
                </View>

                {/* Permissions List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Danh sách quyền hạn</Text>
                    
                    {Object.keys(groupedPermissions).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="lock-closed-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>Chưa có quyền hạn nào</Text>
                        </View>
                    ) : (
                        Object.entries(groupedPermissions).map(([category, permissions]) => (
                            <View key={category} style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Ionicons name="folder-outline" size={20} color={color} />
                                    <Text style={[styles.categoryTitle, { color }]}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryCount}>{permissions.length}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.permissionsList}>
                                    {permissions.map((permission) => (
                                        <View key={permission.id} style={styles.permissionItem}>
                                            <View style={styles.permissionIcon}>
                                                <Ionicons name="checkmark-circle" size={20} color={color} />
                                            </View>
                                            <View style={styles.permissionContent}>
                                                <Text style={styles.permissionName}>{permission.name}</Text>
                                                {permission.description && (
                                                    <Text style={styles.permissionDescription}>
                                                        {permission.description}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))
                    )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    roleInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    roleIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    roleName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'capitalize',
        marginBottom: 8,
    },
    roleDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    categoryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    categoryBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    permissionsList: {
        gap: 8,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
    },
    permissionIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    permissionContent: {
        flex: 1,
    },
    permissionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    permissionDescription: {
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 18,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    emptyContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 12,
    },
});
