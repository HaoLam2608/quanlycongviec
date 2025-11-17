import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { styles } from '../../app/(tabs)/member-timesheet/index.styles';
import { MemberTask } from '../../types/member';

interface WorklogFormModalProps {
    isOpen: boolean;
    isEditMode: boolean;
    formData: {
        taskId: string;
        subtaskId: string;
        hours: string;
        description: string;
    };
    tasks: MemberTask[];
    onClose: () => void;
    onSubmit: () => void;
    onFormChange: (field: string, value: string) => void;
    onSelectTask: () => void;
}

export const WorklogFormModal: React.FC<WorklogFormModalProps> = ({
    isOpen,
    isEditMode,
    formData,
    tasks,
    onClose,
    onSubmit,
    onFormChange,
    onSelectTask,
}) => {
    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditMode ? 'Chỉnh sửa worklog' : 'Tạo worklog mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Công việc *</Text>
                            <TouchableOpacity style={styles.input} onPress={onSelectTask}>
                                <Text style={styles.inputText}>
                                    {formData.subtaskId
                                        ? tasks.find(t => t.id.toString() === formData.subtaskId)?.tentask || 'Chọn công việc'
                                        : 'Chọn công việc'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Thời gian (HH:MM:SS) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ví dụ: 02:30:00"
                                placeholderTextColor="#9CA3AF"
                                value={formData.hours}
                                onChangeText={(text) => onFormChange('hours', text)}
                                keyboardType="default"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Mô tả công việc *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Nhập mô tả chi tiết..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.description}
                                onChangeText={(text) => onFormChange('description', text)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
                            <Text style={styles.submitButtonText}>
                                {isEditMode ? 'Cập nhật' : 'Tạo mới'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};
