import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../../../src/axios/config';

interface User {
    id: number;
    manv: string;
    hoten: string;
}

interface GroupFormData {
    id?: number;
    name: string;
    description: string;
    leaderId: number;
    memberIds: number[];
    status: string;
}

interface Props {
    visible: boolean;
    group: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function GroupFormModal({ visible, group, onClose, onSuccess }: Props) {
    const [formData, setFormData] = useState<GroupFormData>({
        name: '',
        description: '',
        leaderId: 0,
        memberIds: [],
        status: 'active',
    });
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [showMemberSelector, setShowMemberSelector] = useState(false);

    useEffect(() => {
        if (visible) {
            loadUsers();
            if (group) {
                setFormData({
                    id: group.id,
                    name: group.name || '',
                    description: group.description || '',
                    leaderId: group.leaderId || group.leader?.id || 0,
                    memberIds: group.members?.map((m: any) => m.id) || [],
                    status: group.status || 'active',
                });
            } else {
                resetForm();
            }
        }
    }, [visible, group]);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.users || response.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            leaderId: 0,
            memberIds: [],
            status: 'active',
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên nhóm không được để trống';
        }

        if (!formData.leaderId) {
            newErrors.leaderId = 'Vui lòng chọn trưởng nhóm';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const toggleMember = (userId: number) => {
        setFormData(prev => ({
            ...prev,
            memberIds: prev.memberIds.includes(userId)
                ? prev.memberIds.filter(id => id !== userId)
                : [...prev.memberIds, userId]
        }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                leaderId: formData.leaderId,
                status: formData.status,
            };

            console.log('📤 Saving group with payload:', payload);

            if (group) {
                // Update group basic info
                const updateResponse = await api.put(`/groups/${group.id}`, {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    leaderId: formData.leaderId,
                });
                console.log('✅ Group updated:', updateResponse.data);
                
                // Handle status change separately
                if (formData.status === 'closed') {
                    try {
                        await api.patch(`/groups/${group.id}/close`);
                        console.log('✅ Group closed');
                    } catch (closeError: any) {
                        console.error('Error closing group:', closeError);
                        const closeErrorMsg = closeError.response?.data?.message || 'Không thể đóng nhóm';
                        Alert.alert('Cảnh báo', `Đã cập nhật thông tin nhóm.\n\nLỗi khi đóng nhóm: ${closeErrorMsg}`);
                    }
                }
                
                // Only update members if group is active and members are selected
                if (formData.status === 'active' && formData.memberIds.length > 0) {
                    try {
                        await api.post(`/groups/${group.id}/members`, {
                            memberIds: formData.memberIds
                        });
                        Alert.alert('Thành công', 'Đã cập nhật nhóm và thành viên');
                    } catch (memberError: any) {
                        const memberErrorMsg = memberError.response?.data?.message || 'Không thể thêm thành viên';
                        Alert.alert(
                            'Cập nhật nhóm thành công',
                            `Thông tin nhóm đã được cập nhật.\n\nLỗi khi thêm thành viên: ${memberErrorMsg}`
                        );
                    }
                } else {
                    Alert.alert('Thành công', 'Đã cập nhật nhóm');
                }
                
                onSuccess();
                onClose();
            } else {
                // Create new group
                const response = await api.post('/groups', payload);
                const groupId = response.data.id || response.data.group?.id;
                
                // Add members if group is active and members are selected
                if (formData.status === 'active' && formData.memberIds.length > 0 && groupId) {
                    try {
                        await api.post(`/groups/${groupId}/members`, {
                            memberIds: formData.memberIds
                        });
                        Alert.alert('Thành công', 'Đã tạo nhóm mới và thêm thành viên');
                    } catch (memberError: any) {
                        const memberErrorMsg = memberError.response?.data?.message || 'Không thể thêm thành viên';
                        Alert.alert(
                            'Tạo nhóm thành công',
                            `Nhóm đã được tạo.\n\nLỗi khi thêm thành viên: ${memberErrorMsg}`
                        );
                    }
                } else {
                    Alert.alert('Thành công', 'Đã tạo nhóm mới');
                }
                
                onSuccess();
                onClose();
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving group:', error);
            const errorMsg = error.response?.data?.message || 'Không thể lưu nhóm';
            Alert.alert('Lỗi', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        { label: 'Hoạt động', value: 'active' },
        { label: 'Đóng', value: 'closed' },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {group ? 'Chỉnh sửa nhóm' : 'Thêm nhóm mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {/* Tên nhóm */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Tên nhóm <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, errors.name && styles.inputError]}
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholder="Nhập tên nhóm"
                            />
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        {/* Mô tả */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mô tả</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                                placeholder="Nhập mô tả nhóm"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Trưởng nhóm */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Trưởng nhóm <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[styles.pickerContainer, errors.leaderId && styles.inputError]}>
                                <Picker
                                    selectedValue={formData.leaderId}
                                    onValueChange={(value) => setFormData({ ...formData, leaderId: value })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Chọn trưởng nhóm" value={0} />
                                    {users.map((user) => (
                                        <Picker.Item 
                                            key={user.id} 
                                            label={`${user.hoten} (${user.manv})`} 
                                            value={user.id} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                            {errors.leaderId && <Text style={styles.errorText}>{errors.leaderId}</Text>}
                        </View>

                        {/* Thành viên */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Thành viên ({formData.memberIds.length})</Text>
                            <TouchableOpacity
                                style={styles.memberSelector}
                                onPress={() => setShowMemberSelector(!showMemberSelector)}
                            >
                                <Ionicons name="people-outline" size={20} color="#6b7280" />
                                <Text style={styles.memberSelectorText}>
                                    {formData.memberIds.length > 0 
                                        ? `${formData.memberIds.length} thành viên được chọn` 
                                        : 'Chọn thành viên'}
                                </Text>
                                <Ionicons 
                                    name={showMemberSelector ? "chevron-up" : "chevron-down"} 
                                    size={20} 
                                    color="#6b7280" 
                                />
                            </TouchableOpacity>

                            {showMemberSelector && (
                                <View style={styles.memberList}>
                                    {users
                                        .filter(u => u.id !== formData.leaderId)
                                        .map((user) => (
                                            <TouchableOpacity
                                                key={user.id}
                                                style={styles.memberItem}
                                                onPress={() => toggleMember(user.id)}
                                            >
                                                <View style={styles.checkbox}>
                                                    {formData.memberIds.includes(user.id) && (
                                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                                    )}
                                                </View>
                                                <Text style={styles.memberName}>
                                                    {user.hoten} ({user.manv})
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            )}
                        </View>

                        {/* Trạng thái */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Trạng thái</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    style={styles.picker}
                                >
                                    {statusOptions.map((option) => (
                                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {group ? 'Cập nhật' : 'Tạo mới'}
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
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    form: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    memberSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    memberSelectorText: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
    },
    memberList: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        maxHeight: 200,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        gap: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#3b82f6',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
    },
    memberName: {
        fontSize: 14,
        color: '#374151',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#10b981',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
