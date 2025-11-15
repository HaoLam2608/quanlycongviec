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
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../src/axios/config';

interface Role {
    id: number;
    name: string;
}

interface UserFormData {
    id?: number;
    manv: string;
    hoten: string;
    password?: string;
    chucvu: string;
    sdt: string;
    email?: string;
    roleId: number;
}

interface Props {
    visible: boolean;
    user: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserFormModal({ visible, user, onClose, onSuccess }: Props) {
    const [formData, setFormData] = useState<UserFormData>({
        manv: '',
        hoten: '',
        password: '',
        chucvu: '',
        sdt: '',
        email: '',
        roleId: 0,
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (visible) {
            loadRoles();
            if (user) {
                // Edit mode
                setFormData({
                    id: user.id,
                    manv: user.manv || '',
                    hoten: user.hoten || '',
                    chucvu: user.chucvu || '',
                    sdt: user.sdt || '',
                    email: user.email || '',
                    roleId: user.role?.id || user.roleId || 0,
                });
                setAvatarUri(user.avatar || null);
            } else {
                // Create mode
                resetForm();
            }
        }
    }, [visible, user]);

    const loadRoles = async () => {
        try {
            const response = await api.get('/roles');
            setRoles(response.data.roles || response.data || []);
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            manv: '',
            hoten: '',
            password: '',
            chucvu: '',
            sdt: '',
            email: '',
            roleId: 0,
        });
        setErrors({});
        setAvatarUri(null);
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
            Alert.alert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (userId: number) => {
        if (!avatarUri || avatarUri.startsWith('http')) return; // Skip if no new avatar or existing URL

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            const filename = avatarUri.split('/').pop() || 'avatar.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('avatar', {
                uri: avatarUri,
                name: filename,
                type,
            } as any);

            await api.post(`/users/${userId}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            Alert.alert('Cảnh báo', 'Không thể tải lên ảnh đại diện');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.manv.trim()) {
            newErrors.manv = 'Mã nhân viên không được để trống';
        }

        if (!formData.hoten.trim()) {
            newErrors.hoten = 'Họ tên không được để trống';
        }

        if (!user && !formData.password) {
            newErrors.password = 'Mật khẩu không được để trống';
        }

        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.roleId) {
            newErrors.roleId = 'Vui lòng chọn vai trò';
        }

        if (formData.sdt && !/^[0-9]{10,11}$/.test(formData.sdt)) {
            newErrors.sdt = 'Số điện thoại không hợp lệ';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                manv: formData.manv.trim(),
                hoten: formData.hoten.trim(),
                chucvu: formData.chucvu.trim(),
                sdt: formData.sdt.trim(),
                email: formData.email?.trim(),
                roleId: formData.roleId,
            };

            // Only include password if provided
            if (formData.password) {
                payload.password = formData.password;
            }

            let userId: number;

            if (user) {
                // Update existing user
                await api.put(`/users/${user.id}`, payload);
                userId = user.id;
                
                // Upload avatar if changed
                await uploadAvatar(userId);
                
                Alert.alert('Thành công', 'Đã cập nhật người dùng');
            } else {
                // Create new user
                const response = await api.post('/users', payload);
                userId = response.data.user?.id || response.data.id;
                
                // Upload avatar for new user
                if (userId && avatarUri) {
                    await uploadAvatar(userId);
                }
                
                Alert.alert('Thành công', 'Đã tạo người dùng mới');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving user:', error);
            const errorMsg = error.response?.data?.message || 'Không thể lưu người dùng';
            Alert.alert('Lỗi', errorMsg);
        } finally {
            setLoading(false);
        }
    };

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
                            {user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {/* Avatar Upload */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Ảnh đại diện</Text>
                            <TouchableOpacity 
                                style={styles.avatarContainer}
                                onPress={pickImage}
                                disabled={loading || uploadingAvatar}
                            >
                                {avatarUri ? (
                                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="person" size={40} color="#9ca3af" />
                                    </View>
                                )}
                                <View style={styles.avatarOverlay}>
                                    <Ionicons name="camera" size={24} color="#fff" />
                                    <Text style={styles.avatarText}>
                                        {avatarUri ? 'Đổi ảnh' : 'Thêm ảnh'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Mã nhân viên */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Mã nhân viên <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, errors.manv && styles.inputError]}
                                value={formData.manv}
                                onChangeText={(text) => setFormData({ ...formData, manv: text })}
                                placeholder="Nhập mã nhân viên"
                                editable={!user} // Không cho sửa mã NV khi edit
                            />
                            {errors.manv && <Text style={styles.errorText}>{errors.manv}</Text>}
                        </View>

                        {/* Họ tên */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Họ tên <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, errors.hoten && styles.inputError]}
                                value={formData.hoten}
                                onChangeText={(text) => setFormData({ ...formData, hoten: text })}
                                placeholder="Nhập họ và tên"
                            />
                            {errors.hoten && <Text style={styles.errorText}>{errors.hoten}</Text>}
                        </View>

                        {/* Mật khẩu */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Mật khẩu {!user && <Text style={styles.required}>*</Text>}
                            </Text>
                            <TextInput
                                style={[styles.input, errors.password && styles.inputError]}
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                                placeholder={user ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                                secureTextEntry
                            />
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Vai trò */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Vai trò <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[styles.pickerContainer, errors.roleId && styles.inputError]}>
                                <Picker
                                    selectedValue={formData.roleId}
                                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Chọn vai trò" value={0} />
                                    {roles.map((role) => (
                                        <Picker.Item key={role.id} label={role.name} value={role.id} />
                                    ))}
                                </Picker>
                            </View>
                            {errors.roleId && <Text style={styles.errorText}>{errors.roleId}</Text>}
                        </View>

                        {/* Chức vụ */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Chức vụ</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.chucvu}
                                onChangeText={(text) => setFormData({ ...formData, chucvu: text })}
                                placeholder="Nhập chức vụ"
                            />
                        </View>

                        {/* Số điện thoại */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Số điện thoại</Text>
                            <TextInput
                                style={[styles.input, errors.sdt && styles.inputError]}
                                value={formData.sdt}
                                onChangeText={(text) => setFormData({ ...formData, sdt: text })}
                                placeholder="Nhập số điện thoại"
                                keyboardType="phone-pad"
                            />
                            {errors.sdt && <Text style={styles.errorText}>{errors.sdt}</Text>}
                        </View>

                        {/* Email */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                placeholder="Nhập email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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
                            style={[styles.button, styles.submitButton]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {user ? 'Cập nhật' : 'Tạo mới'}
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
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f3f4f6',
        alignSelf: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 8,
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
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
        backgroundColor: '#3b82f6',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
