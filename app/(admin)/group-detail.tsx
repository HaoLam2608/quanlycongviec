import { getGroup } from '@/src/axios/adminApi';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/ui/PageHeader';
import GroupFormModal from './components/GroupFormModal';

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
	const [showEditModal, setShowEditModal] = useState(false);

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
							<View style={styles.headerLeft}>
								<Text style={styles.title}>{group.name}</Text>
								<View style={styles.headerBadges}>
									{group.closed ? (
										<View style={[styles.badge, { backgroundColor: '#6b7280' }]}>
											<Text style={styles.badgeText}>Đã đóng</Text>
										</View>
									) : (
										<View style={[styles.badge, { backgroundColor: '#10b981' }]}>
											<Text style={styles.badgeText}>Hoạt động</Text>
										</View>
									)}
									<View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
										<Text style={styles.badgeText}>{(group.members||[]).length} thành viên</Text>
									</View>
								</View>
							</View>
							<TouchableOpacity 
								style={styles.editButton}
								onPress={() => setShowEditModal(true)}
							>
								<Ionicons name="create-outline" size={20} color="#fff" />
							</TouchableOpacity>
						</View>

						{group.description ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>📝 Mô tả</Text>
								<Text style={styles.sectionText}>{group.description}</Text>
							</View>
						) : null}

						{group.duans && group.duans.length > 0 ? (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>📁 Dự án liên quan ({group.duans.length})</Text>
								{group.duans.map((d: any) => (
									<TouchableOpacity key={d.id || d.duanId} style={styles.projectLink} onPress={() => router.push(`/(admin)/project-detail?id=${d.id || d.duanId}`)}>
										<View style={styles.projectLinkLeft}>
											<Ionicons name="folder" size={20} color="#f59e0b" />
											<Text style={styles.projectLinkText}>{d.tenduan || d.name || d.title}</Text>
										</View>
										<Ionicons name="chevron-forward" size={20} color="#9ca3af" />
									</TouchableOpacity>
								))}
							</View>
						) : null}

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>� Trưởng nhóm</Text>
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

			{/* Edit Modal */}
			<GroupFormModal
				visible={showEditModal}
				group={group}
				onClose={() => setShowEditModal(false)}
				onSuccess={() => {
					setShowEditModal(false);
					loadGroup();
				}}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f8f9fa' },
	content: { padding: 16 },
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
	emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
	emptyIcon: { fontSize: 48 },
	emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginTop: 8 },
	header: { 
		flexDirection: 'row', 
		justifyContent: 'space-between', 
		alignItems: 'flex-start',
		marginBottom: 16 
	},
	headerLeft: { flex: 1 },
	title: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
	headerBadges: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
	badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
	badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
	editButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#f59e0b',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	section: { 
		backgroundColor: '#fff', 
		padding: 16, 
		borderRadius: 12, 
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#1f2937' },
	sectionText: { color: '#6b7280', fontSize: 14, lineHeight: 20 },
	projectLink: { 
		flexDirection: 'row', 
		justifyContent: 'space-between', 
		alignItems: 'center', 
		paddingVertical: 12,
		paddingHorizontal: 12,
		backgroundColor: '#f9fafb',
		borderRadius: 8,
		marginBottom: 8,
	},
	projectLinkLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flex: 1,
	},
	projectLinkText: { color: '#1f2937', fontSize: 14, fontWeight: '500', flex: 1 },
	projectLinkArrow: { color: '#9ca3af', fontSize: 20 },
	personCard: { flexDirection: 'row', alignItems: 'center' },
	personAvatar: { 
		width: 52, 
		height: 52, 
		borderRadius: 26, 
		backgroundColor: '#3b82f6', 
		justifyContent: 'center', 
		alignItems: 'center', 
		marginRight: 12 
	},
	personInitial: { color: '#fff', fontWeight: '800', fontSize: 20 },
	personInfo: {},
	personName: { fontWeight: '700', fontSize: 16, color: '#1f2937' },
	personCode: { color: '#6b7280', fontSize: 13, marginTop: 2 },
	memberRow: { 
		flexDirection: 'row', 
		alignItems: 'center', 
		paddingVertical: 12, 
		paddingHorizontal: 4,
		borderBottomWidth: 1, 
		borderBottomColor: '#f3f4f6' 
	},
	memberAvatar: { 
		width: 44, 
		height: 44, 
		borderRadius: 22, 
		backgroundColor: '#10b981', 
		justifyContent: 'center', 
		alignItems: 'center', 
		marginRight: 12 
	},
	memberInitial: { color: '#fff', fontWeight: '700', fontSize: 16 },
	memberInfo: {},
	memberName: { fontWeight: '600', fontSize: 15, color: '#1f2937' },
	memberCode: { color: '#6b7280', fontSize: 13, marginTop: 2 },
});

