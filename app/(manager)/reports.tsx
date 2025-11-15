import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { PageHeader } from '../../components/ui/PageHeader';
import { fetchProjectsByManager, getTasksByProject, getKanbanTasks } from '@/src/axios/api';

// Charts - lightweight, dependency-free renderers (avoid native chart libs)

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [stats, setStats] = useState<any>({});
  const [overallStats, setOverallStats] = useState<any>({});
  const [viewMode, setViewMode] = useState<'overall'|'project'>('overall'); // tab toggle
  const [chartType, setChartType] = useState<'bar'|'line'|'pie'|'table'>('bar');
  const screenWidth = Dimensions.get('window').width - 48; // padding adjustments

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return setProjects([]);
      const user = JSON.parse(userData);
      const projs = await fetchProjectsByManager(user.id);
      setProjects(projs || []);
      if (projs && projs.length > 0) {
        setSelectedProject(projs[0]);
        await loadOverallStats(projs, user.id);
        await loadStats(projs[0].id);
      }
    } catch (err) {
      console.error('Error loading projects for reports', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  const loadOverallStats = async (projs: any[], managerId: number) => {
    try {
      let allTasks: any[] = [];
      for (const proj of projs) {
        try {
          const tasksResp: any = await getTasksByProject(proj.id);
          const tasks = Array.isArray(tasksResp) ? tasksResp : (tasksResp.tasks || tasksResp.data || []);
          allTasks = [...allTasks, ...tasks];
        } catch (e) { console.log('Error loading tasks for project', proj.id, e); }
      }

      const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0, unknown: 0 };
      allTasks.forEach((t: any) => {
        const p = (t.mucDoUuTien || '').toLowerCase();
        if (p === 'high' || p === 'cao') byPriority.high++;
        else if (p === 'medium' || p === 'trungbinh') byPriority.medium++;
        else if (p === 'low' || p === 'thap') byPriority.low++;
        else byPriority.unknown++;
      });

      const statusCounts: Record<string, number> = {};
      allTasks.forEach((t: any) => {
        const st = t.trangThai || t.status || 'Không rõ';
        statusCounts[st] = (statusCounts[st] || 0) + 1;
      });

      const completedCount = (statusCounts['Hoàn thành'] || 0) + (statusCounts['Hoan thanh'] || 0) + (statusCounts['Completed'] || 0);
      const totalTasks = allTasks.length;
      const completedPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      setOverallStats({
        totalProjects: projs.length,
        totalTasks,
        byPriority,
        statusCounts,
        completedCount,
        completedPct,
        sourceTasks: allTasks,
      });
    } catch (err) {
      console.error('Error loading overall stats', err);
    }
  };

  const loadStats = async (projectId: number) => {
    try {
      setLoading(true);
      const tasksResp: any = await getTasksByProject(projectId);
      const tasks = Array.isArray(tasksResp) ? tasksResp : (tasksResp.tasks || tasksResp.data || []);

      // counts by priority
      const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0, unknown: 0 };
      tasks.forEach((t: any) => {
        const p = (t.mucDoUuTien || '').toLowerCase();
        if (p === 'high' || p === 'cao') byPriority.high++;
        else if (p === 'medium' || p === 'trungbinh' || p === 'medium') byPriority.medium++;
        else if (p === 'low' || p === 'thap') byPriority.low++;
        else byPriority.unknown++;
      });

      // get kanban to compute status counts and completed percent if available
      const kanbanResp: any = await getKanbanTasks(projectId);
      const kanban = kanbanResp?.kanban || kanbanResp || {};
      const statusCounts: Record<string, number> = {};
      let totalTasks = 0;
      Object.keys(kanban).forEach((statusKey) => {
        const arr = Array.isArray(kanban[statusKey]) ? kanban[statusKey] : [];
        statusCounts[statusKey] = arr.length;
        totalTasks += arr.length;
      });

      // fallback to tasks length if kanban empty
      if (totalTasks === 0) totalTasks = tasks.length;

      const completedCount = (statusCounts['Hoàn thành'] || statusCounts['Hoan thanh'] || statusCounts['Hoàn thành'] || 0) || (statusCounts['Completed'] || 0);
      const completedPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      setStats({
        totalTasks,
        byPriority,
        statusCounts,
        completedCount,
        completedPct,
        sourceTasks: tasks,
      });

    } catch (err) {
      console.error('Error loading reports stats', err);
      Alert.alert('Lỗi', 'Không thể tải số liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = (items: { label: string; count: number }[]) => {
    const max = items.length ? Math.max(...items.map(i => i.count), 1) : 1;
    return (
      <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8 }}>
        {items.map(it => (
          <View key={it.label} style={{ marginBottom: 14 }}>
            <View style={styles.chartRow}>
              <Text style={styles.chartLabel}>{it.label}</Text>
              <Text style={styles.chartCount}>{it.count}</Text>
            </View>
            <View style={styles.chartBarBg}>
              <View style={[styles.chartBarFill, { width: `${Math.round((it.count / max) * 100)}%` }]} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const buildLineData = (days = 30) => {
    // build counts per day for last `days`
    const result: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      result[key] = 0;
    }
    // use tasks from stats.sourceTasks if available (we'll store tasks in stats)
    const tasks = stats.sourceTasks || [];
    tasks.forEach((t: any) => {
      const dateKey = (t.ngayBatDau || t.createdAt || t.ngayTao || '').slice ? (t.ngayBatDau || t.createdAt || t.ngayTao || '').slice(0,10) : null;
      if (dateKey && result.hasOwnProperty(dateKey)) result[dateKey]++;
    });
    return {
      labels: Object.keys(result),
      datasets: [{ data: Object.values(result) }]
    };
  };

  const renderLineChart = () => {
    const data = buildLineData(14); // last 14 days
    const values = data.datasets[0].data as number[];
    const max = Math.max(1, ...values);
    return (
      <View style={{ width: screenWidth, height: 180, backgroundColor: '#fff', borderRadius: 8, padding: 12 }}>
        <Text style={{ color: '#111827', fontWeight: '700', marginBottom: 12 }}>Xu hướng 14 ngày gần nhất</Text>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
          {values.map((v, i) => (
            <View key={i} style={{ width: Math.max(4, Math.floor((screenWidth - values.length * 2) / values.length)), height: Math.max(4, (v / max) * 120), backgroundColor: '#3b82f6', borderRadius: 2, marginHorizontal: 1 }} />
          ))}
        </View>
        <Text style={{ marginTop: 8, color: '#6b7280', fontSize: 11, textAlign: 'center' }}>Số lượng công việc theo ngày</Text>
      </View>
    );
  };

  const renderPieChart = (items: { name: string; count: number; color?: string }[]) => {
    const total = items.reduce((s, it) => s + (it.count || 0), 0) || 1;
    return (
      <View style={{ width: screenWidth, backgroundColor: '#fff', borderRadius: 8, padding: 12 }}>
        <Text style={{ color: '#111827', fontWeight: '700', marginBottom: 12 }}>Phân bố theo mức độ ưu tiên</Text>
        {items.map((it, idx) => {
          const pct = Math.round(((it.count||0) / total) * 100);
          const color = it.color || ['#3b82f6','#f59e0b','#10b981','#6b7280'][idx % 4];
          return (
            <View key={idx} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 8 }} />
                  <Text style={{ color: '#111827', fontSize: 14 }}>{it.name}</Text>
                </View>
                <Text style={{ color: '#111827', fontWeight: '700', fontSize: 14 }}>{it.count} ({pct}%)</Text>
              </View>
              <View style={{ height: 12, backgroundColor: '#f1f5f9', borderRadius: 6 }}>
                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} />
              </View>
            </View>
          );
        })}
      </View>
    );
  };



  const renderTable = () => {
    const currentStats = viewMode === 'overall' ? overallStats : stats;
    const status = currentStats.statusCounts || {};
    const priority = currentStats.byPriority || {};
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 12, fontSize: 15, color: '#111827' }}>Bảng tổng hợp</Text>
        
        <Text style={{ fontWeight: '700', marginTop: 8, marginBottom: 8, color: '#6b7280', fontSize: 13 }}>Theo trạng thái</Text>
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          {Object.keys(status).map((k, idx) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
              <Text style={{ color: '#111827', fontSize: 14 }}>{k}</Text>
              <Text style={{ fontWeight: '700', fontSize: 14 }}>{status[k]}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontWeight: '700', marginTop: 16, marginBottom: 8, color: '#6b7280', fontSize: 13 }}>Theo mức độ ưu tiên</Text>
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          {['high','medium','low','unknown'].map((k, idx) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
              <Text style={{ color: '#111827', fontSize: 14 }}>{k === 'high' ? 'Cao' : k === 'medium' ? 'Trung bình' : k === 'low' ? 'Thấp' : 'Không rõ'}</Text>
              <Text style={{ fontWeight: '700', fontSize: 14 }}>{(priority && priority[k]) || 0}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const onSelectProject = async (p: any) => {
    setSelectedProject(p);
    await loadStats(p.id);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Báo cáo" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 12 }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Báo cáo" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {projects.length > 0 ? (
          <View>
            {/* Tab selector */}
            <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
              <TouchableOpacity onPress={() => setViewMode('overall')} style={[styles.tabButton, viewMode === 'overall' && styles.tabButtonActive]}>
                <Text style={[styles.tabButtonText, viewMode === 'overall' && styles.tabButtonTextActive]}>📊 Tổng quan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('project')} style={[styles.tabButton, viewMode === 'project' && styles.tabButtonActive]}>
                <Text style={[styles.tabButtonText, viewMode === 'project' && styles.tabButtonTextActive]}>📁 Theo dự án</Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'project' && (
              <View style={styles.projectSelector}>
                <Text style={styles.selectorLabel}>Dự án</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {projects.map((p) => (
                    <TouchableOpacity key={p.id} style={[styles.projectChip, selectedProject?.id === p.id && styles.projectChipActive]} onPress={() => onSelectProject(p)}>
                      <Text style={[styles.projectChipText, selectedProject?.id === p.id && styles.projectChipTextActive]}>{p.tenduan}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {viewMode === 'overall' ? (
              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Tổng quan tất cả dự án</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <View style={{ flex: 1, padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 }}>
                    <Text style={{ color: '#3b82f6', fontSize: 12 }}>Dự án</Text>
                    <Text style={{ color: '#1e40af', fontSize: 24, fontWeight: '700', marginTop: 4 }}>{overallStats.totalProjects ?? 0}</Text>
                  </View>
                  <View style={{ flex: 1, padding: 12, backgroundColor: '#fefce8', borderRadius: 8 }}>
                    <Text style={{ color: '#f59e0b', fontSize: 12 }}>Công việc</Text>
                    <Text style={{ color: '#b45309', fontSize: 24, fontWeight: '700', marginTop: 4 }}>{overallStats.totalTasks ?? 0}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.statSub}>Hoàn thành: {overallStats.completedCount ?? 0} ({overallStats.completedPct ?? 0}%)</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(100, overallStats.completedPct ?? 0)}%` }]} />
                  </View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Theo trạng thái</Text>
                  {Object.keys(overallStats.statusCounts || {}).map((k) => (
                    <View key={k} style={styles.row}>
                      <Text style={styles.rowLabel}>{k}</Text>
                      <Text style={styles.rowValue}>{overallStats.statusCounts[k]}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Theo mức độ ưu tiên</Text>
                  {['high', 'medium', 'low', 'unknown'].map(key => (
                    <View key={key} style={styles.row}>
                      <Text style={styles.rowLabel}>{key === 'high' ? 'Cao' : key === 'medium' ? 'Trung bình' : key === 'low' ? 'Thấp' : 'Không rõ'}</Text>
                      <Text style={styles.rowValue}>{(overallStats.byPriority && overallStats.byPriority[key]) || 0}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Biểu đồ</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {(['bar','line','pie','table'] as const).map((t) => (
                      <TouchableOpacity key={t} onPress={() => setChartType(t)} style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, backgroundColor: chartType === t ? '#3b82f6' : '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
                        <Text style={{ color: chartType === t ? '#fff' : '#111827', fontWeight: '700', fontSize: 13 }}>{t === 'bar' ? 'Cột' : t === 'line' ? 'Đường' : t === 'pie' ? 'Tròn' : 'Bảng'}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View>
                    {chartType === 'bar' && (
                      <View style={{ marginTop: 8 }}>{renderBarChart(Object.keys(overallStats.statusCounts || {}).map(k => ({ label: k, count: overallStats.statusCounts[k] })) )}</View>
                    )}
                    {chartType === 'pie' && (
                      <View style={{ marginTop: 8 }}>{renderPieChart([
                        { name: 'Cao', count: overallStats.byPriority?.high || 0, color: '#ef4444' },
                        { name: 'Trung bình', count: overallStats.byPriority?.medium || 0, color: '#f59e0b' },
                        { name: 'Thấp', count: overallStats.byPriority?.low || 0, color: '#10b981' },
                        { name: 'Không rõ', count: overallStats.byPriority?.unknown || 0, color: '#6b7280' },
                      ])}</View>
                    )}
                    {chartType === 'line' && (
                      <View style={{ marginTop: 8 }}>{renderLineChart()}</View>
                    )}
                    {chartType === 'table' && (
                      <View style={{ marginTop: 8 }}>{renderTable()}</View>
                    )}
                  </View>

                </View>

              </View>
            ) : (
              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Dự án: {selectedProject?.tenduan || ''}</Text>
                <Text style={styles.statValue}>{stats.totalTasks ?? 0} công việc</Text>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.statSub}>Hoàn thành: {stats.completedCount ?? 0} ({stats.completedPct ?? 0}%)</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(100, stats.completedPct ?? 0)}%` }]} />
                  </View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Theo trạng thái</Text>
                  {Object.keys(stats.statusCounts || {}).map((k) => (
                    <View key={k} style={styles.row}>
                      <Text style={styles.rowLabel}>{k}</Text>
                      <Text style={styles.rowValue}>{stats.statusCounts[k]}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Theo mức độ ưu tiên</Text>
                  {['high', 'medium', 'low', 'unknown'].map(key => (
                    <View key={key} style={styles.row}>
                      <Text style={styles.rowLabel}>{key === 'high' ? 'Cao' : key === 'medium' ? 'Trung bình' : key === 'low' ? 'Thấp' : 'Không rõ'}</Text>
                      <Text style={styles.rowValue}>{(stats.byPriority && stats.byPriority[key]) || 0}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Biểu đồ</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {(['bar','line','pie','table'] as const).map((t) => (
                      <TouchableOpacity key={t} onPress={() => setChartType(t)} style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, backgroundColor: chartType === t ? '#3b82f6' : '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
                        <Text style={{ color: chartType === t ? '#fff' : '#111827', fontWeight: '700', fontSize: 13 }}>{t === 'bar' ? 'Cột' : t === 'line' ? 'Đường' : t === 'pie' ? 'Tròn' : 'Bảng'}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View>
                    {chartType === 'bar' && (
                      <View style={{ marginTop: 8 }}>{renderBarChart(Object.keys(stats.statusCounts || {}).map(k => ({ label: k, count: stats.statusCounts[k] })) )}</View>
                    )}
                    {chartType === 'pie' && (
                      <View style={{ marginTop: 8 }}>{renderPieChart([
                        { name: 'Cao', count: stats.byPriority?.high || 0, color: '#ef4444' },
                        { name: 'Trung bình', count: stats.byPriority?.medium || 0, color: '#f59e0b' },
                        { name: 'Thấp', count: stats.byPriority?.low || 0, color: '#10b981' },
                        { name: 'Không rõ', count: stats.byPriority?.unknown || 0, color: '#6b7280' },
                      ])}</View>
                    )}
                    {chartType === 'line' && (
                      <View style={{ marginTop: 8 }}>{renderLineChart()}</View>
                    )}
                    {chartType === 'table' && (
                      <View style={{ marginTop: 8 }}>{renderTable()}</View>
                    )}
                  </View>

                </View>

              </View>
            )}

          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không có dự án để thống kê</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabButtonText: { color: '#111827', fontWeight: '700' },
  tabButtonTextActive: { color: '#fff' },
  projectSelector: { marginBottom: 12 },
  selectorLabel: { color: '#6b7280', fontWeight: '700' },
  projectChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  projectChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  projectChipText: { color: '#111827', fontWeight: '700' },
  projectChipTextActive: { color: '#fff' },
  statCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statTitle: { fontSize: 16, color: '#6b7280', fontWeight: '700' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  statSub: { color: '#6b7280', fontSize: 14 },
  progressBarBg: { height: 12, backgroundColor: '#e6eefc', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: 12, backgroundColor: '#3b82f6', borderRadius: 8 },
  sectionTitle: { marginBottom: 8, marginTop: 6, fontWeight: '700', color: '#111827', fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  rowLabel: { color: '#6b7280', fontSize: 14 },
  rowValue: { fontWeight: '700', fontSize: 14 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#6b7280' },
}) as any;

// chart styles
Object.assign(styles, StyleSheet.create({
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  chartLabel: { color: '#111827', fontSize: 14 },
  chartCount: { fontWeight: '700', fontSize: 14, color: '#3b82f6' },
  chartBarBg: { height: 12, backgroundColor: '#eef2ff', borderRadius: 8, overflow: 'hidden' },
  chartBarFill: { height: 12, backgroundColor: '#3b82f6', borderRadius: 8 },
}));
