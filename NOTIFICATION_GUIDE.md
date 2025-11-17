# Tính năng Thông báo Deadline Realtime

## Tổng quan

Hệ thống thông báo tự động cho các công việc có deadline sắp tới, giúp member không bỏ lỡ bất kỳ công việc quan trọng nào.

## Cách hoạt động

### 1. Lịch thông báo tự động

Hệ thống sẽ tự động gửi thông báo theo 4 mốc thời gian:

- **7 ngày trước deadline**: Nhắc nhở sớm
- **3 ngày trước deadline**: Cảnh báo
- **1 ngày trước deadline**: Khẩn cấp  
- **Vào ngày deadline** (6h sáng): Hôm nay là deadline!

### 2. Tự động lên lịch

- Khi member mở app, hệ thống tự động:
  - Quét tất cả công việc được giao
  - Lọc những task có deadline trong tương lai
  - Lên lịch thông báo cho từng task
  - Hiển thị thông báo xác nhận

### 3. Cập nhật thông minh

- Mỗi lần refresh dashboard, hệ thống sẽ:
  - Hủy tất cả thông báo cũ
  - Lên lịch lại với dữ liệu mới nhất
  - Đảm bảo không bị trùng lặp

## Hướng dẫn sử dụng

### Bật thông báo lần đầu

1. Mở app và vào màn hình Dashboard
2. Tap vào icon chuông thông báo (góc trên bên phải)
3. Bật switch "Thông báo deadline"
4. Cấp quyền thông báo cho app (nếu được yêu cầu)
5. Nhận thông báo xác nhận

### Quản lý thông báo

#### Xem thông báo đã lên lịch
```
Dashboard > Icon chuông > "Xem thông báo đã lên lịch"
```

#### Gửi thông báo test
```
Dashboard > Icon chuông > "Gửi thông báo thử"
```

#### Tắt thông báo
```
Dashboard > Icon chuông > Tắt switch > Xác nhận
```

### Khi nhận được thông báo

1. **App đang mở**: Thông báo hiện ở đầu màn hình
2. **App đang nền/tắt**: Thông báo hiện trên notification bar
3. **Tap vào thông báo**: Mở app và điều hướng đến task

## Cấu trúc code

### Services

**`services/notificationService.ts`**
- `requestPermissions()`: Yêu cầu quyền thông báo
- `registerForPushNotificationsAsync()`: Đăng ký push token
- `scheduleTaskDeadlineNotification(task)`: Lên lịch cho 1 task
- `scheduleMultipleTaskNotifications(tasks)`: Lên lịch cho nhiều task
- `cancelAllScheduledNotifications()`: Hủy tất cả thông báo
- `sendImmediateNotification()`: Gửi thông báo ngay lập tức
- `getAllScheduledNotifications()`: Lấy danh sách đã lên lịch

### Components

**`components/NotificationSettingsModal.tsx`**
- Modal cài đặt thông báo
- Toggle bật/tắt
- Xem danh sách đã lên lịch
- Test notification

### Integration

**`app/(tabs)/member-dashboard/index.tsx`**
- Khởi tạo notification service
- Tự động lên lịch khi load data
- Listener cho notification events
- UI toggle notification

## Cấu hình

### app.json

```json
{
  "expo": {
    "notification": {
      "color": "#667eea",
      "androidMode": "default",
      "androidCollapsedTitle": "Quản lý công việc"
    },
    "android": {
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK",
        "SCHEDULE_EXACT_ALARM"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      ["expo-notifications", { "color": "#667eea" }]
    ]
  }
}
```

## Dependencies

```json
{
  "expo-notifications": "~0.28.0",
  "expo-task-manager": "~11.8.0", 
  "expo-device": "~6.0.0"
}
```

## Testing

### Test trên thiết bị thật
```bash
# Android
npx expo run:android

# iOS  
npx expo run:ios
```

### Test notification
1. Bật thông báo trong app
2. Tap "Gửi thông báo thử"
3. Kiểm tra notification hiển thị

### Test scheduled notification
1. Lên lịch thông báo cho task có deadline gần
2. Đợi đến thời điểm đã lên lịch
3. Kiểm tra nhận được thông báo

## Lưu ý

### Android
- Cần quyền `SCHEDULE_EXACT_ALARM` cho Android 12+
- Test trên thiết bị thật, không hoạt động tốt trên emulator

### iOS
- Cần push notification entitlement
- Test trên thiết bị thật

### Background
- Thông báo hoạt động cả khi app đóng
- Dữ liệu được lưu trong schedule, không cần app chạy

## Troubleshooting

### Không nhận được thông báo
1. Kiểm tra quyền thông báo trong Settings
2. Kiểm tra danh sách đã lên lịch
3. Đảm bảo deadline trong tương lai
4. Thử gửi thông báo test

### Thông báo bị trùng
- Hệ thống tự động hủy thông báo cũ khi refresh
- Nếu vẫn trùng, tắt rồi bật lại

### Không lên lịch được
- Kiểm tra console log
- Đảm bảo có task với deadline hợp lệ
- Kiểm tra format date của deadline

## Roadmap

- [ ] Tùy chỉnh thời gian nhắc nhở
- [ ] Chọn task cụ thể để nhận thông báo
- [ ] Âm thanh thông báo tùy chỉnh
- [ ] Rich notification với actions
- [ ] Notification history
- [ ] Analytics thông báo

## Support

Liên hệ: [Your email/contact]
