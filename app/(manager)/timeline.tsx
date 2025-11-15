import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageHeader } from '../../components/ui/PageHeader';
import { fetchProjectsByManager, getTasksByProject } from '@/src/axios/api';
import { useRouter } from 'expo-router';

function getMonthMatrix(year: number, month: number) {
  // month: 0-11
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0 (Sun) - 6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: number[][] = [];
  let week: (number | null)[] = [];
  // pad first week with nulls until startDay (we'll assume week starts Sun)
  for (let i = 0; i < startDay; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week as number[]);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week as number[]);
  }
  return weeks;
}

export default function TimelinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) loadTasks(selectedProject.id);
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return setProjects([]);
      const user = JSON.parse(userData);
      const projs = await fetchProjectsByManager(user.id);
      setProjects(projs || []);
      if (projs && projs.length > 0) setSelectedProject(projs[0]);
    } catch (e) {
      console.error('loadProjects', e);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (projectId: number) => {
    try {
      setLoading(true);
      const t = await getTasksByProject(projectId);
      setTasks(Array.isArray(t) ? t : (t.tasks || t.data || []));
    } catch (e) {
      console.error('loadTasks', e);
    } finally {
      setLoading(false);
    }
  };

  const monthMatrix = getMonthMatrix(year, month);

  const tasksByDate = tasks.reduce((acc: Record<string, any[]>, t) => {
    const key = (t.ngayBatDau || t.createdAt || t.ngayTao || '').slice ? (t.ngayBatDau || t.createdAt || t.ngayTao || '').slice(0,10) : null;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  const openDay = (d: number | null) => {
    if (!d) return;
    const dt = new Date(year, month, d);
    const key = dt.toISOString().slice(0,10);
    setSelectedDayTasks(tasksByDate[key] || []);
    setDayModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Timeline" />
        <View style={{ flex:1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 8 }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Timeline" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.rowBetween}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Dự án</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {projects.map(p => (
              <TouchableOpacity key={p.id} style={[styles.projectChip, selectedProject?.id === p.id && styles.projectChipActive]} onPress={() => setSelectedProject(p)}>
                <Text style={[styles.projectChipText, selectedProject?.id === p.id && styles.projectChipTextActive]}>{p.tenduan}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => { setMonth(m => { if (m === 0) { setYear(y => y-1); return 11 } return m-1 }) }} style={styles.navBtn}><Text>{'‹'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setMonth(m => { if (m === 11) { setYear(y => y+1); return 0 } return m+1 }) }} style={styles.navBtn}><Text>{'›'}</Text></TouchableOpacity>
          </View>
          <Text style={{ fontWeight: '700' }}>{new Date(year, month).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.calendarGrid}>
          {/* Header row */}
          {['CN','T2','T3','T4','T5','T6','T7'].map((h) => (
            <View key={h} style={styles.calendarCellHeader}><Text style={{ fontWeight: '700' }}>{h}</Text></View>
          ))}

          {monthMatrix.map((week, wi) => (
            <React.Fragment key={wi}>
              {week.map((d, di) => (
                <TouchableOpacity key={di} style={styles.calendarCell} onPress={() => openDay(d)}>
                  {d ? (
                    <View style={{ width: '100%', height: '100%' }}>
                      <Text style={{ color: d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? '#3b82f6' : '#111827', fontWeight: 600 }}>{d}</Text>
                      <View style={{ marginTop: 6 }}>
                        {/* small dots for tasks */}
                        {(function(){
                          const key = new Date(year, month, d).toISOString().slice(0,10);
                          const arr = tasksByDate[key] || [];
                          if (!arr.length) return null;
                          // show up to 3 small dots, then a +n badge
                          const dots = arr.slice(0,3).map((t, i) => (
                            <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginTop: 4, marginRight: 4 }} />
                          ));
                          return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                              {dots}
                              {arr.length > 3 && (
                                <View style={{ marginLeft: 6, backgroundColor: '#eef2ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 }}>
                                  <Text style={{ color: '#3b82f6', fontSize: 12 }}>+{arr.length - 3}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={dayModalVisible} animationType="slide" onRequestClose={() => setDayModalVisible(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 18 }}>Công việc trong ngày</Text>
            <FlatList
              data={selectedDayTasks}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const title = item.tentask || item.tencv || item.tencongviec || item.title || item.name || item.ten || 'Không tên';
                const status = item.trangThai || item.status || item.trangthai || '';
                const assignee = item.nguoiDuocGiao?.hoten || item.nguoiThucHien?.hoten || item.assignee?.hoten || '';
                const start = item.ngayBatDau || item.startDate || item.createdAt || '';
                const end = item.ngayKetThuc || item.endDate || '';
                return (
                  <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <Text style={{ fontWeight: '700', fontSize: 16 }}>{title}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ color: '#6b7280' }}>{status}</Text>
                      {assignee ? <Text style={{ color: '#6b7280' }}>{assignee}</Text> : null}
                    </View>
                    {(start || end) ? (
                      <Text style={{ color: '#94a3b8', marginTop: 6, fontSize: 12 }}>{start ? `Từ: ${start.slice ? start.slice(0,10) : start}` : ''}{end ? `  Đến: ${end.slice ? end.slice(0,10) : end}` : ''}</Text>
                    ) : null}
                  </View>
                );
              }}
              ListEmptyComponent={() => (
                <View style={{ padding: 16 }}><Text>Không có công việc</Text></View>
              )}
            />

            <TouchableOpacity style={{ marginTop: 12, padding: 12, backgroundColor: '#3b82f6', borderRadius: 8 }} onPress={() => setDayModalVisible(false)}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  projectChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  projectChipText: { color: '#111827', fontWeight: '700' },
  projectChipTextActive: { color: '#fff' },
  navBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 8, marginRight: 8 },
  calendarGrid: { marginTop: 8, backgroundColor: '#fff', borderRadius: 8, padding: 8, flexDirection: 'row', flexWrap: 'wrap' },
  calendarCellHeader: { width: `${100/7}%`, alignItems: 'center', paddingVertical: 6 },
  calendarCell: { width: `${100/7}%`, height: 78, padding: 6, alignItems: 'flex-start' },
});
