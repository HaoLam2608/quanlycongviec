import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, ActivityIndicator, TextInput, Platform } from 'react-native';
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
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

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
        {/* Project Selector */}
        <View style={styles.projectSelector}>
          <Text style={styles.selectorLabel}>Dự án:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={[
                styles.projectChipLarge,
                selectedProject ? styles.projectChipActive : null,
                { flex: 1 }
              ]}
              onPress={() => setShowProjectPicker(true)}
            >
              <Text style={[
                styles.projectChipText,
                selectedProject ? styles.projectChipTextActive : null
              ]} numberOfLines={1}>
                {selectedProject ? selectedProject.tenduan : 'Chọn dự án...'}
              </Text>
            </TouchableOpacity>

            {selectedProject && (
              <TouchableOpacity 
                onPress={() => {
                  setSelectedProject(null);
                  setTasks([]);
                }} 
                style={styles.clearBtn}
              >
                <Text style={{ color: '#6b7280', fontWeight: '600' }}>Bỏ chọn</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Calendar Navigation */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => { setMonth(m => { if (m === 0) { setYear(y => y-1); return 11 } return m-1 }) }} style={styles.navBtn}><Text style={styles.navBtnText}>‹</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setMonth(m => { if (m === 11) { setYear(y => y+1); return 0 } return m+1 }) }} style={styles.navBtn}><Text style={styles.navBtnText}>›</Text></TouchableOpacity>
          </View>
          <Text style={{ fontWeight: '700', fontSize: 16, color: '#1f2937' }}>
            {new Date(year, month).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              const now = new Date();
              setYear(now.getFullYear());
              setMonth(now.getMonth());
            }}
            style={styles.todayBtn}
          >
            <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 13 }}>Hôm nay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarGrid}>
          {/* Header row */}
          {['CN','T2','T3','T4','T5','T6','T7'].map((h) => (
            <View key={h} style={styles.calendarCellHeader}><Text style={{ fontWeight: '700' }}>{h}</Text></View>
          ))}

          {monthMatrix.map((week, wi) => (
            <React.Fragment key={wi}>
              {week.map((d, di) => {
                const key = d ? new Date(year, month, d).toISOString().slice(0,10) : null;
                const dayTasks = key ? (tasksByDate[key] || []) : [];
                const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                
                return (
                  <TouchableOpacity 
                    key={di} 
                    style={[
                      styles.calendarCell,
                      dayTasks.length > 0 && { backgroundColor: '#f0f9ff' },
                      isToday && { borderWidth: 2, borderColor: '#3b82f6' }
                    ]} 
                    onPress={() => openDay(d)}
                    disabled={!d}
                  >
                    {d ? (
                      <View style={{ width: '100%', height: '100%', justifyContent: 'space-between' }}>
                        <Text style={{ 
                          color: isToday ? '#3b82f6' : '#111827', 
                          fontWeight: isToday ? '700' : '600',
                          fontSize: 15
                        }}>
                          {d}
                        </Text>
                        
                        {dayTasks.length > 0 && (
                          <View style={{ alignItems: 'center', marginTop: 4 }}>
                            <View style={{ 
                              backgroundColor: '#3b82f6', 
                              paddingHorizontal: 6, 
                              paddingVertical: 2, 
                              borderRadius: 10,
                              minWidth: 20,
                              alignItems: 'center'
                            }}>
                              <Text style={{ 
                                color: '#fff', 
                                fontSize: 10, 
                                fontWeight: '700' 
                              }}>
                                {dayTasks.length}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={dayModalVisible} animationType="slide" onRequestClose={() => setDayModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ 
              backgroundColor: '#fff', 
              padding: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: '#e5e7eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 20, color: '#1f2937' }}>Công việc trong ngày</Text>
                  <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
                    {selectedDayTasks.length} công việc
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setDayModalVisible(false)}
                  style={{ 
                    padding: 8, 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: 8 
                  }}
                >
                  <Text style={{ fontSize: 18, color: '#6b7280' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Task List */}
            <FlatList
              data={selectedDayTasks}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const title = item.tentask || item.tencv || item.tencongviec || item.title || item.name || item.ten || 'Không tên';
                const status = item.trangThai || item.status || item.trangthai || '';
                const assignee = item.nguoiDuocGiao?.hoten || item.nguoiThucHien?.hoten || item.assignee?.hoten || '';
                const start = item.ngayBatDau || item.startDate || item.createdAt || '';
                const end = item.ngayKetThuc || item.endDate || '';
                const priority = item.mucDoUuTien || item.priority || 'medium';
                
                const statusColors: any = {
                  'Chưa bắt đầu': '#6b7280',
                  'Đang chạy': '#f59e0b',
                  'Chờ xác nhận hoàn thành': '#3b82f6',
                  'Hoàn thành': '#10b981',
                };
                
                const priorityColors: any = {
                  'high': '#ef4444',
                  'medium': '#f59e0b',
                  'low': '#10b981',
                };

                return (
                  <TouchableOpacity 
                    style={{ 
                      backgroundColor: '#fff',
                      padding: 14,
                      borderRadius: 12,
                      marginBottom: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => {
                      setDayModalVisible(false);
                      router.push(`/(manager)/task-detail?id=${item.id}`);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: 4, 
                        backgroundColor: priorityColors[priority] || '#6b7280',
                        marginRight: 8,
                        marginTop: 4
                      }} />
                      <Text style={{ flex: 1, fontWeight: '700', fontSize: 16, color: '#111827' }}>
                        {title}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      {status ? (
                        <View style={{ 
                          paddingHorizontal: 10, 
                          paddingVertical: 4, 
                          backgroundColor: `${statusColors[status] || '#6b7280'}15`,
                          borderRadius: 6 
                        }}>
                          <Text style={{ 
                            color: statusColors[status] || '#6b7280', 
                            fontSize: 12, 
                            fontWeight: '600' 
                          }}>
                            {status}
                          </Text>
                        </View>
                      ) : null}
                      
                      {assignee ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: 12, 
                            backgroundColor: '#3b82f6', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            marginRight: 6
                          }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                              {assignee.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={{ color: '#6b7280', fontSize: 13 }}>{assignee}</Text>
                        </View>
                      ) : null}
                    </View>
                    
                    {(start || end) ? (
                      <Text style={{ color: '#94a3b8', marginTop: 8, fontSize: 12 }}>
                        📅 {start ? `${start.slice ? start.slice(0,10) : start}` : ''}{end ? ` → ${end.slice ? end.slice(0,10) : end}` : ''}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 8 }}>📋</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#6b7280' }}>Không có công việc</Text>
                  <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>Chưa có công việc nào trong ngày này</Text>
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Project Picker Modal */}
      <Modal visible={showProjectPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, maxHeight: '80%', padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1f2937' }}>Chọn dự án</Text>
            
            <TextInput 
              placeholder="Tìm kiếm dự án..." 
              value={projectSearch} 
              onChangeText={setProjectSearch} 
              style={{ 
                borderWidth: 1, 
                borderColor: '#e5e7eb', 
                borderRadius: 8, 
                paddingHorizontal: 12, 
                paddingVertical: Platform.OS === 'ios' ? 12 : 10, 
                marginBottom: 12,
                fontSize: 15,
                backgroundColor: '#f9fafb'
              }} 
            />

            <FlatList
              data={projects.filter(p => 
                (p.tenduan || p.name || p.title || '').toLowerCase().includes(projectSearch.toLowerCase())
              )}
              keyExtractor={item => item.id.toString()}
              nestedScrollEnabled
              style={{ marginBottom: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => { 
                    setSelectedProject(item); 
                    setShowProjectPicker(false); 
                    setProjectSearch(''); 
                  }} 
                  style={{ 
                    paddingVertical: 14, 
                    paddingHorizontal: 12,
                    borderBottomWidth: 1, 
                    borderBottomColor: '#f3f4f6',
                    backgroundColor: selectedProject?.id === item.id ? '#eff6ff' : 'transparent',
                    borderRadius: 8,
                    marginBottom: 4
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 15, 
                        fontWeight: selectedProject?.id === item.id ? '700' : '600', 
                        color: selectedProject?.id === item.id ? '#2563eb' : '#111827' 
                      }}>
                        {item.tenduan || item.name || item.title}
                      </Text>
                      {item.mota ? (
                        <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                          {item.mota}
                        </Text>
                      ) : null}
                    </View>
                    {selectedProject?.id === item.id && (
                      <Text style={{ color: '#2563eb', fontSize: 18, marginLeft: 8 }}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#6b7280' }}>Không tìm thấy dự án</Text>
                </View>
              }
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <TouchableOpacity 
                onPress={() => { 
                  setShowProjectPicker(false); 
                  setProjectSearch(''); 
                }} 
                style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}
              >
                <Text style={{ color: '#374151', fontWeight: '700' }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectSelector: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  projectChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#e5e7eb' 
  },
  projectChipLarge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  projectChipActive: { 
    backgroundColor: '#3b82f6', 
    borderColor: '#3b82f6' 
  },
  projectChipText: { 
    color: '#111827', 
    fontWeight: '700',
    fontSize: 15,
  },
  projectChipTextActive: { 
    color: '#fff' 
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navBtn: { 
    padding: 10, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    minWidth: 38,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  calendarGrid: { 
    marginTop: 8, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 8, 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarCellHeader: { 
    width: `${100/7}%`, 
    alignItems: 'center', 
    paddingVertical: 8,
  },
  calendarCell: { 
    width: `${100/7}%`, 
    height: 78, 
    padding: 6, 
    alignItems: 'flex-start' 
  },
});
