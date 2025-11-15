# HƯỚNG DẪN CẬP NHẬT TIMESHEET VỚI API THẬT

Đã backup file cũ: `app/(tabs)/member-timesheet/index.tsx.backup`

##1. Imports đã được thêm sẵn (DONE):
```typescript
import { getMyWorklogs, createWorklog, updateWorklog, deleteWorklog, getMyTasks } from '../../../src/axios/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

## 2. CẬP NHẬT HÀM fetchWorklogs (Dòng ~50):
Thay thế từ dòng `const fetchWorklogs = async (date: Date) => {` đến hết hàm bằng:

```typescript
const fetchWorklogs = async (date: Date) => {
  try {
    setIsLoading(true);
    const dateString = date.toISOString().split('T')[0];
    const data = await getMyWorklogs({ date: dateString });
    
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
    setWorklogs([]);
    setIsLoading(false);
  }
};
```

## 3. CẬP NHẬT HÀM fetchTasks (Dòng ~100):
Thay thế TODO comment bằng:

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
      completedSubtasks: 0,
      totalSubtasks: 0,
    }));
    
    setTasks(transformedTasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    setTasks([]);
  }
};
```

## 4. CẬP NHẬT HÀM handleCreateWorklog (Dòng ~260):
Thay thế hàm với:

```typescript
const handleCreateWorklog = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số giờ hợp lệ');
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

## 5. CẬP NHẬT HÀM handleUpdateWorklog (Dòng ~280):
```typescript
const handleUpdateWorklog = async () => {
  if (!editingWorklog) return;
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số giờ hợp lệ');
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

## 6. CẬP NHẬT HÀM handleDeleteWorklog (Dòng ~300):
Thay thế TODO trong onPress của button Xóa:

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

## KIỂM TRA SAU KHI CẬP NHẬT:
1. Chạy backend server: `cd BE && node index.js`
2. Login để có token
3. Vào tab Timesheet
4. Test các chức năng: xem danh sách, tạo mới, sửa, xóa
5. Kiểm tra không còn lỗi encoding tiếng Việt

