import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../../../src/axios/config';

interface User {
    id: number;
    manv: string;
    hoten: string;
    // `role` can be either a string or an object { id, name }
    role?: string | { id?: number; name?: string };
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
    const [availableLeaders, setAvailableLeaders] = useState<User[]>([]);
    const [availableMembers, setAvailableMembers] = useState<User[]>([]);

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

    // Filter available users when users list or group changes
    useEffect(() => {
        if (users.length > 0) {
            filterAvailableUsers();
        }
    }, [users, group]);

    // Helper: get current leader user from loaded users so we can show them in the Picker
    const currentLeaderUser = users.find(u => u.id === formData.leaderId);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.users || response.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    // Filter users based on business rules
    const filterAvailableUsers = async () => {
        try {
            const resp = await api.get('/groups');
            const groups: any[] = resp.data.groups || [];

            // Build map of user participation in active groups
            const leaderOfGroup = new Map<number, string>(); // userId -> groupName
            const memberGroupCounts = new Map<number, number>(); // userId -> count of active groups

            for (const g of groups) {
                if (g.status === 'closed') continue;
                
                // Skip current group when editing
                if (group && String(g.id) === String(group.id)) continue;

                // Track leaders
                if (g.leader && g.leader.id) {
                    leaderOfGroup.set(g.leader.id, g.name);
                }

                // Track member participation
                const seen = new Set<number>();
                if (g.leader && g.leader.id) seen.add(g.leader.id);
                const memberList = g.members || [];
                for (const m of memberList) {
                    if (m && m.id) seen.add(m.id);
                }
                for (const uid of Array.from(seen)) {
                    memberGroupCounts.set(uid, (memberGroupCounts.get(uid) || 0) + 1);
                }
            }

            // Filter available leaders (teamleader role + not already a leader of another active group)
            const leaders = users.filter(u => {
                const rname = getRoleName(u);
                if (rname !== 'teamleader') return false;
                
                // If editing and this is the current leader, allow them
                if (group && group.leaderId === u.id) return true;
                if (group && group.leader?.id === u.id) return true;
                
                // Don't show if they're already a leader of another group
                if (leaderOfGroup.has(u.id)) return false;
                
                return true;
            });

            // Filter available members (employee role + not at max groups + not a leader elsewhere)
            const members = users.filter(u => {
                const rname = getRoleName(u);
                if (rname !== 'employee') return false;
                
                // Don't show if they're a leader of another group
                if (leaderOfGroup.has(u.id)) return false;
                
                // Check group participation count
                const count = memberGroupCounts.get(u.id) || 0;
                if (count >= 2) return false;
                
                return true;
            });

            setAvailableLeaders(leaders);
            setAvailableMembers(members);
        } catch (error) {
            console.error('Error filtering users:', error);
            // Fallback to basic role filtering
            setAvailableLeaders(users.filter(u => getRoleName(u) === 'teamleader'));
            setAvailableMembers(users.filter(u => getRoleName(u) === 'employee'));
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
        setFormData(prev => {
            const next = {
                ...prev,
                memberIds: prev.memberIds.includes(userId)
                    ? prev.memberIds.filter(id => id !== userId)
                    : [...prev.memberIds, userId]
            };
            console.log('DEBUG group toggleMember -> memberIds:', next.memberIds);
            return next;
        });
    };

    const getRoleName = (u?: User) => {
        if (!u) return undefined;
        if (!u.role) return undefined;
        if (typeof u.role === 'string') return u.role;
        return (u.role as any).name;
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
                // Prepare memberIds (remove leader if present) and filter invalid ones before sending
                const intendedMemberIds = (formData.memberIds || []).filter(id => id !== formData.leaderId);
                let finalMemberIds = intendedMemberIds;
                let skippedFromFilter = 0;
                let skippedDetails: Array<{ id: number; name: string; reason: string }> = [];
                try {
                    const { filtered, removed } = await filterMemberIdsForAdd(intendedMemberIds, group.id, formData.leaderId);
                    finalMemberIds = filtered;
                    skippedDetails = removed || [];
                    skippedFromFilter = skippedDetails.length || 0;
                    if (skippedFromFilter > 0) console.log('DEBUG group filter removed (update):', removed);
                } catch (e) {
                    console.error('Filtering failed before update:', e);
                    Alert.alert('Lỗi', 'Không thể thêm thành viên');
                    setLoading(false);
                    return;
                }

                // Update group basic info including the desired memberIds so backend can sync removals/adds
                const updatePayload = {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    leaderId: formData.leaderId,
                    memberIds: finalMemberIds
                };
                console.log('DEBUG group update payload:', updatePayload);
                const updateResponse = await api.put(`/groups/${group.id}`, updatePayload);
                console.log('✅ Group updated:', updateResponse.data);

                // Handle status change (close) first. If closing fails, report error and stop.
                if (formData.status === 'closed') {
                    try {
                        await api.patch(`/groups/${group.id}/close`);
                        console.log('✅ Group closed');
                    } catch (closeError: any) {
                        console.error('Error closing group:', closeError);
                        const closeErrorMsg = closeError.response?.data?.message || 'Không thể đóng nhóm';
                        Alert.alert('Lỗi', closeErrorMsg);
                        setLoading(false);
                        return;
                    }
                }

                // Verify members were actually persisted. If some requested memberIds are missing,
                // show a concise partial-failure message (no long lists).
                try {
                    const returnedMemberIds: number[] = (updateResponse.data.group?.members || []).map((m: any) => m.id);
                    const missing = finalMemberIds.filter(id => !returnedMemberIds.includes(id));
                    if (missing.length > 0 || skippedFromFilter > 0) {
                        console.log('DEBUG group update missing members:', missing);
                        const missingNames = missing.map(id => users.find(u => u.id === id)?.hoten || String(id));
                        const skippedNames = skippedDetails.map(s => s.name).filter(Boolean) as string[];
                        const allNames = [...skippedNames, ...missingNames];
                        if (allNames.length > 0) {
                            const namesText = allNames.slice(0, 5).join(', ') + (allNames.length > 5 ? ` và ${allNames.length - 5} người khác` : '');
                            Alert.alert('Cập nhật thành công', `Một số thành viên không được thêm: ${namesText}`);
                        } else {
                            Alert.alert('Cập nhật thành công', 'Một số thành viên không được thêm');
                        }
                    } else {
                        Alert.alert('Thành công', 'Đã cập nhật nhóm và thành viên');
                    }
                } catch (e) {
                    console.error('Error verifying updated members:', e);
                    Alert.alert('Thành công', 'Đã cập nhật nhóm');
                }

                onSuccess();
                onClose();
            } else {
                // Create new group
                // For create: include memberIds in the create payload so backend will sync members on create
                const intendedMemberIds = (formData.memberIds || []).filter(id => id !== formData.leaderId);
                let skippedFromFilter = 0;
                let skippedDetails: Array<{ id: number; name: string; reason: string }> = [];
                try {
                    const { filtered, removed } = await filterMemberIdsForAdd(intendedMemberIds, null, formData.leaderId);
                    (payload as any).memberIds = filtered;
                    skippedDetails = removed || [];
                    skippedFromFilter = skippedDetails.length || 0;
                    if (skippedFromFilter > 0) console.log('DEBUG group filter removed (create):', removed);
                } catch (e) {
                    console.error('Filtering failed before create:', e);
                    Alert.alert('Lỗi', 'Không thể thêm thành viên');
                    setLoading(false);
                    return;
                }

                console.log('DEBUG group create payload:', payload);
                const response = await api.post('/groups', payload);
                const groupId = response.data.id || response.data.group?.id;

                // Verify created group's members vs requested memberIds
                try {
                    const returnedMemberIds: number[] = (response.data.group?.members || []).map((m: any) => m.id);
                    const requested: number[] = (payload as any).memberIds || [];
                    const missing = requested.filter((id: number) => !returnedMemberIds.includes(id));
                    if (missing.length > 0 || skippedFromFilter > 0) {
                        console.log('DEBUG group create missing members:', missing);
                        const missingNames = missing.map(id => users.find(u => u.id === id)?.hoten || String(id));
                        const skippedNames = skippedDetails.map(s => s.name).filter(Boolean) as string[];
                        const allNames = [...skippedNames, ...missingNames];
                        if (allNames.length > 0) {
                            const namesText = allNames.slice(0, 5).join(', ') + (allNames.length > 5 ? ` và ${allNames.length - 5} người khác` : '');
                            Alert.alert('Đã tạo nhóm', `Một số thành viên không được thêm: ${namesText}`);
                        } else {
                            Alert.alert('Đã tạo nhóm', 'Một số thành viên không được thêm');
                        }
                    } else {
                        Alert.alert('Thành công', 'Đã tạo nhóm mới');
                    }
                } catch (e) {
                    console.error('Error verifying created members:', e);
                    Alert.alert('Thành công', 'Đã tạo nhóm mới');
                }

                onSuccess();
                onClose();
            }

            
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

    // Helper: filter memberIds before sending to server
    // - removes the leader id if present
    // - removes users who already participate in >=2 active groups
    // Returns { filtered: number[], removed: { id, name, reason }[] }
    async function filterMemberIdsForAdd(candidateIds: number[], targetGroupId: number | string | null, leaderId: number): Promise<{ filtered: number[]; removed: { id: number; name: string; reason: string }[] }> {
        try {
            const resp = await api.get('/groups');
            const groups: any[] = resp.data.groups || [];

            // Build counts map userId -> activeGroupCount (exclude closed groups)
            const counts = new Map<number, number>();
            for (const g of groups) {
                // skip closed groups
                if (g.status === 'closed') continue;
                // If we're computing counts for an update, exclude the target group itself
                // so that current members of this group are not counted against the "max 2 groups" rule.
                if (targetGroupId != null && String(g.id) === String(targetGroupId)) continue;

                const seen = new Set<number>();
                if (g.leader && g.leader.id) seen.add(g.leader.id);
                const memberList = g.members || [];
                for (const m of memberList) {
                    if (m && m.id) seen.add(m.id);
                }
                for (const uid of Array.from(seen)) {
                    counts.set(uid, (counts.get(uid) || 0) + 1);
                }
            }

            const removed: Array<{ id: number; name: string; reason: string }> = [];
            const filtered: number[] = [];

            for (const id of candidateIds) {
                // If candidate id is the leader, during create we mark it as removed
                // because leader should not be in members. During update (targetGroupId != null)
                // we silently ignore leader entries since we're editing the group where
                // that user may already be the leader.
                if (id === leaderId) {
                    if (targetGroupId == null) {
                        const user = users.find(u => u.id === id);
                        removed.push({ id, name: user ? user.hoten : String(id), reason: 'Là trưởng nhóm' });
                    }
                    // skip adding leader to filtered members in both create and update
                    continue;
                }

                const user = users.find(u => u.id === id);
                const rname = getRoleName(user);
                if (!user || rname !== 'employee') {
                    removed.push({ id, name: user ? user.hoten : String(id), reason: 'Không phải nhân viên' });
                    continue;
                }

                const currentCount = counts.get(id) || 0;
                // Allow add only if currentCount < 2
                if (currentCount >= 2) {
                    removed.push({ id, name: user ? user.hoten : String(id), reason: 'Đã tham gia tối đa 2 nhóm' });
                    continue;
                }

                filtered.push(id);
            }

            return { filtered, removed };
        } catch (e) {
            console.error('Error filtering memberIds:', e);
            // Throw so caller knows filtering failed and avoids sending unvalidated ids to backend
            throw new Error('filter_failed');
        }
    }

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
                            <Text style={styles.helperText}>
                                Chỉ hiển thị teamleader chưa làm trưởng nhóm khác
                            </Text>
                            <View style={[styles.pickerContainer, errors.leaderId && styles.inputError]}>
                                <Picker
                                    selectedValue={formData.leaderId}
                                    onValueChange={(value) => setFormData({ ...formData, leaderId: value })}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Chọn trưởng nhóm" value={0} />
                                    {/* If the current leader is loaded but no longer has role 'manager', show them first so they stay selectable */}
                                    {currentLeaderUser && getRoleName(currentLeaderUser) !== 'teamleader' && (
                                        <Picker.Item
                                            key={`leader-${currentLeaderUser.id}`}
                                            label={`${currentLeaderUser.hoten} (${currentLeaderUser.manv})`}
                                            value={currentLeaderUser.id}
                                        />
                                    )}
                                    {availableLeaders.map((user) => (
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
                            <Text style={styles.label}>
                                Thành viên ({formData.memberIds.length}/{availableMembers.filter(u => u.id !== formData.leaderId).length})
                            </Text>
                            <Text style={styles.helperText}>
                                Chỉ hiển thị nhân viên chưa tham gia 2 nhóm và không là trưởng nhóm khác
                            </Text>
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
                                <ScrollView
                                    style={styles.memberList}
                                    nestedScrollEnabled={true}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {availableMembers
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
                                    {availableMembers.filter(u => u.id !== formData.leaderId).length === 0 && (
                                        <View style={styles.emptyMemberList}>
                                            <Text style={styles.emptyMemberText}>
                                                Không có thành viên khả dụng
                                            </Text>
                                            <Text style={styles.emptyMemberSubtext}>
                                                (Các nhân viên đã tham gia tối đa 2 nhóm hoặc đang là trưởng nhóm khác)
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
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
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
        fontStyle: 'italic',
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
        backgroundColor: '#fff',
        zIndex: 10,
        elevation: 10,
        paddingVertical: 4,
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
    emptyMemberList: {
        padding: 20,
        alignItems: 'center',
    },
    emptyMemberText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 4,
    },
    emptyMemberSubtext: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
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
