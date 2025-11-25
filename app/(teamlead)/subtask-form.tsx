import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { createSubtask, getMyGroup, getSubtasksByTask, getTaskById, updateSubtask } from '@/src/axios/api';

const STATUSES = ['Chưa bắt đầu', 'Đang chạy', 'Chờ xác nhận hoàn thành', 'Hoàn thành'];

type AssigneeOption = {
    id: number;
    hoten: string;
};

type TaskSummary = {
    id: number;
    tentask: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
};

type SubtaskSummary = {
    id: number;
    tenSubtask?: string;
    mota?: string;
    trangThai?: string;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    nguoiThucHien?: { id?: number; hoten?: string };
    ghiChu?: string;
};

const normalizeDateString = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const formatDateForDisplay = (value?: string) => {
    if (!value) return 'Chưa chọn';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa rõ';
    return date.toLocaleDateString('vi-VN');
};

const buildErrorMessage = (err: any) => {
    if (!err) return 'Đã xảy ra lỗi';
    return (
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        String(err)
    );
};

export default function TeamLeadSubtaskFormScreen() {
    const params = useLocalSearchParams<{
        mode?: string;
        taskId?: string;
        subtaskId?: string;
        taskName?: string;
        subtaskName?: string;
    }>();
    const router = useRouter();

    const rawTaskIdParam = params.taskId as string | string[] | undefined;
    const normalizedTaskIdParam = Array.isArray(rawTaskIdParam) ? rawTaskIdParam[0] : rawTaskIdParam;
    const parsedTaskId = normalizedTaskIdParam ? Number(normalizedTaskIdParam) : NaN;
    const taskId = Number.isFinite(parsedTaskId) ? parsedTaskId : NaN;

    const rawSubtaskIdParam = params.subtaskId as string | string[] | undefined;
    const normalizedSubtaskIdParam = Array.isArray(rawSubtaskIdParam) ? rawSubtaskIdParam[0] : rawSubtaskIdParam;
    const parsedSubtaskId = normalizedSubtaskIdParam ? Number(normalizedSubtaskIdParam) : NaN;
    const subtaskId = Number.isFinite(parsedSubtaskId) ? parsedSubtaskId : NaN;

    const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
    const isEditMode = mode === 'edit' && Number.isFinite(subtaskId);

    const fallbackTaskName = Array.isArray(params.taskName) ? params.taskName[0] : params.taskName;
    const fallbackSubtaskName = Array.isArray(params.subtaskName) ? params.subtaskName[0] : params.subtaskName;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [taskMeta, setTaskMeta] = useState<TaskSummary | null>(null);
    const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>(STATUSES[0]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');
    const [assigneeId, setAssigneeId] = useState<number | null>(null);

    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const selectedAssignee = useMemo(
        () => assigneeOptions.find(item => item.id === assigneeId) || null,
        [assigneeId, assigneeOptions]
    );

    const loadInitialData = useCallback(async () => {
        if (Number.isNaN(taskId)) {
            Alert.alert('Lỗi', 'Thiếu thông tin công việc cha.');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [taskResponse, groupResponse, subtaskList] = await Promise.all([
                getTaskById(taskId),
                getMyGroup().catch(() => null),
                isEditMode ? getSubtasksByTask(taskId) : Promise.resolve(null)
            ]);

            const rawSubtaskResponse: any = subtaskList;

            const detail = taskResponse?.task || taskResponse || {};
            setTaskMeta({
                id: detail?.id,
                tentask: detail?.tentask || detail?.ten || fallbackTaskName || 'Công việc',
                ngayBatDau: detail?.ngayBatDau,
                ngayKetThuc: detail?.ngayKetThuc
            });

            const members: AssigneeOption[] = [];
            const rawMembers = groupResponse?.members || groupResponse?.Members || [];
            const leaderCandidate = groupResponse?.leader || groupResponse?.GroupLeader;
            const seen = new Set<number>();

            if (leaderCandidate?.id) {
                seen.add(Number(leaderCandidate.id));
                members.push({ id: Number(leaderCandidate.id), hoten: leaderCandidate.hoten || 'Trưởng nhóm' });
            }

            if (Array.isArray(rawMembers)) {
                rawMembers.forEach((member: any) => {
                    const memberId = member?.id || member?.userId;
                    if (!memberId) return;
                    const numericId = Number(memberId);
                    if (Number.isNaN(numericId) || seen.has(numericId)) return;
                    seen.add(numericId);
                    members.push({ id: numericId, hoten: member.hoten || member.name || `Thành viên ${numericId}` });
                });
            }

            setAssigneeOptions(members);

            if (isEditMode && rawSubtaskResponse) {
                const list = rawSubtaskResponse?.subtasks || rawSubtaskResponse?.data?.subtasks || rawSubtaskResponse;
                const found = Array.isArray(list)
                    ? list.find((item: any) => Number(item.id) === subtaskId)
                    : null;

                if (found) {
                    const normalized: SubtaskSummary = {
                        id: found.id,
                        tenSubtask: found.tenSubtask || found.ten,
                        mota: found.mota,
                        trangThai: found.trangThai,
                        ngayBatDau: found.ngayBatDau,
                        ngayKetThuc: found.ngayKetThuc,
                        nguoiThucHien: found.nguoiThucHien || found.assignee,
                        ghiChu: found.ghiChu
                    };
                    setTitle(normalized.tenSubtask || fallbackSubtaskName || '');
                    setDescription(normalized.mota || '');
                    setStatus(normalized.trangThai && STATUSES.includes(normalized.trangThai) ? normalized.trangThai : STATUSES[0]);
                    setStartDate(normalizeDateString(normalized.ngayBatDau));
                    setEndDate(normalizeDateString(normalized.ngayKetThuc));
                    setNotes(normalized.ghiChu || '');
                    if (normalized.nguoiThucHien?.id) {
                        setAssigneeId(Number(normalized.nguoiThucHien.id));
                    }
                } else {
                    Alert.alert('Thông báo', 'Không tìm thấy công việc con cần chỉnh sửa.');
                }
            }

            if (!isEditMode) {
                setTitle('');
                setDescription('');
                setStatus(STATUSES[0]);
                setStartDate('');
                setEndDate('');
                setNotes('');
                setAssigneeId(null);
            }
        } catch (error) {
            console.error('Load subtask form data error:', error);
            Alert.alert('Lỗi', buildErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [fallbackSubtaskName, fallbackTaskName, isEditMode, subtaskId, taskId]);

    useFocusEffect(
        useCallback(() => {
            loadInitialData();
        }, [loadInitialData])
    );

    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên công việc con.');
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mô tả công việc con.');
            return false;
        }
        if (!startDate) {
            Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu.');
            return false;
        }
        // Assignee is optional: allow creating subtask without selecting a person
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;
        if (end && start > end) {
            Alert.alert('Lỗi', 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
            return false;
        }
        if (taskMeta?.ngayBatDau) {
            const taskStart = new Date(taskMeta.ngayBatDau);
            if (!Number.isNaN(taskStart.getTime()) && start < taskStart) {
                Alert.alert('Lỗi', 'Ngày bắt đầu của công việc con phải không sớm hơn công việc cha.');
                return false;
            }
        }
        if (taskMeta?.ngayKetThuc && end) {
            const taskDue = new Date(taskMeta.ngayKetThuc);
            if (!Number.isNaN(taskDue.getTime()) && end > taskDue) {
                Alert.alert('Lỗi', 'Ngày kết thúc của công việc con phải trước ngày kết thúc của công việc cha.');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (Number.isNaN(taskId)) {
            Alert.alert('Lỗi', 'Thiếu thông tin công việc cha.');
            return;
        }
        if (isEditMode && Number.isNaN(subtaskId)) {
            Alert.alert('Lỗi', 'Thiếu thông tin công việc con.');
            return;
        }
        if (!validateForm()) return;

        const payload: Record<string, any> = {
            tenSubtask: title.trim(),
            mota: description.trim(),
            ngayBatDau: startDate,
            ngayKetThuc: endDate || undefined,
            ghiChu: notes.trim() || undefined,
            trangThai: status
        };

        // Only include assignee if one is chosen
        if (assigneeId) payload.nguoiThucHienId = assigneeId;

        setSubmitting(true);
        try {
            if (isEditMode) {
                await updateSubtask(taskId, subtaskId, payload);
                Alert.alert('Thành công', 'Đã cập nhật công việc con.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                const createPayload = {
                    tenSubtask: payload.tenSubtask,
                    mota: payload.mota,
                    ngayBatDau: payload.ngayBatDau,
                    ngayKetThuc: payload.ngayKetThuc,
                    ghiChu: payload.ghiChu,
                    ...(payload.nguoiThucHienId ? { nguoiThucHienId: payload.nguoiThucHienId } : {})
                };
                await createSubtask(taskId, createPayload);
                Alert.alert('Thành công', 'Đã tạo công việc con mới.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('Submit subtask form error:', error);
            Alert.alert('Lỗi', buildErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    const cycleStatus = () => {
        const currentIndex = STATUSES.indexOf(status);
        const next = STATUSES[(currentIndex + 1) % STATUSES.length];
        setStatus(next);
    };

    const renderDatePicker = (
        show: boolean,
        currentValue: string,
        onClose: () => void,
        onChange: (value: string) => void
    ) => {
        if (!show) return null;
        const dateInstance = currentValue ? new Date(currentValue) : new Date();
        return (
            <DateTimePicker
                value={Number.isNaN(dateInstance.getTime()) ? new Date() : dateInstance}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                    if (Platform.OS !== 'ios') {
                        onClose();
                    }
                    if (selectedDate) {
                        onChange(selectedDate.toISOString().split('T')[0]);
                    }
                }}
            />
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.helperText}>Đang tải dữ liệu...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isEditMode ? 'Chỉnh sửa công việc con' : 'Tạo công việc con'}</Text>
                    <Text style={styles.sectionSubtitle}>
                        Công việc cha: {taskMeta?.tentask || fallbackTaskName || 'Chưa rõ'}
                    </Text>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Tiêu đề</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập tên công việc con"
                        placeholderTextColor="#9ca3af"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Mô tả</Text>
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        placeholder="Nhập mô tả"
                        placeholderTextColor="#9ca3af"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Trạng thái</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setShowStatusPicker(prev => !prev)}
                    >
                        <Text style={styles.selectorValue}>{status}</Text>
                        <Ionicons
                            name={showStatusPicker ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#7c3aed"
                        />
                    </TouchableOpacity>
                    {showStatusPicker ? (
                        <View style={styles.optionList}>
                            {STATUSES.map(item => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.optionItem, item === status && styles.optionItemActive]}
                                    onPress={() => {
                                        setStatus(item);
                                        setShowStatusPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            item === status && styles.optionTextActive
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    cycleStatus();
                                    setShowStatusPicker(false);
                                }}
                            >
                                <Text style={styles.optionText}>Chuyển sang trạng thái tiếp theo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>

                <View style={styles.rowFields}>
                    <View style={[styles.fieldGroup, styles.rowItem]}>
                        <Text style={styles.label}>Ngày bắt đầu</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowStartPicker(prev => !prev)}
                        >
                            <Text style={styles.selectorValue}>{formatDateForDisplay(startDate)}</Text>
                            <Ionicons name="calendar" size={18} color="#7c3aed" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.fieldGroup, styles.rowItem]}>
                        <Text style={styles.label}>Ngày kết thúc</Text>
                        <TouchableOpacity
                            style={styles.selector}
                            onPress={() => setShowEndPicker(prev => !prev)}
                        >
                            <Text style={styles.selectorValue}>
                                {endDate ? formatDateForDisplay(endDate) : 'Chưa chọn'}
                            </Text>
                            <Ionicons name="calendar" size={18} color="#7c3aed" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Người thực hiện</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setShowAssigneePicker(prev => !prev)}
                    >
                        <Text style={styles.selectorValue}>
                            {selectedAssignee?.hoten || 'Chọn thành viên phụ trách (không bắt buộc)'}
                        </Text>
                        <Ionicons
                            name={showAssigneePicker ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#7c3aed"
                        />
                    </TouchableOpacity>
                    {showAssigneePicker ? (
                        <View style={styles.optionList}>
                            <TouchableOpacity
                                style={[styles.optionItem, !assigneeId && styles.optionItemActive]}
                                onPress={() => {
                                    setAssigneeId(null);
                                    setShowAssigneePicker(false);
                                }}
                            >
                                <Text style={[styles.optionText, !assigneeId && styles.optionTextActive]}>Không gán (mở cho nhóm yêu cầu nhận việc)</Text>
                            </TouchableOpacity>
                            {assigneeOptions.map(option => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionItem,
                                        option.id === assigneeId && styles.optionItemActive
                                    ]}
                                    onPress={() => {
                                        setAssigneeId(option.id);
                                        setShowAssigneePicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            option.id === assigneeId && styles.optionTextActive
                                        ]}
                                    >
                                        {option.hoten}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Ghi chú</Text>
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        placeholder="Thông tin bổ sung (không bắt buộc)"
                        placeholderTextColor="#9ca3af"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {isEditMode ? 'Lưu thay đổi' : 'Tạo công việc con'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {renderDatePicker(showStartPicker, startDate, () => setShowStartPicker(false), setStartDate)}
            {renderDatePicker(showEndPicker, endDate, () => setShowEndPicker(false), setEndDate)}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    centered: {
        flex: 1,
        backgroundColor: '#f5f5ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        padding: 20,
        paddingBottom: 40
    },
    helperText: {
        marginTop: 12,
        color: '#6b7280'
    },
    section: {
        marginBottom: 18
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#312e81'
    },
    sectionSubtitle: {
        marginTop: 6,
        color: '#6b7280'
    },
    fieldGroup: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4338ca',
        marginBottom: 8
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e0e7ff',
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#111827'
    },
    multiline: {
        minHeight: 100,
        lineHeight: 20
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e0e7ff',
        paddingHorizontal: 14,
        paddingVertical: 12
    },
    selectorValue: {
        color: '#111827'
    },
    optionList: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e7ff',
        paddingVertical: 6
    },
    optionItem: {
        paddingHorizontal: 14,
        paddingVertical: 10
    },
    optionItemActive: {
        backgroundColor: '#ede9fe'
    },
    optionText: {
        color: '#374151'
    },
    optionTextActive: {
        color: '#5b21b6',
        fontWeight: '600'
    },
    rowFields: {
        flexDirection: 'row',
        gap: 12
    },
    rowItem: {
        flex: 1
    },
    submitButton: {
        backgroundColor: '#7c3aed',
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10
    },
    submitButtonDisabled: {
        opacity: 0.7
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    }
});
