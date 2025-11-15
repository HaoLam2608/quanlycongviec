import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ActivityIndicator, ScrollView, Image } from 'react-native';
import { PageHeader } from '../../components/ui/PageHeader';
import { getMyProfile } from '@/src/axios/api';
import api from '@/src/axios/config';
import { API_CONFIG } from '@/src/config/api';

interface Profile {
    id?: number;
    hoten?: string;
    manv?: string;
    sdt?: string;
    email?: string;
    chucvu?: string;
    avatarUrl?: string;
}

export default function ManagerProfile() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            let data: any = null;
            try {
                data = await getMyProfile();
            } catch (e) {
                // fallback to direct API call if helper throws
                try {
                    const res = await api.get('/users/me');
                    data = res.data || res;
                } catch (err) {
                    throw err;
                }
            }
            // API may return user object directly or wrapped
            const user = data && data.id ? data : (data.user || data.data || null);
            if (user) {
                // Normalize avatar URL: prefer explicit avatarUrl, then avatar path. If path is relative, prepend BASE_URL.
                let avatarPath = user.avatarUrl || user.avatar || null;
                let avatarFull: string | undefined = undefined;
                if (avatarPath) {
                    if (typeof avatarPath === 'string') {
                        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
                            avatarFull = avatarPath;
                        } else {
                            // ensure single slash
                            const slash = avatarPath.startsWith('/') ? '' : '/';
                            avatarFull = `${API_CONFIG.BASE_URL}${slash}${avatarPath}`;
                        }
                    }
                }

                setProfile({
                    id: user.id,
                    hoten: user.hoten || user.name || user.fullName,
                    manv: user.manv,
                    sdt: user.sdt || user.phone,
                    email: user.email,
                    chucvu: user.chucvu || user.role || user.position,
                    avatarUrl: avatarFull,
                });
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.error('Error loading profile', err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Hồ sơ quản lý" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Hồ sơ quản lý" />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {profile ? (
                    <View style={styles.card}>
                        <View style={styles.headerRow}>
                            {profile.avatarUrl ? (
                                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{(profile.hoten||'?').charAt(0).toUpperCase()}</Text></View>
                            )}
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.name}>{profile.hoten || 'Không có tên'}</Text>
                                {profile.manv ? <Text style={styles.code}>{profile.manv}</Text> : null}
                                {profile.chucvu ? <Text style={styles.role}>{profile.chucvu}</Text> : null}
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Số điện thoại</Text>
                            <Text style={styles.infoValue}>{profile.sdt || 'N/A'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{profile.email || 'N/A'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Mã người dùng</Text>
                            <Text style={styles.infoValue}>{profile.id ?? 'N/A'}</Text>
                        </View>

                        {/* Reload button removed per request */}
                    </View>
                ) : (
                    <View style={styles.empty}> 
                        <Text style={styles.emptyText}>Không có dữ liệu hồ sơ</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6b7280' },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#c7d2fe' },
    avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontSize: 28, fontWeight: '800' },
    name: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    code: { color: '#6b7280', marginTop: 2 },
    role: { color: '#6b7280', marginTop: 4, fontWeight: '600' },
    infoRow: { marginTop: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    infoLabel: { color: '#6b7280', fontSize: 13 },
    infoValue: { color: '#0f172a', fontWeight: '700', marginTop: 4 },
    button: { marginTop: 8, backgroundColor: '#3b82f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '700' },
    empty: { alignItems: 'center', padding: 24 },
    emptyText: { color: '#6b7280', marginBottom: 12 },
});
