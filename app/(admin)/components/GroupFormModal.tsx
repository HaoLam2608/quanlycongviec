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
    const [groupCounts, setGroupCounts] = useState<Record<number, number>>({});
    const [leaderActiveMap, setLeaderActiveMap] = useState<Record<number, boolean>>({});
    const [excludedMembers, setExcludedMembers] = useState<Array<{ id: number; name: string; reason: string }>>([]);
    const [showExcludedMembers, setShowExcludedMembers] = useState(false);
    const [excludedLeaders, setExcludedLeaders] = useState<Array<{ id: number; name: string; reason: string }>>([]);
    const [showExcludedLeaders, setShowExcludedLeaders] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [prereqErrors, setPrereqErrors] = useState<string[]>([]);
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
            // clear prereq errors when modal opens
            setPrereqErrors([]);
            // compute group participation stats used to filter leaders/members in selectors
            computeGroupParticipationStats(group?.id ?? null).catch(e => console.error('compute stats failed', e));
        }
    }, [visible, group]);

    // Re-check prerequisites when leader changes
    useEffect(() => {
        if (!visible) return;
        if (formData.leaderId) checkLeaderPrerequisites(formData.leaderId);
    }, [formData.leaderId]);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.users || response.data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    // Compute how many active groups each user participates in and which users are active leaders
    const computeGroupParticipationStats = async (currentGroupId: number | null) => {
        try {
            const resp = await api.get('/groups');
            const groups: any[] = resp.data.groups || [];

            const counts: Record<number, number> = {};
            const leaderMap: Record<number, boolean> = {};

            for (const g of groups) {
                // skip closed groups
                if (g.status === 'closed') continue;
                // Count leader
                if (g.leader && g.leader.id) {
                    // If editing, ignore the current group when counting so current leader isn't blocked
                    if (currentGroupId == null || String(g.id) !== String(currentGroupId)) {
                        leaderMap[g.leader.id] = true;
                    }
                }
                // Count members
                const seen = new Set<number>();
                if (g.leader && g.leader.id) seen.add(g.leader.id);
                const memberList = g.members || [];
                for (const m of memberList) {
                    if (m && m.id) seen.add(m.id);
                }
                for (const uid of Array.from(seen)) {
                    // If editing, exclude current group's counts for fairness
                    if (currentGroupId != null && String(g.id) === String(currentGroupId)) continue;
                    counts[uid] = (counts[uid] || 0) + 1;
                }
            }

            setGroupCounts(counts);
            setLeaderActiveMap(leaderMap);

            // build excluded lists for UI (members and leaders)
            const exclMembers: Array<{ id: number; name: string; reason: string }> = [];
            const exclLeads: Array<{ id: number; name: string; reason: string }> = [];
            // For members: if count >=2 and not already member of current group
            for (const u of (users || [])) {
                const cnt = counts[u.id] || 0;
                const alreadyMember = group && Array.isArray(group.members) && group.members.some((m:any)=>m.id===u.id);
                if (cnt >= 2 && !alreadyMember && getRoleName(u) === 'employee') {
                    exclMembers.push({ id: u.id, name: u.hoten || String(u.id), reason: 'Đã tham gia >= 2 nhóm' });
                }
                // For leaders: if manager but leaderActiveMap true and not current leader
                if (getRoleName(u) === 'manager') {
                    if (leaderMap[u.id] && !(group && group.leaderId === u.id)) {
                        exclLeads.push({ id: u.id, name: u.hoten || String(u.id), reason: 'Đang là trưởng nhóm khác' });
                    }
                }
            }
            setExcludedMembers(exclMembers);
            setExcludedLeaders(exclLeads);
        } catch (e) {
            console.error('Error computing group participation stats:', e);
            setGroupCounts({});
            setLeaderActiveMap({});
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
        return Object.keys(newErrors).length === 0 && prereqErrors.length === 0;
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
        // ensure leader prerequisites are OK before proceeding
        const leaderProblems = await checkLeaderPrerequisites(formData.leaderId);
        if (leaderProblems && leaderProblems.length > 0) {
            Alert.alert('Không thể tạo/ cập nhật nhóm', leaderProblems.join('\n'));
            return;
        }

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
                if (id === leaderId) {
                    const user = users.find(u => u.id === id);
                    removed.push({ id, name: user ? user.hoten : String(id), reason: 'Là trưởng nhóm' });
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

    // Check server-side prerequisites for leader before creating/updating group
    const checkLeaderPrerequisites = async (leaderId: number) => {
        const msgs: string[] = [];
        if (!leaderId) {
            setPrereqErrors(msgs);
            return msgs;
        }

        try {
            const resp = await api.get('/groups');
            const groups: any[] = resp.data.groups || [];

            // 1) Check if leader already leads an active group
            const existingLeaderGroup = groups.find(g => g.leader && g.leader.id === leaderId && g.status !== 'closed');
            if (existingLeaderGroup) {
                msgs.push(`Người này đã là trưởng nhóm của nhóm "${existingLeaderGroup.name}"`);
            }

            // 2) Check if leader is already member of an active group
            const memberGroup = groups.find(g => (Array.isArray(g.members) && g.members.some((m:any)=>m.id===leaderId)) && g.status !== 'closed');
            if (memberGroup) {
                msgs.push(`Người này đang là thành viên của nhóm "${memberGroup.name}"`);
            }

            // 3) (Optional) Check leader role (ensure selected user is manager)
            const leader = users.find(u => u.id === leaderId);
            const roleName = getRoleName(leader);
            if (roleName && roleName !== 'manager') {
                msgs.push('Người được chọn không phải là trưởng nhóm (vai trò không phù hợp)');
            }
        } catch (e) {
            console.error('Error checking leader prerequisites:', e);
            // don't block creation on fetch error, but warn
            msgs.push('Không thể kiểm tra điều kiện nhóm (lỗi kết nối)');
        }

        setPrereqErrors(msgs);
        return msgs;
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
                                    {(() => {
                                        const leaderOptions = users
                                            .filter(u => getRoleName(u) === 'manager')
                                            .filter(u => {
                                                if (u.id === formData.leaderId) return true;
                                                return !leaderActiveMap[u.id];
                                            });

                                        if (!leaderOptions || leaderOptions.length === 0) {
                                            return <Picker.Item label="Không có trưởng nhóm hợp lệ" value={0} />;
                                        }

                                        return leaderOptions.map((user) => (
                                            <Picker.Item 
                                                key={user.id} 
                                                label={`${user.hoten} (${user.manv})`} 
                                                value={user.id} 
                                            />
                                        ));
                                    })()}
                                </Picker>
                            </View>
                                {errors.leaderId && <Text style={styles.errorText}>{errors.leaderId}</Text>}
                                {prereqErrors.length > 0 && (
                                    <View style={{ marginTop: 8 }}>
                                        {prereqErrors.map((m, i) => (
                                            <Text key={i} style={[styles.errorText, { color: '#b45309' }]}>{m}</Text>
                                        ))}
                                    </View>
                                )}
                                {excludedLeaders.length > 0 && (
                                    <View style={{ marginTop: 8 }}>
                                        <TouchableOpacity onPress={() => setShowExcludedLeaders(s => !s)}>
                                            <Text style={{ color: '#6b7280' }}>{showExcludedLeaders ? 'Ẩn trưởng nhóm bị ẩn' : `Có ${excludedLeaders.length} trưởng nhóm bị ẩn (đang làm trưởng nhóm khác) — xem`}</Text>
                                        </TouchableOpacity>
                                        {showExcludedLeaders && (
                                            <View style={{ marginTop: 8 }}>
                                                {excludedLeaders.map((ex) => (
                                                    <Text key={ex.id} style={[styles.errorText, { color: '#9ca3af' }]}>{ex.name} — {ex.reason}</Text>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}
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
                                <ScrollView
                                    style={styles.memberList}
                                    nestedScrollEnabled={true}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {(() => {
                                        const filteredMembers = users
                                            .filter(u => {
                                                // exclude leader and non-employees
                                                if (u.id === formData.leaderId) return false;
                                                if (getRoleName(u) !== 'employee') return false;
                                                // allow if user is already selected in this group's members (editing) or if their active count < 2
                                                const cnt = groupCounts[u.id] || 0;
                                                const alreadySelected = formData.memberIds.includes(u.id) || (group && Array.isArray(group.members) && group.members.some((m:any)=>m.id===u.id));
                                                return alreadySelected || cnt < 2;
                                            });

                                        if (!filteredMembers || filteredMembers.length === 0) {
                                            return (
                                                <View style={{ padding: 12 }}>
                                                    <Text style={{ color: '#9ca3af' }}>Không có thành viên phù hợp</Text>
                                                </View>
                                            );
                                        }

                                        return filteredMembers.map((user) => (
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
                                        ));
                                    })()}
                                </ScrollView>
                            )}
                            {excludedMembers.length > 0 && (
                                <View style={{ paddingTop: 8 }}>
                                    <TouchableOpacity onPress={() => setShowExcludedMembers(s => !s)}>
                                        <Text style={{ color: '#6b7280' }}>{showExcludedMembers ? 'Ẩn người bị ẩn' : `Đã ẩn ${excludedMembers.length} người (đã tham gia >=2 nhóm) — xem`}</Text>
                                    </TouchableOpacity>
                                    {showExcludedMembers && (
                                        <View style={{ marginTop: 8 }}>
                                            {excludedMembers.map((ex) => (
                                                <View key={ex.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                                                    <View style={[styles.checkbox, { backgroundColor: '#d1d5db' }]} />
                                                    <Text style={{ marginLeft: 8, color: '#9ca3af' }}>{ex.name} — {ex.reason}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
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
                            style={[styles.button, styles.submitButton, (loading || prereqErrors.length > 0) && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading || prereqErrors.length > 0}
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
    buttonDisabled: {
        opacity: 0.6,
    },
});
