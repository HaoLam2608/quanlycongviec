import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfile, updateMyProfile } from '@/src/axios/api';
import { useFocusEffect } from 'expo-router';

interface ProfileData {
    id: number;
    hoten?: string;
    manv?: string;
    email?: string;
    sdt?: string;
    chucvu?: string;
    role?: { name?: string };
}

const INITIAL_FORM = {
    name: '',
    phone: '',
    position: '',
    password: '',
    confirmPassword: ''
};

export default function TeamLeadSettingsScreen() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const syncForm = useCallback((data: ProfileData | null) => {
        if (!data) {
            setForm(INITIAL_FORM);
            return;
        }
        setForm({
            name: data.hoten || '',
            phone: data.sdt || '',
            position: data.chucvu || '',
            password: '',
            confirmPassword: ''
        });
    }, []);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const user = await getMyProfile();
            const normalized: ProfileData = {
                id: user?.id,
                hoten: user?.hoten,
                manv: user?.manv,
                email: user?.email,
                sdt: user?.sdt,
                chucvu: user?.chucvu,
                role: user?.role
            };
            setProfile(normalized);
            syncForm(normalized);
        } catch (error: any) {
            console.error('Load profile error:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể tải thông tin hồ sơ');
        } finally {
            setLoading(false);
        }
    }, [syncForm]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [loadProfile])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    };

    const hasChanges = useMemo(() => {
        if (!profile) return false;
        return (
            form.name.trim() !== (profile.hoten || '') ||
            form.phone.trim() !== (profile.sdt || '') ||
            form.position.trim() !== (profile.chucvu || '') ||
            !!form.password.trim()
        );
    }, [form, profile]);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!profile) return;
        if (!hasChanges) {
            Alert.alert('Thông báo', 'Bạn chưa thay đổi thông tin nào.');
            return;
        }
        if (form.password && form.password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (form.password && form.password !== form.confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return;
        }

        const payload: { hoten?: string; sdt?: string; chucvu?: string; password?: string } = {};
        if (form.name.trim() !== (profile.hoten || '')) payload.hoten = form.name.trim();
        if (form.phone.trim() !== (profile.sdt || '')) payload.sdt = form.phone.trim();
        if (form.position.trim() !== (profile.chucvu || '')) payload.chucvu = form.position.trim();
        if (form.password) payload.password = form.password.trim();

        if (Object.keys(payload).length === 0) {
            Alert.alert('Thông báo', 'Bạn chưa thay đổi thông tin nào.');
            return;
        }

        try {
            setSaving(true);
            const response = await updateMyProfile(payload);
            const updatedUser = response?.user || (await getMyProfile());
            const normalized: ProfileData = {
                id: updatedUser?.id,
                hoten: updatedUser?.hoten,
                manv: updatedUser?.manv,
                email: updatedUser?.email,
                sdt: updatedUser?.sdt,
                chucvu: updatedUser?.chucvu,
                role: updatedUser?.role
            };
            setProfile(normalized);
            syncForm(normalized);
            Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể cập nhật thông tin');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.helperText}>Đang tải thông tin cá nhân...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.headerBox}>
                    <View>
                        <Text style={styles.title}>Cài đặt tài khoản</Text>
                        <Text style={styles.subtitle}>Cập nhật thông tin cá nhân và mật khẩu</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                        <Ionicons name="refresh" size={20} color="#7c3aed" />
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
                    <View style={styles.accountRow}>
                        <Ionicons name="person" size={18} color="#7c3aed" />
                        <View style={styles.accountTextBox}>
                            <Text style={styles.accountLabel}>Mã nhân viên</Text>
                            <Text style={styles.accountValue}>{profile?.manv || '—'}</Text>
                        </View>
                    </View>
                    <View style={styles.accountRow}>
                        <Ionicons name="mail" size={18} color="#7c3aed" />
                        <View style={styles.accountTextBox}>
                            <Text style={styles.accountLabel}>Email</Text>
                            <Text style={styles.accountValue}>{profile?.email || '—'}</Text>
                        </View>
                    </View>
                    {profile?.role?.name && (
                        <View style={styles.accountRow}>
                            <Ionicons name="shield" size={18} color="#7c3aed" />
                            <View style={styles.accountTextBox}>
                                <Text style={styles.accountLabel}>Vai trò</Text>
                                <Text style={styles.accountValue}>{profile.role.name}</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

                    <Text style={styles.label}>Họ và tên</Text>
                    <TextInput
                        value={form.name}
                        onChangeText={value => handleChange('name', value)}
                        style={styles.input}
                        placeholder="Nhập họ tên"
                        placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                        value={form.phone}
                        onChangeText={value => handleChange('phone', value)}
                        style={styles.input}
                        placeholder="Nhập số liên hệ"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Chức vụ</Text>
                    <TextInput
                        value={form.position}
                        onChangeText={value => handleChange('position', value)}
                        style={styles.input}
                        placeholder="Nhập chức vụ"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thay đổi mật khẩu</Text>
                    <Text style={styles.passwordHint}>Để trống nếu bạn không muốn đổi mật khẩu.</Text>

                    <Text style={styles.label}>Mật khẩu mới</Text>
                    <TextInput
                        value={form.password}
                        onChangeText={value => handleChange('password', value)}
                        style={styles.input}
                        placeholder="Nhập mật khẩu mới"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry
                    />

                    <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                    <TextInput
                        value={form.confirmPassword}
                        onChangeText={value => handleChange('confirmPassword', value)}
                        style={styles.input}
                        placeholder="Nhập lại mật khẩu"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 18,
        paddingBottom: 32,
        gap: 18
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5ff'
    },
    helperText: {
        marginTop: 12,
        color: '#6b7280'
    },
    headerBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#312e81'
    },
    subtitle: {
        marginTop: 6,
        color: '#6b7280'
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#312e81',
        marginBottom: 14
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 14
    },
    accountTextBox: {
        flex: 1
    },
    accountLabel: {
        fontSize: 13,
        color: '#6b7280'
    },
    accountValue: {
        marginTop: 2,
        fontSize: 15,
        color: '#111827',
        fontWeight: '600'
    },
    label: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 6
    },
    input: {
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e0e7ff',
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#111827',
        marginBottom: 12
    },
    passwordHint: {
        color: '#9ca3af',
        marginBottom: 12
    },
    saveButton: {
        backgroundColor: '#7c3aed',
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center'
    },
    saveButtonDisabled: {
        opacity: 0.6
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    }
});
