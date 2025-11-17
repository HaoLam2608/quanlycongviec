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
  const [chartType, setChartType] = useState<'bar'|'line'|'pie'>('bar');
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
    if (items.length === 0) {
      return (
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 8 }}>
          <Text style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>
            Chưa có dữ liệu
          </Text>
        </View>
      );
    }

    const max = Math.max(...items.map(i => i.count), 1);
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    const chartHeight = 200;
    const barWidth = Math.max(40, Math.floor((screenWidth - 80) / items.length));
    
    return (
      <View style={{ 
        backgroundColor: '#fff', 
        padding: 16, 
        borderRadius: 12, 
        marginTop: 8 
      }}>
        {/* <Text style={{ fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
          Biểu đồ cột
        </Text> */}
        
        {/* Chart Area */}
        <View style={{ 
          height: chartHeight + 40,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          borderBottomWidth: 2,
          borderBottomColor: '#e5e7eb',
          paddingBottom: 30,
        }}>
          {items.map((it, idx) => {
            const barHeight = (it.count / max) * chartHeight;
            const color = colors[idx % colors.length];
            
            return (
              <View key={idx} style={{ alignItems: 'center', minWidth: barWidth }}>
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: 8,
                }}>
                  {it.count}
                </Text>
                <View style={{
                  width: barWidth - 10,
                  height: Math.max(10, barHeight),
                  backgroundColor: color,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  marginBottom: 8,
                }} />
                <Text style={{ 
                  fontSize: 11, 
                  color: '#6b7280',
                  textAlign: 'center',
                  maxWidth: barWidth,
                }} numberOfLines={2}>
                  {it.label}
                </Text>
              </View>
            );
          })}
        </View>
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
    const currentStats = viewMode === 'overall' ? overallStats : stats;
    const tasks = currentStats.sourceTasks || [];
    
    // Build data for last 14 days
    const result: { date: string; count: number; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.getDate().toString();
      result.push({ date: key, count: 0, label });
    }
    
    // Count tasks per day
    tasks.forEach((t: any) => {
      const dateKey = (t.ngayBatDau || t.createdAt || t.ngayTao || '').slice?.(0, 10);
      const found = result.find(r => r.date === dateKey);
      if (found) found.count++;
    });
    
    const values = result.map(r => r.count);
    const max = Math.max(1, ...values);
    const chartHeight = 160;
    const chartWidth = screenWidth - 60; // Leave padding
    const pointSpacing = chartWidth / (values.length - 1 || 1);
    
    return (
      <View style={{ 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        marginTop: 8,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
          Xu hướng 14 ngày gần nhất
        </Text>
        
        {/* Chart Container with proper boundaries */}
        <View style={{ 
          height: chartHeight + 50,
          paddingHorizontal: 10,
        }}>
          {/* Chart Area */}
          <View style={{ 
            height: chartHeight, 
            borderBottomWidth: 2,
            borderBottomColor: '#e5e7eb',
            position: 'relative',
            marginBottom: 10,
          }}>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => {
              const y = (chartHeight / 4) * i;
              return (
                <View 
                  key={i} 
                  style={{ 
                    position: 'absolute', 
                    top: y, 
                    left: 0, 
                    right: 0, 
                    height: 1, 
                    backgroundColor: '#f1f5f9' 
                  }} 
                />
              );
            })}
            
            {/* Line path and dots */}
            <View style={{ flex: 1, position: 'relative' }}>
              {values.map((v, i) => {
                if (i === values.length - 1) return null;
                
                const x1 = i * pointSpacing;
                const y1 = chartHeight - ((v / max) * chartHeight);
                const nextV = values[i + 1];
                const x2 = (i + 1) * pointSpacing;
                const y2 = chartHeight - ((nextV / max) * chartHeight);
                
                // Calculate line properties
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                return (
                  <View
                    key={`line-${i}`}
                    style={{
                      position: 'absolute',
                      left: x1,
                      top: y1,
                      width: length,
                      height: 2,
                      backgroundColor: '#3b82f6',
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: 'left center',
                    }}
                  />
                );
              })}
              
              {/* Data points and values */}
              {values.map((v, i) => {
                const x = i * pointSpacing;
                const y = chartHeight - ((v / max) * chartHeight);
                
                return (
                  <React.Fragment key={`point-${i}`}>
                    {/* Dot */}
                    <View
                      style={{
                        position: 'absolute',
                        left: x - 5,
                        top: y - 5,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#3b82f6',
                        borderWidth: 2,
                        borderColor: '#fff',
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 1,
                      }}
                    />
                    
                    {/* Value label */}
                    {v > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          left: x - 12,
                          top: Math.max(0, y - 22),
                          width: 24,
                          backgroundColor: '#3b82f6',
                          paddingVertical: 2,
                          paddingHorizontal: 4,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '700',
                            color: '#fff',
                            textAlign: 'center',
                          }}
                        >
                          {v}
                        </Text>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
          
          {/* X-axis labels */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            paddingHorizontal: 5,
          }}>
            {result.map((r, i) => {
              // Show every other label to avoid crowding
              if (i % 2 !== 0) return <View key={i} style={{ width: 20 }} />;
              return (
                <Text 
                  key={i} 
                  style={{ 
                    fontSize: 10, 
                    color: '#6b7280',
                    width: 20,
                    textAlign: 'center',
                  }}
                >
                  {r.label}
                </Text>
              );
            })}
          </View>
        </View>
        
        <Text style={{ marginTop: 8, color: '#6b7280', fontSize: 12, textAlign: 'center' }}>
          Số lượng công việc theo ngày
        </Text>
      </View>
    );
  };

  const renderPieChart = (items: { name: string; count: number; color?: string }[]) => {
    const total = items.reduce((s, it) => s + (it.count || 0), 0) || 1;
    const filteredItems = items.filter(it => it.count > 0);
    
    if (filteredItems.length === 0) {
      return (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8 }}>
          <Text style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>
            Chưa có dữ liệu
          </Text>
        </View>
      );
    }
    
    const size = Math.min(screenWidth * 0.7, 220);
    const strokeWidth = 35;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    
    // Calculate stroke dash array for each segment
    let currentPercentage = 0;
    const segments = filteredItems.map((it, idx) => {
      const percentage = (it.count / total) * 100;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
      const rotation = (currentPercentage / 100) * 360 - 90; // -90 to start from top
      currentPercentage += percentage;
      
      return {
        ...it,
        percentage,
        strokeDasharray,
        rotation,
        color: it.color || ['#ef4444', '#f59e0b', '#10b981', '#6b7280'][idx % 4],
      };
    });
    
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
          Phân bố theo mức độ ưu tiên
        </Text>
        
        {/* Pie Chart using SVG-like approach with View */}
        <View style={{ alignItems: 'center', marginVertical: 24 }}>
          <View style={{ 
            width: size, 
            height: size,
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Background circle */}
            <View style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: '#f1f5f9',
            }} />
            
            {/* Segments as wedges */}
            {segments.map((seg, idx) => {
              const angle = (seg.percentage / 100) * 360;
              const startAngle = segments.slice(0, idx).reduce((sum, s) => sum + (s.percentage / 100) * 360, 0);
              
              // Create wedge using border trick
              return (
                <View
                  key={idx}
                  style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    transform: [{ rotate: `${startAngle - 90}deg` }],
                    overflow: 'hidden',
                  }}
                >
                  <View style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: strokeWidth,
                    borderColor: 'transparent',
                    borderTopColor: seg.color,
                    borderRightColor: angle > 90 ? seg.color : 'transparent',
                    borderBottomColor: angle > 180 ? seg.color : 'transparent',
                    borderLeftColor: angle > 270 ? seg.color : 'transparent',
                    transform: angle <= 180 
                      ? [{ rotate: `${angle / 2}deg` }]
                      : [{ rotate: '90deg' }],
                  }} />
                  {angle > 180 && (
                    <View style={{
                      position: 'absolute',
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderWidth: strokeWidth,
                      borderColor: 'transparent',
                      borderTopColor: seg.color,
                      borderRightColor: angle > 270 ? seg.color : 'transparent',
                      transform: [{ rotate: `${(angle - 180) / 2 + 180}deg` }],
                    }} />
                  )}
                </View>
              );
            })}
            
            {/* Center white circle for donut effect */}
            <View style={{
              position: 'absolute',
              width: size - strokeWidth * 2,
              height: size - strokeWidth * 2,
              borderRadius: (size - strokeWidth * 2) / 2,
              backgroundColor: '#fff',
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f2937' }}>
                {total}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Tổng
              </Text>
            </View>
          </View>
        </View>
        
        {/* Legend */}
        {segments.map((seg, idx) => (
          <View key={idx} style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: '#f9fafb',
            borderRadius: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ 
                width: 14, 
                height: 14, 
                borderRadius: 7, 
                backgroundColor: seg.color, 
                marginRight: 10 
              }} />
              <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600', flex: 1 }}>
                {seg.name}
              </Text>
            </View>
            <Text style={{ color: '#1f2937', fontWeight: '700', fontSize: 14, marginLeft: 12 }}>
              {seg.count} ({Math.round(seg.percentage)}%)
            </Text>
          </View>
        ))}
      </View>
    );
  };



  const renderTable = () => {
    const currentStats = viewMode === 'overall' ? overallStats : stats;
    const status = currentStats.statusCounts || {};
    const priority = currentStats.byPriority || {};
    
    return (
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8 }}>
        <Text style={{ fontWeight: '700', marginBottom: 16, fontSize: 15, color: '#1f2937' }}>
          Bảng tổng hợp
        </Text>
        
        <Text style={{ 
          fontWeight: '700', 
          marginTop: 8, 
          marginBottom: 10, 
          color: '#6b7280', 
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Theo trạng thái
        </Text>
        <View style={{ 
          borderWidth: 1, 
          borderColor: '#e5e7eb', 
          borderRadius: 10, 
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {Object.keys(status).length > 0 ? (
            Object.keys(status).map((k, idx) => (
              <View 
                key={k} 
                style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 12, 
                  paddingHorizontal: 14, 
                  backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff',
                  borderBottomWidth: idx < Object.keys(status).length - 1 ? 1 : 0,
                  borderBottomColor: '#f1f5f9',
                }}
              >
                <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>{k}</Text>
                <View style={{
                  backgroundColor: '#3b82f6',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  minWidth: 32,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>
                    {status[k]}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#9ca3af' }}>Chưa có dữ liệu</Text>
            </View>
          )}
        </View>

        <Text style={{ 
          fontWeight: '700', 
          marginTop: 8, 
          marginBottom: 10, 
          color: '#6b7280', 
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Theo mức độ ưu tiên
        </Text>
        <View style={{ 
          borderWidth: 1, 
          borderColor: '#e5e7eb', 
          borderRadius: 10, 
          overflow: 'hidden' 
        }}>
          {['high', 'medium', 'low', 'unknown'].map((k, idx) => {
            const priorityColors: any = {
              'high': '#ef4444',
              'medium': '#f59e0b',
              'low': '#10b981',
              'unknown': '#6b7280',
            };
            const labels: any = {
              'high': '🔴 Cao',
              'medium': '🟡 Trung bình',
              'low': '🟢 Thấp',
              'unknown': '⚪ Không rõ',
            };
            return (
              <View 
                key={k} 
                style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  paddingVertical: 12, 
                  paddingHorizontal: 14, 
                  backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#fff',
                  borderBottomWidth: idx < 3 ? 1 : 0,
                  borderBottomColor: '#f1f5f9',
                }}
              >
                <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>
                  {labels[k]}
                </Text>
                <View style={{
                  backgroundColor: priorityColors[k],
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  minWidth: 32,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>
                    {(priority && priority[k]) || 0}
                  </Text>
                </View>
              </View>
            );
          })}
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
                  <View style={{ 
                    flexDirection: 'row', 
                    gap: 8, 
                    marginBottom: 12,
                    flexWrap: 'wrap',
                  }}>
                    {(['bar', 'line', 'pie'] as const).map((t) => {
                      const icons = { bar: '📊', line: '📈', pie: '🥧' };
                      const labels = { bar: 'Cột', line: 'Đường', pie: 'Tròn' };
                      return (
                        <TouchableOpacity 
                          key={t} 
                          onPress={() => setChartType(t)} 
                          style={{ 
                            paddingVertical: 10, 
                            paddingHorizontal: 16, 
                            backgroundColor: chartType === t ? '#3b82f6' : '#fff', 
                            borderRadius: 10, 
                            borderWidth: 2, 
                            borderColor: chartType === t ? '#3b82f6' : '#e5e7eb',
                            shadowColor: chartType === t ? '#3b82f6' : '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: chartType === t ? 0.3 : 0.05,
                            shadowRadius: 3,
                            elevation: chartType === t ? 4 : 1,
                          }}
                        >
                          <Text style={{ 
                            color: chartType === t ? '#fff' : '#374151', 
                            fontWeight: '700', 
                            fontSize: 14 
                          }}>
                            {icons[t]} {labels[t]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View>
                    {chartType === 'bar' && (
                      <View>{renderBarChart(Object.keys(overallStats.statusCounts || {}).map(k => ({ label: k, count: overallStats.statusCounts[k] })) )}</View>
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
                  <View style={{ 
                    flexDirection: 'row', 
                    gap: 8, 
                    marginBottom: 12,
                    flexWrap: 'wrap',
                  }}>
                    {(['bar', 'line', 'pie'] as const).map((t) => {
                      const icons = { bar: '📊', line: '📈', pie: '🥧' };
                      const labels = { bar: 'Cột', line: 'Đường', pie: 'Tròn' };
                      return (
                        <TouchableOpacity 
                          key={t} 
                          onPress={() => setChartType(t)} 
                          style={{ 
                            paddingVertical: 10, 
                            paddingHorizontal: 16, 
                            backgroundColor: chartType === t ? '#3b82f6' : '#fff', 
                            borderRadius: 10, 
                            borderWidth: 2, 
                            borderColor: chartType === t ? '#3b82f6' : '#e5e7eb',
                            shadowColor: chartType === t ? '#3b82f6' : '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: chartType === t ? 0.3 : 0.05,
                            shadowRadius: 3,
                            elevation: chartType === t ? 4 : 1,
                          }}
                        >
                          <Text style={{ 
                            color: chartType === t ? '#fff' : '#374151', 
                            fontWeight: '700', 
                            fontSize: 14 
                          }}>
                            {icons[t]} {labels[t]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View>
                    {chartType === 'bar' && (
                      <View>{renderBarChart(Object.keys(stats.statusCounts || {}).map(k => ({ label: k, count: stats.statusCounts[k] })) )}</View>
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
  chartRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  chartLabel: { 
    color: '#374151', 
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  chartCount: { 
    fontWeight: '700', 
    fontSize: 15, 
    color: '#1f2937',
    marginLeft: 12,
  },
  chartBarBg: { 
    height: 14, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 7, 
    overflow: 'hidden' 
  },
  chartBarFill: { 
    height: 14, 
    borderRadius: 7,
    minWidth: 4,
  },
}));
