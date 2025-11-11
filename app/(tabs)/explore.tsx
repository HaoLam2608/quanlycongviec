import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import LogoutButton from '../../components/ui/LogoutButton';
import { getMemberProjects, getMemberTasks, updateMemberTaskStatus } from '../../src/axios/api';

interface Task {
  id: number;
  tentask: string;
  mota?: string;
  trangThai: string;
  ngayBatDau?: string;
  ngayKetThuc: string;
  mucDoUuTien: string;
  duanId?: number;
  DuAn?: {
    tenduan: string;
  };
}

interface Project {
  id: number;
  tenduan: string;
}

const TASK_STATUS = {
  'chờ xử lý': 'Chờ xử lý',
  'đang thực hiện': 'Đang thực hiện',
  'hoàn thành': 'Hoàn thành',
  'tạm dừng': 'Tạm dừng',
  'hủy bỏ': 'Hủy bỏ'
};

const PRIORITY_LEVELS = {
  'thấp': 'Thấp',
  'trung bình': 'Trung bình',
  'cao': 'Cao',
  'khẩn cấp': 'Khẩn cấp'
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    try {
      const filters: any = {};
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedPriority) filters.priority = selectedPriority;
      if (selectedProject) filters.projectId = selectedProject;
      if (searchQuery) filters.search = searchQuery;

      const [tasksData, projectsData] = await Promise.allSettled([
        getMemberTasks(filters),
        getMemberProjects()
      ]);

      if (tasksData.status === 'fulfilled') {
        setTasks(tasksData.value.tasks || tasksData.value || []);
      }
      if (projectsData.status === 'fulfilled') {
        setProjects(projectsData.value.projects || projectsData.value || []);
      }
    } catch (error) {
      console.error('Lỗi tải công việc:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedPriority, selectedProject, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await updateMemberTaskStatus(taskId, newStatus);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái công việc');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái công việc');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'khẩn cấp': return '#e74c3c';
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
      case 'tạm dừng': return '#747d8c';
      case 'hủy bỏ': return '#ff4757';
      default: return '#747d8c';
    }
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedProject('');
    setSearchQuery('');
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Công Việc Của Tôi</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonText}>🔍</Text>
          </TouchableOpacity>
          <LogoutButton variant="icon" size="md" iconType="exit" className="ml-2" />
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm công việc..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, selectedStatus === '' && styles.filterChipActive]}
              onPress={() => setSelectedStatus('')}
            >
              <Text style={[styles.filterChipText, selectedStatus === '' && styles.filterChipTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>

            {Object.entries(TASK_STATUS).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, selectedStatus === key && styles.filterChipActive]}
                onPress={() => setSelectedStatus(selectedStatus === key ? '' : key)}
              >
                <Text style={[styles.filterChipText, selectedStatus === key && styles.filterChipTextActive]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle} numberOfLines={2}>
                  {task.tentask}
                </Text>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(task.mucDoUuTien) }
                ]}>
                  <Text style={styles.priorityText}>
                    {PRIORITY_LEVELS[task.mucDoUuTien as keyof typeof PRIORITY_LEVELS] || task.mucDoUuTien}
                  </Text>
                </View>
              </View>

              {task.mota && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {task.mota}
                </Text>
              )}

              {task.DuAn && (
                <Text style={styles.projectName}>
                  📋 {task.DuAn.tenduan}
                </Text>
              )}

              <View style={styles.taskFooter}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    { backgroundColor: getStatusColor(task.trangThai) }
                  ]}
                  onPress={() => {
                    // Hiển thị menu chọn trạng thái
                    Alert.alert(
                      'Cập nhật trạng thái',
                      'Chọn trạng thái mới:',
                      [
                        ...Object.entries(TASK_STATUS).map(([key, value]) => ({
                          text: value,
                          onPress: () => handleUpdateTaskStatus(task.id, key)
                        })),
                        { text: 'Hủy', onPress: () => { } }
                      ]
                    );
                  }}
                >
                  <Text style={styles.statusText}>
                    {TASK_STATUS[task.trangThai as keyof typeof TASK_STATUS] || task.trangThai}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.taskDate}>
                  Hạn: {new Date(task.ngayKetThuc).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || selectedStatus || selectedPriority || selectedProject
                ? 'Không tìm thấy công việc nào phù hợp'
                : 'Bạn chưa có công việc nào'
              }
            </Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 10,
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
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  projectName: {
    fontSize: 12,
    color: '#667eea',
    marginBottom: 10,
    fontWeight: '500',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
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
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
