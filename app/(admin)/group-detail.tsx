import { getGroup } from '@/src/axios/adminApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/ui/PageHeader';

interface Member {
	id: number;
	hoten?: string;
	manv?: string;
	name?: string;
	fullName?: string;
}

interface GroupDetailType {
	id: number;
	name: string;
	description?: string;
	closed?: boolean;
	leader?: { id: number; hoten?: string; manv?: string; name?: string; fullName?: string };
	members?: Member[];
	duans?: any[];
}

export default function AdminGroupDetail() {
	const params = useLocalSearchParams();
	const router = useRouter();
	const groupId = params.id as string;

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [group, setGroup] = useState<GroupDetailType | null>(null);

	useEffect(() => {
		if (groupId) loadGroup();
	}, [groupId]);

	const loadGroup = async () => {
		try {
			setLoading(true);
			const data = await getGroup(Number(groupId));
			const g = data && data.id ? data : (data.group || data.data || null);
			if (g) {
				setGroup({
					id: g.id,
					name: g.name || g.ten || '',
					description: g.description || g.mota || '',
					closed: Boolean(g.isClosed || g.is_closed || g.closed || g.dong || g.trangthai === 'Đã đóng'),
					leader: g.leader || g.truong || g.leaderInfo || null,
					members: Array.isArray(g.members) ? g.members : (g.Users || g.userList || []),
					duans: g.duans || g.projects || (g.groupProjects || []),
				});
			} else {
				setGroup(null);
			}
		} catch (error) {
			console.error('Error loading group:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = () => {
		setRefreshing(true);
		loadGroup();
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<PageHeader title="Chi tiết nhóm" />
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#2563eb" />
					<Text style={styles.loadingText}>Đang tải...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!group) {
		return (
			<SafeAreaView style={styles.container}>
				<PageHeader title="Chi tiết nhóm" />
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyIcon}>❌</Text>
					<Text style={styles.emptyTitle}>Không tìm thấy nhóm</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<PageHeader title="Chi tiết nhóm" />
			<FlatList
				style={styles.content}
				data={group.members || []}
				keyExtractor={(m: any) => (m.id || m.userId || Math.random()).toString()}
				renderItem={({ item }) => (
					<View style={styles.memberRow}>
						<View style={styles.memberAvatar}><Text style={styles.memberInitial}>{(item.hoten||'').charAt(0).toUpperCase()}</Text></View>
						<View style={styles.memberInfo}>
							<Text style={styles.memberName}>{item.hoten || item.name || 'Không rõ'}</Text>
							{item.manv ? <Text style={styles.memberCode}>{item.manv}</Text> : null}
						</View>
					</View>
				)}
				ListHeaderComponent={() => (
					<>
						<View style={styles.header}>
							<Text style={styles.title}>{group.name}</Text>
							<View style={styles.headerBadges}>
								{group.closed ? (
									<View style={[styles.badge, { backgroundColor: '#6b7280' }]}>
										<Text style={styles.badgeText}>Đã đóng</Text>
									</View>
								) : null}
								<View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
									<Text style={styles.badgeText}>{(group.members||[]).length} thành viên</Text>
								</View>
							</View>
						</View>

						{group.description ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>📝 Mô tả</Text>
								<Text style={styles.sectionText}>{group.description}</Text>
							</View>
						) : null}

						{group.duans && group.duans.length > 0 ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>📁 Dự án liên quan</Text>
								{group.duans.map((d: any) => (
									<TouchableOpacity key={d.id || d.duanId} style={styles.projectLink} onPress={() => router.push(`/(admin)/project-detail?id=${d.id || d.duanId}`)}>
										<Text style={styles.projectLinkText}>📁 {d.tenduan || d.name || d.title}</Text>
										<Text style={styles.projectLinkArrow}>›</Text>
									</TouchableOpacity>
								))}
							</View>
						) : null}

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>👥 Trưởng nhóm</Text>
							{group.leader ? (
								<View style={styles.personCard}>
									<View style={styles.personAvatar}><Text style={styles.personInitial}>{(group.leader.hoten||'').charAt(0).toUpperCase()}</Text></View>
									<View style={styles.personInfo}>
										<Text style={styles.personName}>{group.leader.hoten || group.leader.name || 'Không rõ'}</Text>
										{group.leader.manv ? <Text style={styles.personCode}>{group.leader.manv}</Text> : null}
									</View>
								</View>
							) : (
								<Text style={styles.sectionText}>Chưa có trưởng nhóm</Text>
							)}
						</View>

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>👥 Thành viên ({(group.members||[]).length})</Text>
						</View>
					</>
				)}
				refreshing={refreshing}
				onRefresh={onRefresh}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f8f9fa' },
	content: { padding: 16 },
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	loadingText: { marginTop: 12, color: '#6b7280' },
	emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
	emptyIcon: { fontSize: 48 },
	emptyTitle: { fontSize: 18, fontWeight: '700' },
	header: { marginBottom: 16 },
	title: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
	headerBadges: { flexDirection: 'row', gap: 8, marginTop: 8 },
	badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
	badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
	section: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12 },
	sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
	sectionText: { color: '#6b7280' },
	projectLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
	projectLinkText: { color: '#1f2937' },
	projectLinkArrow: { color: '#9ca3af' },
	personCard: { flexDirection: 'row', alignItems: 'center' },
	personAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
	personInitial: { color: '#fff', fontWeight: '800', fontSize: 18 },
	personInfo: {},
	personName: { fontWeight: '700' },
	personCode: { color: '#6b7280', fontSize: 12 },
	memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
	memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
	memberInitial: { color: '#fff', fontWeight: '700' },
	memberInfo: {},
	memberName: { fontWeight: '700' },
	memberCode: { color: '#6b7280', fontSize: 12 },
});

