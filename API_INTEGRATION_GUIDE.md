# Hướng dẫn tích hợp API cho các màn hình Member

## 1. Timesheet Screen (member-timesheet/index.tsx)

### Import cần thiết:
```typescript
import { getMyWorklogs, createWorklog, updateWorklog, deleteWorklog, getMyTasks } from '../../../src/axios/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### Thay thế fetchWorklogs:
```typescript
const fetchWorklogs = async (date: Date) => {
  try {
    setIsLoading(true);
    const dateString = date.toISOString().split('T')[0];
    const data = await getMyWorklogs({ date: dateString });
    
    // Transform API data to match component interface
    const transformedWorklogs: Worklog[] = (data.worklogs || []).map((item: any) => ({
      id: item.id,
      date: item.date,
      taskName: item.task?.tentask || item.subtask?.tenSubtask || 'Không có tên',
      project: item.task?.duan?.tenduan || 'Không rõ dự án',
      hours: item.hours,
      description: item.note || '',
      taskId: item.taskId,
      subtaskId: item.subtaskId,
      createdAt: item.createdAt,
    }));
    
    setWorklogs(transformedWorklogs);
    setIsLoading(false);
  } catch (error: any) {
    console.error('Error fetching worklogs:', error);
    Alert.alert('Lỗi', error.message || 'Không thể tải timesheet');
    setIsLoading(false);
  }
};
```

### Thay thế fetchTasks:
```typescript
const fetchTasks = async () => {
  try {
    const data = await getMyTasks({ limit: 100 });
    
    const transformedTasks: MemberTask[] = (data.tasks || []).map((item: any) => ({
      id: item.id,
      title: item.tentask,
      tentask: item.tentask,
      description: item.mota || '',
      status: item.trangThai,
      trangThai: item.trangThai,
      priority: item.mucDoUuTien || 'medium',
      deadline: item.ngayKetThuc,
      project: item.duan?.tenduan || '',
      duan: item.duan,
      type: 'task',
    }));
    
    setTasks(transformedTasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
  }
};
```

### Thay thế handleCreateWorklog:
```typescript
const handleCreateWorklog = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    await createWorklog({
      userId: parseInt(userId),
      taskId: formData.taskId ? parseInt(formData.taskId) : undefined,
      subtaskId: formData.subtaskId ? parseInt(formData.subtaskId) : undefined,
      hours: parseFloat(formData.hours),
      note: formData.description,
      date: selectedDate.toISOString().split('T')[0],
    });

    Alert.alert('Thành công', 'Đã lưu worklog');
    setIsCreateModalOpen(false);
    setFormData({ taskId: '', subtaskId: '', hours: '', description: '' });
    fetchWorklogs(selectedDate);
  } catch (error: any) {
    Alert.alert('Lỗi', error.message || 'Không thể lưu worklog');
  }
};
```

### Thay thế handleUpdateWorklog:
```typescript
const handleUpdateWorklog = async () => {
  if (!editingWorklog) return;
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    await updateWorklog(editingWorklog.id, {
      userId: parseInt(userId),
      taskId: formData.taskId ? parseInt(formData.taskId) : null,
      subtaskId: formData.subtaskId ? parseInt(formData.subtaskId) : null,
      hours: parseFloat(formData.hours),
      note: formData.description,
      date: selectedDate.toISOString().split('T')[0],
    });

    Alert.alert('Thành công', 'Đã cập nhật worklog');
    setIsEditModalOpen(false);
    setEditingWorklog(null);
    fetchWorklogs(selectedDate);
  } catch (error: any) {
    Alert.alert('Lỗi', error.message || 'Không thể cập nhật worklog');
  }
};
```

### Thay thế handleDeleteWorklog:
```typescript
const handleDeleteWorklog = (id: number) => {
  Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa worklog này?', [
    { text: 'Hủy', style: 'cancel' },
    {
      text: 'Xóa',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteWorklog(id);
          Alert.alert('Thành công', 'Đã xóa worklog');
          fetchWorklogs(selectedDate);
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể xóa worklog');
        }
      },
    },
  ]);
};
```

---

## 2. Profile Screen (member-profile/index.tsx)

### Import cần thiết:
```typescript
import { getMyProfile, updateMyProfile, uploadAvatar } from '../../../src/axios/api';
```

### Thay thế fetchProfile:
```typescript
const fetchProfile = async () => {
  try {
    setIsLoading(true);
    const userData = await getMyProfile();
    
    const transformedProfile: UserProfile = {
      id: userData.id,
      manv: userData.manv,
      fullName: userData.hoten || '',
      email: userData.email || '',
      phone: userData.sdt || '',
      avatar: userData.avatar || '',
      role: userData.role || 'member',
      chucvu: userData.chucvu || '',
      address: userData.address || '',
      dateOfBirth: userData.dateOfBirth || '',
    };
    
    setProfile(transformedProfile);
    setProfileForm({
      fullName: transformedProfile.fullName,
      email: transformedProfile.email,
      phone: transformedProfile.phone,
      address: transformedProfile.address || '',
      dateOfBirth: transformedProfile.dateOfBirth || '',
    });
    setIsLoading(false);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    Alert.alert('Lỗi', error.message || 'Không thể tải hồ sơ');
    setIsLoading(false);
  }
};
```

### Thay thế handleSaveProfile:
```typescript
const handleSaveProfile = async () => {
  try {
    await updateMyProfile({
      hoten: profileForm.fullName,
      sdt: profileForm.phone,
      chucvu: profile?.chucvu,
    });
    
    Alert.alert('Thành công', 'Đã cập nhật hồ sơ');
    setIsEditing(false);
    fetchProfile();
  } catch (error: any) {
    Alert.alert('Lỗi', error.message || 'Không thể cập nhật hồ sơ');
  }
};
```

### Thay thế handleChangePassword:
```typescript
const handleChangePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
    return;
  }

  try {
    await updateMyProfile({ password: passwordForm.newPassword });
    
    Alert.alert('Thành công', 'Đã đổi mật khẩu');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  } catch (error: any) {
    Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
  }
};
```

---

## 3. Dashboard Screen (member-dashboard/index.tsx)

### Import cần thiết:
```typescript
import { getMemberStats, getTodayTasks, getUpcomingTasks, getRecentActivities } from '../../../src/axios/api';
```

### Thay thế fetchDashboardData:
```typescript
const fetchDashboardData = async () => {
  try {
    setIsLoading(true);
    
    const [statsData, todayData, upcomingData, activitiesData] = await Promise.all([
      getMemberStats(),
      getTodayTasks(),
      getUpcomingTasks(7),
      getRecentActivities(10),
    ]);
    
    setStats({
      totalTasks: statsData.totalTasks || 0,
      completedTasks: statsData.completedTasks || 0,
      inProgressTasks: statsData.inProgressTasks || 0,
      overdueTask: statsData.overdueTasks || 0,
    });
    
    setTodayTasks(todayData.tasks || []);
    setUpcomingDeadlines(upcomingData.tasks || []);
    setRecentActivities(activitiesData.activities || []);
    
    setIsLoading(false);
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    Alert.alert('Lỗi', error.message || 'Không thể tải dữ liệu dashboard');
    setIsLoading(false);
  }
};
```

---

## 4. Tasks Screen (member-tasks/index.tsx)

### Import cần thiết:
```typescript
import { getMemberTasks, updateMemberTaskStatus, updateMemberSubtaskStatus } from '../../../src/axios/api';
```

### Thay thế fetchTasks:
```typescript
const fetchTasks = async () => {
  try {
    setIsLoading(true);
    const data = await getMemberTasks({
      status: filters.status,
      priority: filters.priority,
      search: searchQuery,
    });
    
    setTasks(data.tasks || []);
    setIsLoading(false);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    Alert.alert('Lỗi', error.message || 'Không thể tải danh sách công việc');
    setIsLoading(false);
  }
};
```

---

## 5. Projects Screen (member-projects/index.tsx)

### Import cần thiết:
```typescript
import { getMemberProjects } from '../../../src/axios/api';
```

### Thay thế fetchProjects:
```typescript
const fetchProjects = async () => {
  try {
    setIsLoading(true);
    const data = await getMemberProjects();
    
    setProjects(data.projects || []);
    setIsLoading(false);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    Alert.alert('Lỗi', error.message || 'Không thể tải danh sách dự án');
    setIsLoading(false);
  }
};
```

---

## Lưu ý quan trọng:

1. **Xóa tất cả mock data** trong các hàm setTimeout
2. **Thêm AsyncStorage** import để lấy userId khi cần
3. **Transform data** từ API response để match với interface component
4. **Error handling** đầy đủ với Alert.alert
5. **Loading states** để UX tốt hơn
6. **Refresh** sau khi create/update/delete thành công

## Test API:
- Đảm bảo backend đang chạy trên http://localhost:5000
- Kiểm tra token còn hạn (xem trong AsyncStorage)
- Xem console logs để debug API calls
