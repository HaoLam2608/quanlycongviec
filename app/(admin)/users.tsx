import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../../src/axios/config';
import UserFormModal from './components/UserFormModal';

interface User {
    id: number;
    manv: string;
    hoten: string;
    chucvu: string;
    sdt: string;
    role: {
        id: number;
        name: string;
    };
    avatar?: string;
}

export default function UsersManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'teamlead' | 'employee'>('all');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, users, roleFilter]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');

            if (response.data) {
                setUsers(response.data.users || response.data);
            }
        } catch (error: any) {
            console.error('Error loading users:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        const q = searchQuery.trim().toLowerCase();

        // apply role filter first
        let base = users;
        if (roleFilter !== 'all') {
            const rf = roleFilter;
            if (rf === 'teamlead') {
                base = users.filter(u => ['teamlead', 'teamleader'].includes((u.role?.name || '').toLowerCase()));
            } else {
                base = users.filter(u => (u.role?.name || '').toLowerCase() === rf);
            }
        }

        if (q === '') {
            setFilteredUsers(base);
            return;
        }

        const filtered = base.filter(user =>
            (user.hoten || '').toLowerCase().includes(q) ||
            (user.manv || '').toLowerCase().includes(q) ||
            (user.chucvu || '').toLowerCase().includes(q)
        );
        setFilteredUsers(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUsers();
        setRefreshing(false);
    };

    const handleDeleteUser = (user: User) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa người dùng ${user.hoten}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/users/${user.id}`);
                            Alert.alert('Thành công', 'Đã xóa người dùng');
                            loadUsers();
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa người dùng');
                        }
                    }
                }
            ]
        );
    };

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return '#8b5cf6';
            case 'manager':
                return '#06b6d4';
            case 'teamlead':
            case 'teamleader':
                return '#10b981';
            case 'employee':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    const getRoleDisplayName = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return 'Quản trị viên';
            case 'manager':
                return 'Quản lý';
            case 'teamlead':
            case 'teamleader':
                return 'Trưởng nhóm';
            case 'employee':
                return 'Nhân viên';
            default:
                return roleName;
        }
    };

    const UserCard = ({ user }: { user: User }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => {
                setSelectedUser(user);
                setShowModal(true);
            }}
        >
            <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={24} color="#6b7280" />
                        )}
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user.hoten}</Text>
                        <Text style={styles.userCode}>Mã NV: {user.manv}</Text>
                        {user.chucvu && <Text style={styles.userPosition}>{user.chucvu}</Text>}
                    </View>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role.name) + '20' }]}>
                    <Text style={[styles.roleText, { color: getRoleBadgeColor(user.role.name) }]}>
                        {getRoleDisplayName(user.role.name)}
                    </Text>
                </View>
            </View>
            
            <View style={styles.userFooter}>
                <View style={styles.contactInfo}>
                    <Ionicons name="call" size={14} color="#6b7280" />
                    <Text style={styles.contactText}>{user.sdt || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                            setEditingUser(user);
                            setShowFormModal(true);
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteUser(user)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý người dùng</Text>
                <Text style={styles.subtitle}>Tổng số: {users.length} người dùng · Hiển thị: {filteredUsers.length}</Text>
            </View>

            {/* Role filter pills (horizontal scroll) */}
            <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setRoleFilter('all')} style={[styles.pill, roleFilter === 'all' && styles.pillActive]}>
                        <Text style={[styles.pillText, roleFilter === 'all' && styles.pillTextActive]}>Tất cả</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRoleFilter('admin')} style={[styles.pill, roleFilter === 'admin' && styles.pillActive]}>
                        <Text style={[styles.pillText, roleFilter === 'admin' && styles.pillTextActive]}>Admin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRoleFilter('teamlead')} style={[styles.pill, roleFilter === 'teamlead' && styles.pillActive]}>
                        <Text style={[styles.pillText, roleFilter === 'teamlead' && styles.pillTextActive]}>Trưởng nhóm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRoleFilter('employee')} style={[styles.pill, roleFilter === 'employee' && styles.pillActive]}>
                        <Text style={[styles.pillText, roleFilter === 'employee' && styles.pillTextActive]}>Nhân viên</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm người dùng..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
                    <Text style={styles.statValue}>{users.filter(u => u.role.name === 'admin').length}</Text>
                    <Text style={styles.statLabel}>Admin</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
                    <Text style={styles.statValue}>{users.filter(u => (u.role?.name || '').toLowerCase() === 'manager').length}</Text>
                    <Text style={styles.statLabel}>Quản lý</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
                    <Text style={styles.statValue}>{users.filter(u => ['teamlead','teamleader'].includes((u.role?.name || '').toLowerCase())).length}</Text>
                    <Text style={styles.statLabel}>Trưởng nhóm</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.statValue}>{users.filter(u => (u.role?.name || '').toLowerCase() === 'employee').length}</Text>
                    <Text style={styles.statLabel}>Nhân viên</Text>
                </View>
            </View>

            {/* Users List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                ) : filteredUsers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa có người dùng'}
                        </Text>
                    </View>
                ) : (
                    filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
                )}
            </ScrollView>

            {/* User Detail Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thông tin người dùng</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedUser && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.modalAvatarContainer}>
                                    <View style={styles.modalAvatar}>
                                        {selectedUser.avatar ? (
                                            <Image source={{ uri: selectedUser.avatar }} style={styles.modalAvatarImage} />
                                        ) : (
                                            <Ionicons name="person" size={48} color="#6b7280" />
                                        )}
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Họ tên:</Text>
                                    <Text style={styles.detailValue}>{selectedUser.hoten}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Mã nhân viên:</Text>
                                    <Text style={styles.detailValue}>{selectedUser.manv}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Chức vụ:</Text>
                                    <Text style={styles.detailValue}>{selectedUser.chucvu || 'Chưa cập nhật'}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                                    <Text style={styles.detailValue}>{selectedUser.sdt || 'Chưa cập nhật'}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Vai trò:</Text>
                                    <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(selectedUser.role.name) + '20' }]}>
                                        <Text style={[styles.roleText, { color: getRoleBadgeColor(selectedUser.role.name) }]}>
                                            {getRoleDisplayName(selectedUser.role.name)}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.editButton]}
                                onPress={() => {
                                    setShowModal(false);
                                    Alert.alert('Thông báo', 'Chức năng chỉnh sửa đang được phát triển');
                                }}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" />
                                <Text style={styles.modalButtonText}>Chỉnh sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.closeButton]}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: '#6b7280' }]}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Floating Add Button */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => {
                    setEditingUser(null);
                    setShowFormModal(true);
                }}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* User Form Modal */}
            <UserFormModal
                visible={showFormModal}
                user={editingUser}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingUser(null);
                }}
                onSuccess={() => {
                    loadUsers();
                }}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 4,
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
    userCard: {
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
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    userCode: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    userPosition: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 2,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    userFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 6,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    deleteButton: {
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
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalBody: {
        padding: 20,
    },
    modalAvatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalAvatarImage: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    editButton: {
        backgroundColor: '#3b82f6',
    },
    closeButton: {
        backgroundColor: '#f3f4f6',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    filterRow: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    pillContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#f3f4f6', marginRight: 8 },
    pillActive: { backgroundColor: '#111827' },
    pillText: { fontSize: 13, color: '#374151' },
    pillTextActive: { color: '#fff' },
});