# TÀI LIỆU CÀI ĐẶT VÀ CẤU HÌNH HỆ THỐNG BACKEND
## Hệ thống Quản lý Công việc - Backend Service

---

## I. TỔNG QUAN HỆ THỐNG

### 1.1. Giới thiệu
Hệ thống Backend cung cấp các API và dịch vụ xử lý nghiệp vụ cho ứng dụng Quản lý Công việc, bao gồm quản lý dự án, phân công nhiệm vụ, trò chuyện thời gian thực, và trợ lý AI thông minh.

### 1.2. Kiến trúc hệ thống
```
┌─────────────────────────────────────────────────────┐
│              CLIENT APPLICATIONS                    │
│   (Web Frontend, Mobile App, Admin Dashboard)      │
└────────────┬────────────────────────────────────────┘
             │ HTTP/HTTPS, WebSocket
             ▼
┌─────────────────────────────────────────────────────┐
│           EXPRESS.JS SERVER (PORT 5000)             │
│  ┌──────────────────────────────────────────────┐  │
│  │  Middleware Layer                            │  │
│  │  - CORS, Body Parser, Authentication        │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Route Handlers                              │  │
│  │  - Auth, Users, Tasks, Projects, Chat       │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Service Layer                               │  │
│  │  - AI Service (Gemini)                       │  │
│  │  - Socket Service (Chat Real-time)           │  │
│  │  - Firebase Push Service                     │  │
│  │  - Email Service                             │  │
│  │  - Deadline Scheduler                        │  │
│  └──────────────────────────────────────────────┘  │
└────────────┬───────────────────┬────────────────────┘
             │                   │
             ▼                   ▼
┌─────────────────────┐   ┌──────────────────────────┐
│   MySQL Database    │   │  External Services       │
│   (Port 3306)       │   │  - Google Gemini AI      │
│   - QLCV Schema     │   │  - Firebase FCM          │
│   - 20+ Tables      │   │  - Email SMTP Server     │
└─────────────────────┘   └──────────────────────────┘
```

### 1.3. Các thành phần chính

| Thành phần | Công nghệ | Phiên bản | Mục đích |
|------------|-----------|-----------|----------|
| Runtime | Node.js | 20.x LTS | Môi trường thực thi JavaScript |
| Web Framework | Express.js | 5.1.0 | Xử lý HTTP requests/responses |
| Database ORM | Sequelize | 6.37.7 | Object-Relational Mapping |
| Real-time | Socket.IO | 4.7.2 | WebSocket cho chat |
| AI Engine | Google Gemini | API v1 | Trợ lý AI và semantic search |
| Push Notification | Firebase Admin SDK | 13.6.0 | Gửi thông báo đến mobile |
| Authentication | JWT | 9.0.2 | Xác thực người dùng |
| Task Scheduling | node-cron | 4.2.1 | Lập lịch công việc |
| Database | MySQL | 8.0 | Hệ quản trị cơ sở dữ liệu |

---

## II. YÊU CẦU HỆ THỐNG

### 2.1. Yêu cầu phần cứng

| Cấu hình | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores, 2.0 GHz | 4 cores, 3.0 GHz |
| RAM | 4 GB | 8 GB |
| Ổ cứng | 10 GB | 50 GB SSD |
| Network | Internet ổn định | Băng thông cao |

### 2.2. Yêu cầu phần mềm

**Hệ điều hành:** Windows 10/11 (64-bit)

**Phần mềm cần thiết:**
```
├── Node.js >= 20.0.0 (LTS)
├── npm >= 10.0.0
├── MySQL >= 8.0
├── Git >= 2.30
└── Docker >= 20.10 (tùy chọn)
```

### 2.3. Tài khoản dịch vụ bên ngoài

| Dịch vụ | Mục đích | Đăng ký tại |
|---------|----------|-------------|
| Google Cloud | Gemini AI API | https://makersuite.google.com |
| Firebase | Push Notifications | https://console.firebase.google.com |
| Email SMTP | Gửi email thông báo | Gmail/SendGrid |

---

## III. CÀI ĐẶT MÔI TRƯỜNG

### 3.1. Cài đặt Node.js

```powershell
# Tải và cài đặt từ: https://nodejs.org
# Chọn phiên bản 20.x LTS

# Verify installation
node --version    # Kỳ vọng: v20.x.x
npm --version     # Kỳ vọng: 10.x.x
```

### 3.2. Cài đặt MySQL

```powershell
# Tải MySQL Installer từ: https://dev.mysql.com/downloads/installer/
# Chọn MySQL Server 8.0

# Cấu hình trong quá trình cài đặt:
# - Port: 3306
# - Root password: [tự đặt mật khẩu mạnh]
# - Authentication: Use Strong Password Encryption
```

**Tạo cơ sở dữ liệu:**
```sql
-- Kết nối MySQL
mysql -u root -p

-- Tạo database
CREATE DATABASE qlcv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user (khuyến nghị cho production)
CREATE USER 'qlcv_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON qlcv.* TO 'qlcv_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3.3. Clone và cài đặt project

```powershell
# Clone repository
git clone <repository-url>
cd BE

# Cài đặt dependencies
npm install

# Verify
npm list express sequelize socket.io
```

---

## IV. CẤU HÌNH HỆ THỐNG

### 4.1. Cấu hình Database (config/config.json)

```json
{
  "development": {
    "username": "root",
    "password": "your_password",
    "database": "qlcv",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "logging": false,
    "timezone": "+07:00"
  },
  "production": {
    "username": "qlcv_user",
    "password": "production_password",
    "database": "qlcv",
    "host": "production-db-host",
    "dialect": "mysql",
    "pool": {
      "max": 10,
      "min": 2,
      "acquire": 30000,
      "idle": 10000
    }
  }
}
```

### 4.2. Cấu hình biến môi trường (.env)

Tạo file `.env` trong thư mục gốc:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=qlcv
DB_USER=root
DB_PASSWORD=your_password

# JWT Authentication
SECRET_KEY=your_jwt_secret_key_minimum_32_characters_long
REFRESH_SECRET=your_refresh_token_secret_key_also_32_chars

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Google Gemini AI
GOOGLE_AI_KEY=your_google_gemini_api_key

# Firebase (file JSON phải có trong thư mục gốc)
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### 4.3. Cấu hình các dịch vụ

#### a) JWT Secret Keys
```powershell
# Tạo secret key mạnh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output vào SECRET_KEY và REFRESH_SECRET
```

#### b) Email (Gmail)
```
1. Đăng nhập Gmail
2. Google Account Settings > Security
3. Bật "2-Step Verification"
4. Tạo "App Password" cho Mail
5. Copy vào EMAIL_PASS
```

#### c) Google Gemini AI
```
1. Truy cập: https://makersuite.google.com/app/apikey
2. Tạo API Key mới
3. Copy vào GOOGLE_AI_KEY
```

#### d) Firebase
```
1. Truy cập: https://console.firebase.google.com
2. Project Settings > Service Accounts
3. Generate New Private Key
4. Đổi tên file thành: mobileqlcv-firebase-adminsdk-fbsvc-b4a4a229c7.json
5. Đặt file vào thư mục gốc BE
```

### 4.4. Chạy Migrations

```powershell
# Tạo bảng trong database
npx sequelize-cli db:migrate

# Seed dữ liệu mẫu (optional)
npx sequelize-cli db:seed:all

# Kiểm tra
mysql -u root -p qlcv -e "SHOW TABLES;"
```

---

## V. KHỞI ĐỘNG HỆ THỐNG

### 5.1. Development Mode

```powershell
# Chạy với nodemon (auto-reload)
npm run dev1

# Output mong đợi:
# 🚀 Server running at http://localhost:5000
# 💬 Socket.IO enabled for realtime chat
# 🤖 AI Service initialized
# ✅ Deadline Scheduler started
```

### 5.2. Production Mode (Docker)

```powershell
# Build và start
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### 5.3. Kiểm tra hệ thống

```powershell
# Test server
curl http://localhost:5000/

# Test login
curl -X POST http://localhost:5000/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"Test123!\"}'
```

---

## VI. CẤU HÌNH CÁC DỊCH VỤ NÂNG CAO

### 6.1. AI Service (Google Gemini)

#### Kiến trúc
```
User Question → Intent Analysis → Fetch Data → Vector Embeddings 
→ Semantic Search → Gemini API → AI Response
```

#### Thuật toán Vector Embeddings

**Mô tả:** Chuyển đổi văn bản thành vector 768 chiều, tính độ tương đồng cosine để tìm dữ liệu liên quan.

**Công thức Cosine Similarity:**

$$\text{similarity}(A, B) = \frac{A \cdot B}{\|A\| \times \|B\|} = \frac{\sum_{i=1}^{768} A_i \times B_i}{\sqrt{\sum_{i=1}^{768} A_i^2} \times \sqrt{\sum_{i=1}^{768} B_i^2}}$$

**Implementation:**
```javascript
cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB); // Kết quả: [0, 1]
}
```

**Độ phức tạp:**
- Time: O(n × (m + 768)), n = số văn bản, m = độ dài
- Space: O(n × 768)

#### Cấu hình AI
```javascript
const AI_CONFIG = {
    MODEL: 'gemini-2.5-flash',
    EMBEDDING_MODEL: 'text-embedding-004',
    MAX_OUTPUT_TOKENS: 2048,
    TEMPERATURE: 0.3,
    TOP_SIMILAR_TASKS: 20,
    TOP_SIMILAR_PROJECTS: 15
};
```

### 6.2. Real-time Chat (Socket.IO)

#### Kiến trúc
```
Client → WebSocket Handshake → Authentication → Join Rooms 
→ Event Handlers → Database → Broadcast to Clients
```

#### Các sự kiện chính
```javascript
// Connection events
socket.on('connection')         // Kết nối
socket.on('disconnect')         // Ngắt kết nối

// Chat events
socket.on('conversation:join')  // Tham gia conversation
socket.on('message:send')       // Gửi tin nhắn
socket.on('typing:start')       // Đang gõ
socket.on('message:read')       // Đã đọc

// Call events (WebRTC)
socket.on('call:request')       // Yêu cầu gọi
socket.on('webrtc:offer')       // SDP offer
socket.on('webrtc:answer')      // SDP answer
```

### 6.3. Push Notifications (Firebase)

#### Flow
```
Event Trigger → Get Device Tokens → Prepare Message → Firebase FCM 
→ Send to Devices → Handle Invalid Tokens
```

#### Cấu hình
```javascript
const message = {
    notification: { title, body },
    data: { type, screen, ...customData },
    android: {
        priority: 'high',
        notification: {
            channelId: 'default',
            sound: 'default'
        }
    }
};
```

### 6.4. Deadline Scheduler (node-cron)

#### Thuật toán
```
1. Lấy tất cả subtasks chưa hoàn thành
2. Tính số ngày còn lại: daysLeft = (deadline - today) / 86400000
3. Nếu daysLeft ∈ {7, 3, 1, 0} → Gửi thông báo
4. Lặp lại mỗi ngày lúc 6:00 AM và 9:00 AM
```

#### Cấu hình
```javascript
// Chạy lúc 6:00 sáng mỗi ngày
cron.schedule('0 6 * * *', checkDeadlines, {
    timezone: "Asia/Ho_Chi_Minh"
});

// Cron syntax: minute hour day month dayOfWeek
// 0 6 * * * = 6:00 AM mỗi ngày
```

---

## VII. XỬ LÝ LỖI THƯỜNG GẶP

### 7.1. Database Connection Error

**Lỗi:** `SequelizeConnectionError: Access denied`

**Giải pháp:**
```powershell
# Kiểm tra MySQL
Get-Service MySQL80

# Kiểm tra credentials
type .env | Select-String "DB_"

# Reset password
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 7.2. Port Already in Use

**Lỗi:** `EADDRINUSE: address already in use :::5000`

**Giải pháp:**
```powershell
# Tìm process
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
PORT=5001
```

### 7.3. Firebase Error

**Lỗi:** `Could not load the default credentials`

**Giải pháp:**
```powershell
# Kiểm tra file
dir mobileqlcv-firebase-adminsdk*.json

# Verify có thể đọc
type mobileqlcv-firebase-adminsdk-fbsvc-b4a4a229c7.json
```

### 7.4. AI API Rate Limit

**Lỗi:** `429 Too Many Requests`

**Giải pháp:**
```javascript
// Implement retry với exponential backoff
async function callWithRetry(prompt, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            if (error.status === 429 && i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, delay));
            } else throw error;
        }
    }
}
```

---

## VIII. BẢO MẬT HỆ THỐNG

### 8.1. Security Best Practices

```javascript
// 1. Helmet.js - Bảo vệ HTTP headers
const helmet = require('helmet');
app.use(helmet());

// 2. Rate Limiting - Chống DDoS
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));

// 3. SQL Injection Prevention
// ✅ Dùng Sequelize ORM với parameterized queries
User.findAll({ where: { email: userInput } });

// 4. XSS Prevention
const validator = require('validator');
const clean = validator.escape(req.body.input);

// 5. CSRF Protection
const csrf = require('csurf');
app.use(csrf({ cookie: true }));
```

### 8.2. Environment Security

```powershell
# Không commit .env
Add-Content .gitignore ".env"

# Sử dụng strong secrets (minimum 32 chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## IX. BACKUP VÀ MONITORING

### 9.1. Database Backup

```powershell
# Backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
mysqldump -u root -p qlcv > "backup_$timestamp.sql"

# Restore
mysql -u root -p qlcv < backup_20251130_120000.sql

# Automated backup (Task Scheduler)
# Tạo script backup.ps1 và schedule hàng ngày
```

### 9.2. Logging

```javascript
// File: middleware/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

module.exports = logger;
```

### 9.3. Performance Monitoring

```javascript
const monitor = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 2000) {
            console.warn(`⚠️ Slow request: ${req.url} (${duration}ms)`);
        }
    });
    next();
};
```

---

## X. DEPLOYMENT

### 10.1. Process Manager (PM2)

```powershell
# Cài đặt
npm install -g pm2

# Start
pm2 start index.js --name qlcv-backend

# Auto-restart (Windows)
npm install -g pm2-windows-startup
pm2-startup install
pm2 save

# Monitor
pm2 monit
pm2 logs qlcv-backend
```

### 10.2. Docker Deployment

```yaml
# docker-compose.yml
version: "3.8"
services:
  backend:
    build: .
    ports: ["5000:5000"]
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
    depends_on: [mysql]
  
  mysql:
    image: mysql:8.0
    ports: ["3307:3306"]
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=qlcv
```

---

## XI. KẾT LUẬN

### 11.1. Tóm tắt

Tài liệu này cung cấp hướng dẫn chi tiết về:
- ✅ Môi trường cài đặt (Windows, Node.js, MySQL)
- ✅ Cấu hình hệ thống (Database, Environment variables)
- ✅ Các dịch vụ nâng cao (AI, Socket.IO, Firebase)
- ✅ Thuật toán và kiến trúc
- ✅ Bảo mật và deployment

### 11.2. Tham khảo

- **Node.js**: https://nodejs.org/docs
- **Express.js**: https://expressjs.com
- **Sequelize**: https://sequelize.org/docs
- **Socket.IO**: https://socket.io/docs
- **Google Gemini**: https://ai.google.dev/docs
- **Firebase**: https://firebase.google.com/docs

---

**Phiên bản:** 1.0  
**Ngày cập nhật:** 30/11/2025  
**Tuân thủ:** IEEE 829-2008, IEEE 1016-2009
