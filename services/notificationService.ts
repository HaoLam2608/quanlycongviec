import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Cấu hình cách hiển thị thông báo khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface TaskNotification {
  id: number;
  title: string;
  deadline: string;
  daysLeft: number;
  type: 'task' | 'subtask';
  priority?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Yêu cầu quyền thông báo từ người dùng
   */
  async requestPermissions(): Promise<boolean> {
    // Cho phép test trên emulator
    if (!Device.isDevice) {
      console.log('⚠️ Đang chạy trên emulator - thông báo có thể không hoạt động đầy đủ');
      // return true để tiếp tục test
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Không có quyền thông báo!');
      return false;
    }

    // Thiết lập channel cho Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('deadline-reminders', {
        name: 'Nhắc nhở deadline',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
        sound: 'default',
      });
    }

    return true;
  }

  /**
   * Lấy Expo Push Token để gửi thông báo từ server
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    // Cho phép test trên emulator
    if (!Device.isDevice) {
      console.log('⚠️ Đang chạy trên emulator - bỏ qua push token');
      return 'EMULATOR_MOCK_TOKEN'; // Mock token cho emulator
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Thay bằng project ID thực tế từ app.json
      });
      this.expoPushToken = tokenData.data;
      console.log('Expo Push Token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('Lỗi khi lấy push token:', error);
      return null;
    }
  }

  /**
   * Hủy tất cả thông báo đã lên lịch
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Hủy thông báo theo ID
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Lên lịch thông báo cho một task/subtask
   */
  async scheduleTaskDeadlineNotification(task: TaskNotification): Promise<string | null> {
    try {
      const deadline = new Date(task.deadline);
      const now = new Date();

      // Kiểm tra deadline đã qua chưa
      if (deadline <= now) {
        return null;
      }

      const notificationIds: string[] = [];

      // Tính toán thời gian còn lại
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Thông báo 1: 7 ngày trước deadline
      if (daysLeft >= 7) {
        const sevenDaysBefore = new Date(deadline);
        sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
        sevenDaysBefore.setHours(9, 0, 0, 0); // 9h sáng

        if (sevenDaysBefore > now) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '📅 Nhắc nhở: Deadline còn 7 ngày',
              body: `"${task.title}" sẽ hết hạn vào ${deadline.toLocaleDateString('vi-VN')}`,
              data: { taskId: task.id, type: task.type, daysLeft: 7 },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: sevenDaysBefore,
          });
          notificationIds.push(id);
        }
      }

      // Thông báo 2: 3 ngày trước deadline
      if (daysLeft >= 3) {
        const threeDaysBefore = new Date(deadline);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
        threeDaysBefore.setHours(9, 0, 0, 0);

        if (threeDaysBefore > now) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '⚠️ Cảnh báo: Deadline còn 3 ngày',
              body: `"${task.title}" sắp hết hạn. Hãy hoàn thành càng sớm càng tốt!`,
              data: { taskId: task.id, type: task.type, daysLeft: 3 },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: threeDaysBefore,
          });
          notificationIds.push(id);
        }
      }

      // Thông báo 3: 1 ngày trước deadline
      if (daysLeft >= 1) {
        const oneDayBefore = new Date(deadline);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        oneDayBefore.setHours(9, 0, 0, 0);

        if (oneDayBefore > now) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🚨 Khẩn cấp: Deadline còn 1 ngày!',
              body: `"${task.title}" sẽ hết hạn vào ngày mai!`,
              data: { taskId: task.id, type: task.type, daysLeft: 1 },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: oneDayBefore,
          });
          notificationIds.push(id);
        }
      }

      // Thông báo 4: Vào ngày deadline (6h sáng)
      const deadlineDay = new Date(deadline);
      deadlineDay.setHours(6, 0, 0, 0);

      if (deadlineDay > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔴 HÔM NAY LÀ DEADLINE!',
            body: `"${task.title}" hết hạn hôm nay. Hãy hoàn thành ngay!`,
            data: { taskId: task.id, type: task.type, daysLeft: 0 },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: deadlineDay,
        });
        notificationIds.push(id);
      }

      console.log(`Đã lên lịch ${notificationIds.length} thông báo cho task ${task.id}`);
      return notificationIds[0] || null;
    } catch (error) {
      console.error('Lỗi khi lên lịch thông báo:', error);
      return null;
    }
  }

  /**
   * Lên lịch thông báo cho nhiều task
   */
  async scheduleMultipleTaskNotifications(tasks: TaskNotification[]): Promise<void> {
    // Hủy tất cả thông báo cũ trước
    await this.cancelAllScheduledNotifications();

    // Lọc các task có deadline trong tương lai
    const upcomingTasks = tasks.filter((task) => {
      const deadline = new Date(task.deadline);
      return deadline > new Date();
    });

    console.log(`Đang lên lịch thông báo cho ${upcomingTasks.length} task...`);

    // Lên lịch cho từng task
    const promises = upcomingTasks.map((task) =>
      this.scheduleTaskDeadlineNotification(task)
    );

    await Promise.all(promises);
    console.log('Đã lên lịch thông báo thành công!');
  }

  /**
   * Gửi thông báo ngay lập tức (local notification)
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // null = gửi ngay
    });
  }

  /**
   * Lấy tất cả thông báo đã lên lịch
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Xóa tất cả thông báo đã nhận
   */
  async dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Lấy số lượng thông báo chưa đọc (badge)
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Đặt số lượng badge
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Thiết lập listener cho thông báo khi app đang mở
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Thiết lập listener cho khi user tap vào thông báo
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService();
