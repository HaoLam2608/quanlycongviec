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
import { Picker } from '@react-native-picker/picker';
import api from '../../../src/axios/config';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead?: boolean;
}

interface NotificationFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    notification: Notification | null;
}

export default function NotificationFormModal({ 
    visible, 
    onClose, 
    onSuccess, 
    notification 
}: NotificationFormModalProps) {
    const [type, setType] = useState('system');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const notificationTypes = [
        { value: 'task', label: 'Công việc' },
        { value: 'project', label: 'Dự án' },
        { value: 'approval', label: 'Phê duyệt' },
        { value: 'system', label: 'Hệ thống' },
        { value: 'announcement', label: 'Thông báo chung' },
    ];

    useEffect(() => {
        if (visible) {
            if (notification) {
                setType(notification.type || 'system');
                setTitle(notification.title);
                setMessage(notification.message);
            } else {
                resetForm();
            }
        }
    }, [visible, notification]);

    const resetForm = () => {
        setType('system');
        setTitle('');
        setMessage('');
        setErrors({});
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!title.trim()) {
            newErrors.title = 'Tiêu đề không được để trống';
        }

        if (!message.trim()) {
            newErrors.message = 'Nội dung không được để trống';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            if (notification) {
                // Update existing notification
                await api.put(`/notifications/admin/${notification.id}`, {
                    type,
                    title,
                    message,
                });

                Alert.alert('Thành công', 'Cập nhật thông báo thành công');
            } else {
                // Create new notification (broadcast to all users)
                await api.post('/notifications/admin/create', {
                    type,
                    title,
                    message,
                    broadcast: true, // Send to all users
                });

                Alert.alert('Thành công', 'Tạo thông báo thành công');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Error saving notification:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra';
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (typeValue: string) => {
        switch (typeValue) {
            case 'task':
                return 'checkmark-circle';
            case 'project':
                return 'folder';
            case 'approval':
                return 'checkmark-done';
            case 'system':
                return 'information-circle';
            case 'announcement':
                return 'megaphone';
            default:
                return 'notifications';
        }
    };

    const getTypeColor = (typeValue: string) => {
        switch (typeValue) {
            case 'task':
                return '#3b82f6';
            case 'project':
                return '#10b981';
            case 'approval':
                return '#ec4899';
            case 'system':
                return '#f59e0b';
            case 'announcement':
                return '#8b5cf6';
            default:
                return '#6b7280';
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
                            {notification ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Type Picker */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Loại thông báo *</Text>
                            <View style={styles.typeSelector}>
                                <View style={[
                                    styles.typeIcon, 
                                    { backgroundColor: getTypeColor(type) + '20' }
                                ]}>
                                    <Ionicons 
                                        name={getTypeIcon(type) as any} 
                                        size={20} 
                                        color={getTypeColor(type)} 
                                    />
                                </View>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={type}
                                        onValueChange={(value) => setType(value)}
                                        style={styles.picker}
                                        enabled={!loading}
                                    >
                                        {notificationTypes.map((type) => (
                                            <Picker.Item
                                                key={type.value}
                                                label={type.label}
                                                value={type.value}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        {/* Title */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tiêu đề *</Text>
                            <TextInput
                                style={[styles.input, errors.title && styles.inputError]}
                                value={title}
                                onChangeText={(text) => {
                                    setTitle(text);
                                    if (errors.title) setErrors({ ...errors, title: '' });
                                }}
                                placeholder="Nhập tiêu đề thông báo"
                                editable={!loading}
                            />
                            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
                        </View>

                        {/* Message */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nội dung *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, errors.message && styles.inputError]}
                                value={message}
                                onChangeText={(text) => {
                                    setMessage(text);
                                    if (errors.message) setErrors({ ...errors, message: '' });
                                }}
                                placeholder="Nhập nội dung thông báo"
                                multiline
                                numberOfLines={5}
                                editable={!loading}
                            />
                            {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
                        </View>

                        {/* Info Box */}
                        {!notification && (
                            <View style={styles.infoBox}>
                                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                                <Text style={styles.infoText}>
                                    Thông báo sẽ được gửi đến tất cả người dùng trong hệ thống
                                </Text>
                            </View>
                        )}
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
                                    {notification ? 'Cập nhật' : 'Gửi thông báo'}
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
        maxHeight: '85%',
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
    typeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingLeft: 12,
    },
    typeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    pickerWrapper: {
        flex: 1,
    },
    picker: {
        height: 50,
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
        height: 120,
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
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#3b82f6',
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
        backgroundColor: '#f59e0b',
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
