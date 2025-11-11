import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LogoutButton from '../../components/ui/LogoutButton';
import { getMemberStats, getRecentActivities, getTodayTasks } from '../../src/axios/api';

const { width } = Dimensions.get('window');

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueeTasks: number;
}

interface Task {
  id: number;
  tentask: string;
  trangThai: string;
  ngayKetThuc: string;
  mucDoUuTien: string;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function HomeScreen() {
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueeTasks: 0,
  });
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, tasksData, activitiesData] = await Promise.allSettled([
        getMemberStats(),
        getTodayTasks(),
        getRecentActivities(5)
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
      if (tasksData.status === 'fulfilled') {
        setTodayTasks(tasksData.value.slice(0, 3)); // Chỉ hiển thị 3 task đầu
      }
      if (activitiesData.status === 'fulfilled') {
        setRecentActivities(activitiesData.value.slice(0, 4)); // Chỉ hiển thị 4 activity đầu
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng!';
    if (hour < 18) return 'Chào buổi chiều!';
    return 'Chào buổi tối!';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'cao': return '#ff4757';
      case 'trung bình': return '#ffa502';
      case 'thấp': return '#2ed573';
      default: return '#70a1ff';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hoàn thành': return '#2ed573';
      case 'đang thực hiện': return '#ffa502';
      case 'chờ xử lý': return '#70a1ff';
      case 'quá hạn': return '#ff4757';
      default: return '#747d8c';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>Chào mừng bạn đến với ứng dụng quản lý công việc</Text>
            </View>
            <LogoutButton variant="icon" size="md" iconType="exit" />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#667eea' }]}>
              <Text style={styles.statNumber}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Tổng công việc</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#2ed573' }]}>
              <Text style={styles.statNumber}>{stats.completedTasks}</Text>
              <Text style={styles.statLabel}>Hoàn thành</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#ffa502' }]}>
              <Text style={styles.statNumber}>{stats.pendingTasks}</Text>
              <Text style={styles.statLabel}>Đang xử lý</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ff4757' }]}>
              <Text style={styles.statNumber}>{stats.overdueeTasks}</Text>
              <Text style={styles.statLabel}>Quá hạn</Text>
            </View>
          </View>
        </View>

        {/* Today Tasks */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Công việc hôm nay</Text>
          {todayTasks.length > 0 ? (
            todayTasks.map((task, index) => (
              <TouchableOpacity key={task.id || index} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle} numberOfLines={2}>
                    {task.tentask || 'Không có tên'}
                  </Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(task.mucDoUuTien || 'thấp') }
                  ]}>
                    <Text style={styles.priorityText}>
                      {task.mucDoUuTien || 'Thấp'}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskFooter}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(task.trangThai || 'chờ xử lý') }
                  ]}>
                    <Text style={styles.statusText}>
                      {task.trangThai || 'Chờ xử lý'}
                    </Text>
                  </View>
                  <Text style={styles.taskDate}>
                    {task.ngayKetThuc ? new Date(task.ngayKetThuc).toLocaleDateString('vi-VN') : 'Chưa có hạn'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có công việc nào hôm nay</Text>
            </View>
          )}
        </View>

        {/* Recent Activities */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <View key={activity.id || index} style={styles.activityCard}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    {activity.description || 'Không có mô tả'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {activity.createdAt ? new Date(activity.createdAt).toLocaleString('vi-VN') : 'Không rõ thời gian'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    marginBottom: 25,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statsContainer: {
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  taskDate: {
    fontSize: 12,
    color: '#666',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
