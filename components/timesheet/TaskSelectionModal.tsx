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

interface TaskSelectionModalProps {
    isOpen: boolean;
    tasks: MemberTask[];
    searchQuery: string;
    onClose: () => void;
    onSelectTask: (task: MemberTask) => void;
    onSearchChange: (text: string) => void;
}

export const TaskSelectionModal: React.FC<TaskSelectionModalProps> = ({
    isOpen,
    tasks,
    searchQuery,
    onClose,
    onSelectTask,
    onSearchChange,
}) => {
    const filteredTasks = tasks.filter((task) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            task.tentask.toLowerCase().includes(searchLower) ||
            task.project?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.taskSelectionModalOverlay}>
                <View style={styles.taskSelectionModalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn công việc</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm công việc..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={onSearchChange}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => onSearchChange('')}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.taskListContainer}>
                        {filteredTasks.length === 0 ? (
                            <View style={styles.emptyTaskContainer}>
                                <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
                                <Text style={styles.emptyTaskText}>
                                    {searchQuery ? 'Không tìm thấy công việc' : 'Chưa có công việc nào'}
                                </Text>
                            </View>
                        ) : (
                            filteredTasks.map((task) => (
                                <TouchableOpacity
                                    key={task.id}
                                    style={styles.taskItem}
                                    onPress={() => onSelectTask(task)}
                                >
                                    <View style={styles.taskItemHeader}>
                                        <Text style={styles.taskItemTitle}>{task.tentask}</Text>
                                        <View
                                            style={[
                                                styles.taskStatusBadge,
                                                task.trangThai === 'Đang thực hiện' && styles.taskStatusActive,
                                                task.trangThai === 'Hoàn thành' && styles.taskStatusCompleted,
                                                task.trangThai === 'Chờ xác nhận hoàn thành' && styles.taskStatusPending,
                                            ]}
                                        >
                                            <Text style={styles.taskStatusText}>{task.trangThai}</Text>
                                        </View>
                                    </View>
                                    {task.project && (
                                        <View style={styles.taskItemProject}>
                                            <Ionicons name="briefcase" size={14} color="#667eea" />
                                            <Text style={styles.taskItemProjectText}>{task.project}</Text>
                                        </View>
                                    )}
                                    {task.description && (
                                        <Text style={styles.taskItemDescription} numberOfLines={2}>
                                            {task.description}
                                        </Text>
                                    )}
                                    {task.deadline && (
                                        <View style={styles.taskItemFooter}>
                                            <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                                            <Text style={styles.taskItemDeadline}>
                                                {new Date(task.deadline).toLocaleDateString('vi-VN')}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};
