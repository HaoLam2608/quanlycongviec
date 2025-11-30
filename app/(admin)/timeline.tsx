import { fetchProjects, getTasksByProject } from '@/src/axios/api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/ui/PageHeader';

function getMonthMatrix(year: number, month: number) {
	const first = new Date(year, month, 1);
	const startDay = first.getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const weeks: number[][] = [];
	let week: (number | null)[] = [];
	for (let i = 0; i < startDay; i++) week.push(null);
	for (let d = 1; d <= daysInMonth; d++) {
		week.push(d);
		if (week.length === 7) { weeks.push(week as number[]); week = []; }
	}
	if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week as number[]); }
	return weeks;
}

export default function AdminTimelinePage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [projects, setProjects] = useState<any[]>([]);
	const [selectedProject, setSelectedProject] = useState<any | null>(null);
	const [tasks, setTasks] = useState<any[]>([]);
	const [year, setYear] = useState<number>(new Date().getFullYear());
	const [month, setMonth] = useState<number>(new Date().getMonth());
	const [dayModalVisible, setDayModalVisible] = useState(false);
	const [selectedDayTasks, setSelectedDayTasks] = useState<any[]>([]);
	const [showProjectPicker, setShowProjectPicker] = useState(false);
	const [projectSearch, setProjectSearch] = useState('');

	useEffect(() => { loadProjects(); }, []);
	useEffect(() => { if (selectedProject) loadTasks(selectedProject.id); }, [selectedProject]);

	const loadProjects = async () => {
		try {
			setLoading(true);
			const allProjects = await fetchProjects();
			const list = Array.isArray(allProjects?.projects) ? allProjects.projects : (Array.isArray(allProjects) ? allProjects : []);
			setProjects(list || []);
			if (list && list.length > 0) setSelectedProject(list[0]);
		} catch (e) {
			console.error('loadProjects (admin)', e);
		} finally { setLoading(false); }
	};

	const loadTasks = async (projectId: number) => {
		try {
			setLoading(true);
			const t = await getTasksByProject(projectId);
			setTasks(Array.isArray(t) ? t : (t.tasks || t.data || []));
		} catch (e) {
			console.error('loadTasks (admin)', e);
		} finally { setLoading(false); }
	};

	const monthMatrix = getMonthMatrix(year, month);
	const tasksByDate = tasks.reduce((acc: Record<string, any[]>, t) => {
		const key = (t.ngayBatDau || t.createdAt || t.ngayTao || '').slice ? (t.ngayBatDau || t.createdAt || t.ngayTao || '').slice(0,10) : null;
		if (!key) return acc; if (!acc[key]) acc[key] = []; acc[key].push(t); return acc;
	}, {} as Record<string, any[]>);

	const openDay = (d: number | null) => {
		if (!d) return; const dt = new Date(year, month, d);
		const key = dt.toISOString().slice(0,10);
		setSelectedDayTasks(tasksByDate[key] || []);
		setDayModalVisible(true);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<PageHeader title="Timeline (Admin)" />
				<View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
					<ActivityIndicator size="large" color="#2563eb" />
					<Text style={{ marginTop: 8 }}>Đang tải...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<PageHeader title="Timeline (Admin)" />
			<ScrollView contentContainerStyle={{ padding: 16 }}>
				<View style={styles.projectSelector}>
					<Text style={styles.selectorLabel}>Dự án:</Text>
					<View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
						<TouchableOpacity style={[styles.projectChipLarge, selectedProject ? styles.projectChipActive : null, { flex:1 }]} onPress={() => setShowProjectPicker(true)}>
							<Text style={[styles.projectChipText, selectedProject ? styles.projectChipTextActive : null]} numberOfLines={1}>
								{selectedProject ? selectedProject.tenduan : 'Chọn dự án...'}
							</Text>
						</TouchableOpacity>
						{selectedProject && (
							<TouchableOpacity onPress={() => { setSelectedProject(null); setTasks([]); }} style={styles.clearBtn}>
								<Text style={{ color:'#6b7280', fontWeight:'600' }}>Bỏ chọn</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>

				<View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:16 }}>
					<View style={{ flexDirection:'row', gap:8 }}>
						<TouchableOpacity onPress={() => { setMonth(m => { if (m === 0) { setYear(y => y-1); return 11 } return m-1 }) }} style={styles.navBtn}><Text style={styles.navBtnText}>‹</Text></TouchableOpacity>
						<TouchableOpacity onPress={() => { setMonth(m => { if (m === 11) { setYear(y => y+1); return 0 } return m+1 }) }} style={styles.navBtn}><Text style={styles.navBtnText}>›</Text></TouchableOpacity>
					</View>
					<Text style={{ fontWeight:'700', fontSize:16, color:'#1f2937' }}>
						{new Date(year, month).toLocaleString('vi-VN', { month:'long', year:'numeric' })}
					</Text>
					<TouchableOpacity onPress={() => { const now = new Date(); setYear(now.getFullYear()); setMonth(now.getMonth()); }} style={styles.todayBtn}>
						<Text style={{ color:'#3b82f6', fontWeight:'600', fontSize:13 }}>Hôm nay</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.calendarGrid}>
					{['CN','T2','T3','T4','T5','T6','T7'].map(h => (
						<View key={h} style={styles.calendarCellHeader}><Text style={{ fontWeight:'700' }}>{h}</Text></View>
					))}
					{getMonthMatrix(year, month).map((week, wi) => (
						<React.Fragment key={wi}>
							{week.map((d, di) => {
								const key = d ? new Date(year, month, d).toISOString().slice(0,10) : null;
								const dayTasks = key ? (tasksByDate[key] || []) : [];
								const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
								return (
									<TouchableOpacity key={di} style={[styles.calendarCell, dayTasks.length > 0 && { backgroundColor: '#f0f9ff' }, isToday && { borderWidth: 2, borderColor: '#3b82f6' }]} onPress={() => openDay(d)} disabled={!d}>
										{d ? (
											<View style={{ width:'100%', height:'100%', justifyContent:'space-between' }}>
												<Text style={{ color: isToday ? '#3b82f6' : '#111827', fontWeight: isToday ? '700' : '600', fontSize: 15 }}>{d}</Text>
												{dayTasks.slice(0,2).map((t,i) => (
													<Text key={i} style={{ fontSize: 11, color:'#374151' }} numberOfLines={1}>• {t.tentask}</Text>
												))}
												{dayTasks.length > 2 && (<Text style={{ fontSize: 10, color:'#6b7280' }}>+{dayTasks.length - 2} công việc</Text>)}
											</View>
										) : null}
									</TouchableOpacity>
								);
							})}
						</React.Fragment>
					))}
				</View>

				<Modal visible={dayModalVisible} transparent animationType="fade" onRequestClose={() => setDayModalVisible(false)}>
					<View style={styles.modalOverlay}>
						<View style={styles.modalBody}>
							<View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
								<Text style={{ fontWeight:'700', fontSize:16 }}>Công việc trong ngày</Text>
								<TouchableOpacity onPress={() => setDayModalVisible(false)}><Text style={{ color:'#6b7280', fontWeight:'700' }}>✕</Text></TouchableOpacity>
							</View>
							{selectedDayTasks.length === 0 ? (
								<Text style={{ color:'#6b7280' }}>Không có công việc</Text>
							) : (
												<FlatList data={selectedDayTasks} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => (
													<TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => router.push(`/(manager)/task-detail?id=${item.id}`)}>
														<Text style={{ fontWeight:'700' }}>{item.tentask}</Text>
														{item.mota && <Text style={{ color:'#374151' }}>{item.mota}</Text>}
														<Text style={{ color:'#6b7280', marginTop:6 }}>📅 {item.ngayBatDau ? new Date(item.ngayBatDau).toLocaleDateString('vi-VN') : '—'} ⇢ {item.ngayKetThuc ? new Date(item.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}</Text>
														<Text style={{ color:'#6b7280', marginTop:4 }}>👤 {item.nguoiDuocGiao ? item.nguoiDuocGiao.hoten : (item.nguoiThucHien ? item.nguoiThucHien.hoten : 'Chưa có')}</Text>
													</TouchableOpacity>
												)} />
							)}
						</View>
					</View>
				</Modal>

				{/* Project picker */}
				<Modal visible={showProjectPicker} transparent animationType="fade" onRequestClose={() => setShowProjectPicker(false)}>
					<View style={styles.modalOverlay}>
						<View style={styles.modalBody}>
							<View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
								<Text style={{ fontWeight:'700', fontSize:16 }}>Chọn dự án</Text>
								<TouchableOpacity onPress={() => setShowProjectPicker(false)}><Text style={{ color:'#6b7280', fontWeight:'700' }}>✕</Text></TouchableOpacity>
							</View>
							<TextInput placeholder="Tìm dự án..." value={projectSearch} onChangeText={setProjectSearch} style={styles.searchInput} />
							<FlatList data={projects.filter(p => p.tenduan.toLowerCase().includes(projectSearch.toLowerCase()))} keyExtractor={item => String(item.id)} renderItem={({ item }) => (
								<TouchableOpacity onPress={() => { setSelectedProject(item); setShowProjectPicker(false); }} style={styles.projectItem}>
									<Text style={{ fontWeight:'700' }}>{item.tenduan}</Text>
									{item.mota && <Text style={{ color:'#6b7280' }} numberOfLines={1}>{item.mota}</Text>}
								</TouchableOpacity>
							)} />
						</View>
					</View>
				</Modal>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	projectSelector: { marginBottom: 16 },
	selectorLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
	projectChipLarge: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 10 },
	projectChipActive: { backgroundColor: '#dbeafe' },
	projectChipText: { color: '#6b7280', fontWeight: '600' },
	projectChipTextActive: { color: '#1d4ed8' },
	clearBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
	navBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f3f4f6', borderRadius: 8 },
	navBtnText: { fontSize: 16, fontWeight: '700', color: '#111827' },
	todayBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#eff6ff', borderRadius: 8 },
	calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
	calendarCellHeader: { width: `${100/7}%`, padding: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
	calendarCell: { width: `${100/7}%`, height: 90, padding: 8, borderWidth: 1, borderColor: '#e5e7eb' },
	modalOverlay: { flex:1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent:'center', alignItems:'center' },
	modalBody: { width: '92%', backgroundColor:'#fff', borderRadius:12, padding:16 },
	searchInput: { borderWidth: 1, borderColor:'#e5e7eb', borderRadius:8, padding:10, marginBottom:12 },
	projectItem: { paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#e5e7eb' },
});
