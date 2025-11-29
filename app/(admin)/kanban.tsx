import { fetchProjects, getKanbanTasks, updateTaskStatus } from '@/src/axios/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
	TouchableOpacity,
	View,
	Modal,
	TextInput
} from 'react-native';
import { PageHeader } from '../../components/ui/PageHeader';

interface Task {
	id: number;
	tentask: string;
	mota?: string;
	trangThai: string;
	mucDoUuTien: string;
	ngayBatDau?: string;
	ngayKetThuc?: string;
	nguoiDuocGiao?: { id: number; hoten: string };
}

interface KanbanColumn {
	status: string;
	title: string;
	tasks: Task[];
	color: string;
}

export default function AdminKanbanBoard() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [projects, setProjects] = useState<any[]>([]);
	const [selectedProject, setSelectedProject] = useState<any>(null);
	const [columns, setColumns] = useState<KanbanColumn[]>([
		{ status: 'Chưa bắt đầu', title: 'Chưa bắt đầu', tasks: [], color: '#6b7280' },
		{ status: 'Đang chạy', title: 'Đang làm', tasks: [], color: '#f59e0b' },
		{ status: 'Chờ xác nhận hoàn thành', title: 'Chờ xác nhận', tasks: [], color: '#3b82f6' },
		{ status: 'Hoàn thành', title: 'Hoàn thành', tasks: [], color: '#10b981' },
	]);

	// Create task modal state
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newTitle, setNewTitle] = useState('');
	const [newDesc, setNewDesc] = useState('');
	const [newStart, setNewStart] = useState('');
	const [newEnd, setNewEnd] = useState('');
	const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
	const [creatingTask, setCreatingTask] = useState(false);
	const [showProjectPicker, setShowProjectPicker] = useState(false);
	const [projectSearch, setProjectSearch] = useState('');

	useEffect(() => {
		loadProjects();
	}, []);

	useEffect(() => {
		if (params.projectId && projects.length > 0) {
			const project = projects.find(p => p.id === Number(params.projectId));
			if (project) {
				setSelectedProject(project);
				loadKanbanData(project.id);
			}
		}
	}, [params.projectId, projects]);

	const loadProjects = async () => {
		try {
			const allProjects = await fetchProjects();
			const list = Array.isArray(allProjects?.projects) ? allProjects.projects : (Array.isArray(allProjects) ? allProjects : []);
			setProjects(list);
			if (!params.projectId && list.length > 0) {
				setSelectedProject(list[0]);
				loadKanbanData(list[0].id);
			}
		} catch (error) {
			console.error('Error loading projects (admin):', error);
			Alert.alert('Lỗi', 'Không thể tải danh sách dự án');
			setLoading(false);
		}
	};

	const loadKanbanData = async (projectId: number) => {
		try {
			setLoading(true);
			const kanbanData = await getKanbanTasks(projectId);
			const source = (kanbanData && (kanbanData.kanban || kanbanData)) || {};
			const newColumns = columns.map(col => ({
				...col,
				tasks: Array.isArray((source as any)[col.status]) ? (source as any)[col.status] : []
			}));
			setColumns(newColumns);
		} catch (error) {
			console.error('Error loading kanban data (admin):', error);
			Alert.alert('Lỗi', 'Không thể tải dữ liệu Kanban');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = () => {
		if (selectedProject) {
			setRefreshing(true);
			loadKanbanData(selectedProject.id);
		}
	};

	const selectProject = (project: any) => {
		setSelectedProject(project);
		loadKanbanData(project.id);
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high': return '#ef4444';
			case 'medium': return '#f59e0b';
			case 'low': return '#10b981';
			default: return '#6b7280';
		}
	};

	const handleChangeTaskStatus = async (taskId: number, status: string) => {
		try {
			await updateTaskStatus(taskId, status);
			if (selectedProject) loadKanbanData(selectedProject.id);
		} catch (e: any) {
			Alert.alert('Lỗi', e?.message || 'Không thể chuyển trạng thái');
		}
	};

	const renderTaskCard = (task: Task, columnStatus?: string) => (
		<TouchableOpacity
			key={task.id}
			style={styles.taskCard}
			onPress={() => router.push(`/(manager)/task-detail?id=${task.id}`)}
			onLongPress={() => {
				const otherStatuses = columns.map(c => c.status).filter(s => s !== (columnStatus || task.trangThai));
				Alert.alert('Chuyển trạng thái', 'Chọn trạng thái mới', [
					...otherStatuses.map(s => ({ text: s, onPress: () => handleChangeTaskStatus(task.id, s) })),
					{ text: 'Huỷ', style: 'cancel' }
				]);
			}}
			delayLongPress={300}
		>
			<View style={styles.taskHeader}>
				<View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.mucDoUuTien) }]} />
				<Text style={styles.taskTitle} numberOfLines={2}>{task.tentask}</Text>
				<TouchableOpacity style={styles.taskActionBtn} onPress={() => {
					const otherStatuses = columns.map(c => c.status).filter(s => s !== task.trangThai);
					Alert.alert('Chuyển trạng thái', 'Chọn trạng thái mới', [
						...otherStatuses.map(s => ({ text: s, onPress: () => handleChangeTaskStatus(task.id, s) })),
						{ text: 'Huỷ', style: 'cancel' }
					]);
				}}>
					<Text style={styles.taskActionText}>⋯</Text>
				</TouchableOpacity>
			</View>
			{task.mota && <Text style={styles.taskDesc} numberOfLines={2}>{task.mota}</Text>}
			<View style={styles.taskMetaRow}>
				<View>
					{(task.ngayBatDau || task.ngayKetThuc) && (
						<Text style={styles.taskMetaText}>📅 {task.ngayBatDau ? new Date(task.ngayBatDau).toLocaleDateString('vi-VN') : '—'} ⇢ {task.ngayKetThuc ? new Date(task.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}</Text>
					)}
					{task.mucDoUuTien && <Text style={styles.taskMetaText}>⚑ {task.mucDoUuTien}</Text>}
				</View>
				{task.nguoiDuocGiao ? (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						<View style={styles.assigneeAvatar}><Text style={styles.assigneeInitial}>{task.nguoiDuocGiao.hoten.charAt(0).toUpperCase()}</Text></View>
						<Text style={styles.taskMetaText}>{task.nguoiDuocGiao.hoten}</Text>
					</View>
				) : (
					<Text style={styles.taskMetaText}>Không có người đảm nhiệm</Text>
				)}
			</View>
		</TouchableOpacity>
	);

	if (loading) {
		return (
			<SafeAreaView style={{ flex: 1 }}>
				<PageHeader title="Kanban (Admin)" />
				<View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
					<ActivityIndicator size="large" color="#2563eb" />
					<Text style={{ marginTop: 8 }}>Đang tải...</Text>
				</View>
			</SafeAreaView>
		);
	}

		return (
			<SafeAreaView style={{ flex: 1 }}>
				<PageHeader title="Kanban (Admin)" />
				<ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}> 
					{/* Project selector */}
					<View style={styles.projectSelector}>
						<Text style={styles.selectorLabel}>Dự án:</Text>
						<View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
							<TouchableOpacity style={[styles.projectChipLarge, selectedProject ? styles.projectChipActive : null, { flex:1 }]} onPress={() => setShowProjectPicker(true)}>
								<Text style={[styles.projectChipText, selectedProject ? styles.projectChipTextActive : null]} numberOfLines={1}>
									{selectedProject ? selectedProject.tenduan : 'Chọn dự án...'}
								</Text>
							</TouchableOpacity>
							{selectedProject && (
								<TouchableOpacity onPress={() => { setSelectedProject(null); setColumns(cols => cols.map(c => ({ ...c, tasks: [] }))); }} style={styles.clearBtn}>
									<Text style={{ color:'#6b7280', fontWeight:'600' }}>Bỏ chọn</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>

					{/* Columns - horizontal scroll so columns don't compress */}
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
						<View style={{ flexDirection:'row', gap:12, paddingHorizontal: 8 }}>
							{columns.map(col => (
								<View key={col.status} style={[styles.column, { borderColor: col.color }]}> 
									<Text style={[styles.columnTitle, { color: col.color }]}>{col.title}</Text>
									{col.tasks.length === 0 ? (
										<View style={{ padding: 8 }}>
											<Text style={styles.emptyText}>Không có công việc</Text>
										</View>
									) : (
										<FlatList data={col.tasks} keyExtractor={item => String(item.id)} renderItem={({ item }) => renderTaskCard(item, col.status)} />
									)}
								</View>
							))}
						</View>
					</ScrollView>

				</ScrollView>

				{/* Project picker modal */}
				<Modal visible={showProjectPicker} transparent animationType="fade" onRequestClose={() => setShowProjectPicker(false)}>
					<View style={styles.modalOverlay}>
						<View style={styles.modalBody}>
							<View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
								<Text style={{ fontWeight:'700', fontSize:16 }}>Chọn dự án</Text>
								<TouchableOpacity onPress={() => setShowProjectPicker(false)}><Text style={{ color:'#3b82f6', fontWeight:'700' }}>✕</Text></TouchableOpacity>
							</View>
							<TextInput placeholder="Tìm dự án..." value={projectSearch} onChangeText={setProjectSearch} style={styles.searchInput} />
							<FlatList data={projects.filter(p => p.tenduan.toLowerCase().includes(projectSearch.toLowerCase()))} keyExtractor={item => String(item.id)} renderItem={({ item }) => (
								<TouchableOpacity onPress={() => { setSelectedProject(item); setShowProjectPicker(false); loadKanbanData(item.id); }} style={styles.projectItem}>
									<Text style={{ fontWeight:'700' }}>{item.tenduan}</Text>
									{item.mota && <Text style={{ color:'#6b7280' }} numberOfLines={1}>{item.mota}</Text>}
								</TouchableOpacity>
							)} />
						</View>
					</View>
				</Modal>

			</SafeAreaView>
		);
}

const styles = StyleSheet.create({
	projectSelector: { marginBottom: 16 },
	selectorLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
	projectChipLarge: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 10 },
	projectChipActive: { backgroundColor: '#dbeafe' },
	projectChipText: { color: '#6b7280', fontWeight: '600' },
	projectChipTextActive: { color: '#1d4ed8' },
	clearBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
	column: { width: 280, borderWidth: 1, borderRadius: 12, padding: 8, backgroundColor: '#fff' },
	columnTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
	emptyText: { color: '#6b7280', fontStyle: 'italic' },
	taskCard: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
	taskMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
	taskMetaText: { fontSize: 12, color: '#6b7280' },
	taskHeader: { flexDirection: 'row', alignItems: 'center' },
	priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
	taskTitle: { flex: 1, fontWeight: '700', color: '#111827' },
	taskActionBtn: { paddingHorizontal: 8, paddingVertical: 2 },
	taskActionText: { fontSize: 18, color: '#6b7280' },
	taskDesc: { color: '#374151', marginTop: 6 },
	assigneeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
	assigneeAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
	assigneeInitial: { fontSize: 12, fontWeight: '700', color: '#111827' },
	assigneeName: { flex: 1, color: '#374151' },
	dueDate: { marginTop: 8, color: '#6b7280', fontSize: 12 },
	modalOverlay: { flex:1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent:'center', alignItems:'center' },
	modalBody: { width: '92%', backgroundColor:'#fff', borderRadius:12, padding:16 },
	searchInput: { borderWidth: 1, borderColor:'#e5e7eb', borderRadius:8, padding:10, marginBottom:12 },
	projectItem: { paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#e5e7eb' },
});
