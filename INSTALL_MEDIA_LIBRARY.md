# Cài đặt expo-media-library

## Bước 1: Cài đặt package

Mở **Git Bash** hoặc **Command Prompt** (CMD), sau đó chạy:

```bash
cd C:/Users/GIGABYTE/Desktop/mobile
npx expo install expo-media-library
```

Hoặc nếu dùng npm:

```bash
cd C:/Users/GIGABYTE/Desktop/mobile
npm install expo-media-library
```

## Bước 2: Cấu hình Android permissions (nếu cần)

File `app.json` có thể cần thêm permission cho Android:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## Bước 3: Rebuild app

Sau khi cài xong, rebuild app:

```bash
npx expo start
```

## Tính năng mới

Khi xuất báo cáo trên Android:
- ✅ File sẽ được lưu **trực tiếp vào thư mục Downloads**
- ✅ Không cần qua dialog chia sẻ
- ✅ Hiển thị tên file đã lưu
- ✅ Nếu không có quyền, sẽ fallback sang chế độ chia sẻ

Trên iOS:
- Vẫn sử dụng Share Sheet (iOS không có Downloads folder công khai)
