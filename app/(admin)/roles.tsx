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
import RoleFormModal from './components/RoleFormModal';

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

export default function RolesManagement() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const response = await api.get('/roles');

            if (response.data) {
                const rolesData = response.data.roles || response.data;
                console.log('📋 Loaded roles with permissions:', JSON.stringify(rolesData, null, 2));
                setRoles(rolesData);
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách vai trò');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRoles();
        setRefreshing(false);
    };

    const handleDeleteRole = (role: Role) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/roles/${role.id}`);
                            Alert.alert('Thành công', 'Xóa vai trò thành công');
                            loadRoles();
                        } catch (error: any) {
                            console.error('Error deleting role:', error);
                            const message = error.response?.data?.message || 'Không thể xóa vai trò';
                            Alert.alert('Lỗi', message);
                        }
                    },
                },
            ]
        );
    };

    const getRoleColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
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

    const RoleCard = ({ role }: { role: Role }) => {
        const color = getRoleColor(role.name);
        
        return (
            <TouchableOpacity 
                style={styles.roleCard}
                onPress={() => {
                    // Navigate to role detail with role data
                    router.push({
                        pathname: '/(admin)/role-detail',
                        params: { roleId: role.id }
                    });
                }}
                activeOpacity={0.7}
            >
                <View style={styles.roleHeader}>
                    <View style={[styles.roleIcon, { backgroundColor: color + '20' }]}>
                        <Ionicons name="shield-checkmark" size={24} color={color} />
                    </View>
                    <View style={styles.roleInfo}>
                        <Text style={styles.roleName}>{role.name}</Text>
                        <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
                
                <View style={styles.permissionsSection}>
                    <View style={styles.permissionsHeader}>
                        <Text style={styles.permissionsTitle}>
                            Quyền hạn ({role.permissions?.length || 0})
                        </Text>
                        <View style={styles.roleActions}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => {
                                    setEditingRole(role);
                                    setShowFormModal(true);
                                }}
                            >
                                <Ionicons name="create-outline" size={18} color="#8b5cf6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => handleDeleteRole(role)}
                            >
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.permissionsList}>
                        {role.permissions?.slice(0, 3).map((permission, index) => (
                            <View key={index} style={styles.permissionBadge}>
                                <Ionicons name="checkmark-circle" size={14} color={color} />
                                <Text style={[styles.permissionText, { color }]}>
                                    {permission.name}
                                </Text>
                            </View>
                        ))}
                        {role.permissions?.length > 3 && (
                            <Text style={styles.moreText}>
                                +{role.permissions.length - 3} quyền khác
                            </Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý vai trò</Text>
                <Text style={styles.subtitle}>Tổng số: {roles.length} vai trò</Text>
            </View>

            {/* Roles List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : roles.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="shield-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>Chưa có vai trò</Text>
                    </View>
                ) : (
                    roles.map((role) => <RoleCard key={role.id} role={role} />)
                )}
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => {
                    setEditingRole(null);
                    setShowFormModal(true);
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Form Modal */}
            <RoleFormModal
                visible={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingRole(null);
                }}
                onSuccess={() => {
                    setShowFormModal(false);
                    setEditingRole(null);
                    loadRoles();
                }}
                role={editingRole}
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
    content: {
        flex: 1,
        padding: 16,
    },
    roleCard: {
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
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    roleInfo: {
        flex: 1,
    },
    roleName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textTransform: 'capitalize',
    },
    roleDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    permissionsSection: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    permissionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    permissionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    roleActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f5f3ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        backgroundColor: '#fee2e2',
    },
    permissionsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    permissionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    permissionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    moreText: {
        fontSize: 12,
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 4,
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
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
