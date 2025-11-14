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
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../src/axios/config';

interface User {
    id: number;
    manv: string;
    hoten: string;
}

interface ProjectFormData {
    id?: number;
    tenduan: string;
    mota: string;
    ngaybatdau: Date;
    ngayketthuc: Date;
    userId: number;
    status: string;
}

interface Props {
    visible: boolean;
    project: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProjectFormModal({ visible, project, onClose, onSuccess }: Props) {
    const [formData, setFormData] = useState<ProjectFormData>({
        tenduan: '',
        mota: '',
        ngaybatdau: new Date(),
        ngayketthuc: new Date(),
        userId: 0,
        status: 'chua_bat_dau',
    });
    const [managers, setManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            loadManagers();
            if (project) {
                setFormData({
                    id: project.id,
                    tenduan: project.tenduan || '',
                    mota: project.mota || '',
                    ngaybatdau: project.ngaybatdau ? new Date(project.ngaybatdau) : new Date(),
                    ngayketthuc: project.ngayketthuc ? new Date(project.ngayketthuc) : new Date(),
                    userId: project.userId || project.nguoiDamNhan?.id || 0,
                    status: project.status || 'chua_bat_dau',
                });
            } else {
                resetForm();
            }
        }
    }, [visible, project]);

    const loadManagers = async () => {
        try {
            const response = await api.get('/users');
            const users = response.data.users || response.data || [];
            // Filter managers and admins
            setManagers(users.filter((u: any) => 
                u.role?.name === 'manager' || u.role?.name === 'admin'
            ));
        } catch (error) {
            console.error('Error loading managers:', error);
        }
    };

    const resetForm = () => {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        setFormData({
            tenduan: '',
            mota: '',
            ngaybatdau: today,
            ngayketthuc: nextMonth,
            userId: 0,
            status: 'chua_bat_dau',
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.tenduan.trim()) {
            newErrors.tenduan = 'Tên dự án không được để trống';
        }

        if (!formData.userId) {
            newErrors.userId = 'Vui lòng chọn người phụ trách';
        }

        if (formData.ngayketthuc <= formData.ngaybatdau) {
            newErrors.ngayketthuc = 'Ngày kết thúc phải sau ngày bắt đầu';
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
            const payload = {
                tenduan: formData.tenduan.trim(),
                mota: formData.mota.trim(),
                ngaybatdau: formData.ngaybatdau.toISOString().split('T')[0],
                ngayketthuc: formData.ngayketthuc.toISOString().split('T')[0],
                userId: formData.userId,
                status: formData.status,
            };

            if (project) {
                await api.put(`/duan/update/${project.id}`, payload);
                Alert.alert('Thành công', 'Đã cập nhật dự án');
            } else {
                await api.post('/duan/create', payload);
                Alert.alert('Thành công', 'Đã tạo dự án mới');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving project:', error);
            const errorMsg = error.response?.data?.message || 'Không thể lưu dự án';
            Alert.alert('Lỗi', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('vi-VN');
    };

    const statusOptions = [
        { label: 'Chưa bắt đầu', value: 'chua_bat_dau' },
        { label: 'Đang thực hiện', value: 'dang_chay' },
        { label: 'Hoàn thành', value: 'hoan_thanh' },
        { label: 'Tạm dừng', value: 'tam_dung' },
        { label: 'Hủy bỏ', value: 'huy_bo' },
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
                            {project ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {/* Tên dự án */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Tên dự án <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, errors.tenduan && styles.inputError]}
                                value={formData.tenduan}
                                onChangeText={(text) => setFormData({ ...formData, tenduan: text })}
                                placeholder="Nhập tên dự án"
                            />
                            {errors.tenduan && <Text style={styles.errorText}>{errors.tenduan}</Text>}
                        </View>

                        {/* Mô tả */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mô tả</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.mota}
                                onChangeText={(text) => setFormData({ ...formData, mota: text })}
                                placeholder="Nhập mô tả dự án"
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        {/* Người phụ trách */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>
                                Người phụ trách <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={[styles.pickerContainer, errors.userId && styles.inputError]}>
                                <Picker
                                    selectedValue={formData.userId}
                                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Chọn người phụ trách" value={0} />
                                    {managers.map((user) => (
                                        <Picker.Item 
                                            key={user.id} 
                                            label={`${user.hoten} (${user.manv})`} 
                                            value={user.id} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                            {errors.userId && <Text style={styles.errorText}>{errors.userId}</Text>}
                        </View>

                        {/* Ngày bắt đầu */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Ngày bắt đầu</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowStartDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                <Text style={styles.dateText}>{formatDate(formData.ngaybatdau)}</Text>
                            </TouchableOpacity>
                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={formData.ngaybatdau}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowStartDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setFormData({ ...formData, ngaybatdau: selectedDate });
                                        }
                                    }}
                                />
                            )}
                        </View>

                        {/* Ngày kết thúc */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Ngày kết thúc</Text>
                            <TouchableOpacity
                                style={[styles.dateInput, errors.ngayketthuc && styles.inputError]}
                                onPress={() => setShowEndDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                <Text style={styles.dateText}>{formatDate(formData.ngayketthuc)}</Text>
                            </TouchableOpacity>
                            {errors.ngayketthuc && <Text style={styles.errorText}>{errors.ngayketthuc}</Text>}
                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={formData.ngayketthuc}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowEndDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setFormData({ ...formData, ngayketthuc: selectedDate });
                                        }
                                    }}
                                />
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
                                    {project ? 'Cập nhật' : 'Tạo mới'}
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
        minHeight: 100,
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
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    dateText: {
        fontSize: 16,
        color: '#1f2937',
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
