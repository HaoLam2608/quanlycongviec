# 🔐 PHÂN QUYỀN HỆ THỐNG QUẢN LÝ CÔNG VIỆC

## 📊 Tổng quan các Role

### 1. 👑 ADMIN (Quản trị viên hệ thống)
**Tổng số quyền: 24 quyền**

#### Quyền đầy đủ (Full Access):
- ✅ **Users**: read, create, update, delete
- ✅ **Projects**: read, create, update, delete
- ✅ **Tasks**: read, create, update, delete
- ✅ **Groups**: read, create, update, delete
- ✅ **Roles**: read, create, update, delete
- ✅ **Permissions**: read
- ✅ **Reports**: read
- ✅ **Settings**: read, update

**Mô tả**: Quản trị viên có toàn quyền trên hệ thống, bao gồm quản lý người dùng, phân quyền, cấu hình hệ thống.

---

### 2. 📋 MANAGER (Quản lý dự án)
**Tổng số quyền: 16 quyền**

#### Quyền được cấp:
- ✅ **Users**: read, create, update (❌ không có delete)
- ✅ **Projects**: read, create, update, delete
- ✅ **Tasks**: read, create, update, delete
- ✅ **Groups**: read, create, update, delete
- ✅ **Reports**: read
- ❌ **Roles**: Không có quyền
- ❌ **Permissions**: Không có quyền
- ❌ **Settings**: Không có quyền

**Mô tả**: Manager có quyền quản lý dự án, công việc, nhóm và người dùng (trừ xóa người dùng). Không được quản lý roles và permissions.

---

### 3. 👤 EMPLOYEE (Nhân viên)
**Tổng số quyền: 6 quyền**

#### Quyền được cấp:
- ✅ **Users**: read
- ✅ **Projects**: read
- ✅ **Tasks**: read, update (chỉ tasks của mình)
- ✅ **Groups**: read
- ✅ **Reports**: read
- ❌ **Create/Delete**: Không có quyền tạo hoặc xóa

**Mô tả**: Employee chỉ có thể xem thông tin và cập nhật công việc được giao cho mình. Workflow phê duyệt áp dụng khi hoàn thành công việc.

---

### 4. 👥 TEAMLEADER (Trưởng nhóm)
**Tổng số quyền: 8 quyền**

#### Quyền được cấp:
- ✅ **Groups**: read, create, update (❌ không có delete)
- ✅ **Tasks**: read, create, update (❌ không có delete)
- ✅ **Projects**: read
- ✅ **Reports**: read
- ❌ **Users**: Không có quyền quản lý người dùng

**Mô tả**: Teamleader có thể tạo và quản lý nhóm, phân công công việc cho thành viên nhóm. Sử dụng giao diện employee nhưng với quyền mở rộng.

---

## 🔄 So sánh quyền giữa các Role

| Permission | Admin | Manager | Employee | TeamLeader |
|------------|-------|---------|----------|------------|
| **Users** |
| - Read | ✅ | ✅ | ✅ | ❌ |
| - Create | ✅ | ✅ | ❌ | ❌ |
| - Update | ✅ | ✅ | ❌ | ❌ |
| - Delete | ✅ | ❌ | ❌ | ❌ |
| **Projects** |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Create | ✅ | ✅ | ❌ | ❌ |
| - Update | ✅ | ✅ | ❌ | ❌ |
| - Delete | ✅ | ✅ | ❌ | ❌ |
| **Tasks** |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Create | ✅ | ✅ | ❌ | ✅ |
| - Update | ✅ | ✅ | ✅* | ✅ |
| - Delete | ✅ | ✅ | ❌ | ❌ |
| **Groups** |
| - Read | ✅ | ✅ | ✅ | ✅ |
| - Create | ✅ | ✅ | ❌ | ✅ |
| - Update | ✅ | ✅ | ❌ | ✅ |
| - Delete | ✅ | ✅ | ❌ | ❌ |
| **Reports** |
| - Read | ✅ | ✅ | ✅ | ✅ |
| **Roles** |
| - Full Access | ✅ | ❌ | ❌ | ❌ |
| **Permissions** |
| - Read | ✅ | ❌ | ❌ | ❌ |
| **Settings** |
| - Read/Update | ✅ | ❌ | ❌ | ❌ |

*\* Employee chỉ có thể update tasks của chính mình, với workflow phê duyệt khi hoàn thành*

---

## 📝 Ghi chú quan trọng

1. **Workflow phê duyệt**: Employee khi đánh dấu công việc "Hoàn thành" sẽ chuyển sang trạng thái "Chờ xác nhận hoàn thành", cần Manager/Admin phê duyệt.

2. **Phân quyền động**: Hệ thống sử dụng RBAC (Role-Based Access Control) với middleware kiểm tra quyền tự động.

3. **Bảo mật**: Admin không thể bị xóa bởi bất kỳ role nào khác. Manager không thể thay đổi roles và permissions.

4. **Mở rộng**: Có thể thêm permissions mới và gán cho roles thông qua seeders.

---

## 🚀 Cách chạy seeders

```bash
# Cấp quyền cho Manager
npx sequelize-cli db:seed --seed 20251111000001-manager-permissions.js

# Cấp quyền cho Employee
npx sequelize-cli db:seed --seed 20251111000002-employee-permissions.js

# Cấp quyền cho TeamLeader
npx sequelize-cli db:seed --seed 20251111000000-teamleader-permissions.js

# Kiểm tra quyền của tất cả roles
node check-role-permissions.js
```

---

## 📅 Lịch sử cập nhật

- **2025-11-11**: Cấp đầy đủ quyền cho Manager (16 permissions)
- **2025-11-11**: Cấp quyền cơ bản cho Employee (6 permissions)
- **2025-11-11**: Cấp quyền cho TeamLeader (8 permissions)
- **2025-11-11**: Tạo script kiểm tra permissions (`check-role-permissions.js`)
