import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/axios/config';

interface Permission {
    id: number;
    name: string;
    description: string;
    category?: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    permissions?: Permission[];
}

interface RoleFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    role: Role | null;
}

export default function RoleFormModal({ visible, onClose, onSuccess, role }: RoleFormModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (visible) {
            loadPermissions();
            if (role) {
                setName(role.name);
                setDescription(role.description || '');
                setSelectedPermissions(role.permissions?.map(p => p.id) || []);
            } else {
                resetForm();
            }
        }
    }, [visible, role]);

    const loadPermissions = async () => {
        setLoadingPermissions(true);
        try {
            const response = await api.get('/roles/permissions');
            if (response.data) {
                setAllPermissions(response.data.permissions || response.data || []);
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách quyền hạn');
        } finally {
            setLoadingPermissions(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedPermissions([]);
        setErrors({});
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Tên vai trò không được để trống';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permissionId)) {
                return prev.filter(id => id !== permissionId);
            } else {
                return [...prev, permissionId];
            }
        });
    };

    const toggleAllPermissions = () => {
        if (selectedPermissions.length === allPermissions.length) {
            setSelectedPermissions([]);
        } else {
            setSelectedPermissions(allPermissions.map(p => p.id));
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            if (role) {
                // Update existing role
                await api.put(`/roles/${role.id}`, {
                    name,
                    description,
                });

                // Update permissions using PUT instead of POST
                await api.put(`/roles/${role.id}/permissions`, {
                    permissionIds: selectedPermissions,
                });

                Alert.alert('Thành công', 'Cập nhật vai trò thành công');
            } else {
                // Create new role
                const response = await api.post('/roles', {
                    name,
                    description,
                    permissionIds: selectedPermissions,
                });

                Alert.alert('Thành công', 'Tạo vai trò thành công');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Error saving role:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            Alert.alert('Lỗi', message);
        } finally {
            setLoading(false);
        }
    };

    // Group permissions by category
    const permissionsByCategory = allPermissions.reduce((acc, permission) => {
        const category = permission.category || 'Khác';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
    }, {} as { [key: string]: Permission[] });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {role ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Role Name */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tên vai trò *</Text>
                            <TextInput
                                style={[styles.input, errors.name && styles.inputError]}
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (errors.name) setErrors({ ...errors, name: '' });
                                }}
                                placeholder="Nhập tên vai trò"
                                editable={!loading}
                            />
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        {/* Description */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mô tả</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Nhập mô tả vai trò"
                                multiline
                                numberOfLines={3}
                                editable={!loading}
                            />
                        </View>

                        {/* Permissions */}
                        <View style={styles.formGroup}>
                            <View style={styles.permissionsHeader}>
                                <Text style={styles.label}>
                                    Quyền hạn ({selectedPermissions.length}/{allPermissions.length})
                                </Text>
                                <TouchableOpacity
                                    onPress={toggleAllPermissions}
                                    style={styles.selectAllBtn}
                                >
                                    <Text style={styles.selectAllText}>
                                        {selectedPermissions.length === allPermissions.length
                                            ? 'Bỏ chọn tất cả'
                                            : 'Chọn tất cả'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {loadingPermissions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#8b5cf6" />
                                    <Text style={styles.loadingText}>Đang tải quyền hạn...</Text>
                                </View>
                            ) : Object.keys(permissionsByCategory).length === 0 ? (
                                <Text style={styles.emptyText}>Không có quyền hạn</Text>
                            ) : (
                                Object.entries(permissionsByCategory).map(([category, permissions]) => (
                                    <View key={category} style={styles.permissionCategory}>
                                        <Text style={styles.categoryTitle}>{category}</Text>
                                        {permissions.map((permission) => (
                                            <TouchableOpacity
                                                key={permission.id}
                                                style={styles.permissionItem}
                                                onPress={() => togglePermission(permission.id)}
                                            >
                                                <View style={styles.checkbox}>
                                                    {selectedPermissions.includes(permission.id) && (
                                                        <Ionicons name="checkmark" size={16} color="#8b5cf6" />
                                                    )}
                                                </View>
                                                <View style={styles.permissionInfo}>
                                                    <Text style={styles.permissionName}>
                                                        {permission.name}
                                                    </Text>
                                                    {permission.description && (
                                                        <Text style={styles.permissionDesc}>
                                                            {permission.description}
                                                        </Text>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {role ? 'Cập nhật' : 'Tạo mới'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalBody: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    permissionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    selectAllBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#ede9fe',
    },
    selectAllText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8b5cf6',
    },
    permissionCategory: {
        marginBottom: 16,
    },
    categoryTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    permissionInfo: {
        flex: 1,
    },
    permissionName: {
        fontSize: 14,
        color: '#111827',
        marginBottom: 2,
    },
    permissionDesc: {
        fontSize: 12,
        color: '#6b7280',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        padding: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    submitButton: {
        backgroundColor: '#8b5cf6',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
