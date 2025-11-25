# 🚀 AI Service V2 - Deployment Guide

## ⚡ Quick Start (5 phút)

### 1. Chuẩn bị
```bash
# Đảm bảo đã có Google AI API key
echo "GOOGLE_AI_KEY=your_key_here" >> .env

# Install dependencies (nếu chưa có)
npm install @google/generative-ai
```

### 2. Deploy
```bash
# Đã tạo sẵn file aiService.v2.js
# Chỉ cần update controller

# File đã được update tự động:
# - controllers/aiController.js (đã import aiService.v2)
```

### 3. Test
```bash
# Restart server
npm run dev1

# Hoặc
node index.js

# Test bằng terminal khác
node test-ai-v2.js
```

### 4. Verify
```bash
# Test qua API
curl -X POST http://localhost:5000/api/ai/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Có bao nhiêu dự án?"}'
```

## 📋 Checklist trước khi deploy

- [ ] ✅ File `services/aiService.v2.js` đã được tạo
- [ ] ✅ File `controllers/aiController.js` đã được update
- [ ] ✅ `.env` có `GOOGLE_AI_KEY`
- [ ] ✅ Database có dữ liệu test
- [ ] ✅ Đã restart server
- [ ] ✅ Test qua Postman/curl thành công

## 🔄 Rollback Plan (nếu cần)

### Option 1: Nhanh (1 phút)
```javascript
// Sửa file controllers/aiController.js
// Dòng 2: Đổi từ
const aiService = require('../services/aiService.v2');
// Thành
const aiService = require('../services/aiService');

// Restart server
npm run dev1
```

### Option 2: Giữ cả 2 version
```javascript
// controllers/aiController.js
const aiServiceV1 = require('../services/aiService');
const aiServiceV2 = require('../services/aiService.v2');

// Dùng flag để switch
const USE_V2 = process.env.USE_AI_V2 === 'true';
const aiService = USE_V2 ? aiServiceV2 : aiServiceV1;
```

Thêm vào `.env`:
```
USE_AI_V2=true   # Dùng V2
# USE_AI_V2=false  # Dùng V1
```

## 🧪 Testing Strategy

### Level 1: Unit Tests
```bash
node test-ai-v2.js
```

### Level 2: Integration Tests
```bash
# Test qua Postman collection
# Import file: postman_ai_tests.json

# Hoặc dùng curl script
bash test-ai-endpoints.sh
```

### Level 3: User Acceptance Testing
```
1. Login vào frontend
2. Vào trang AI Chat
3. Test các câu hỏi:
   - "Có bao nhiêu dự án?"
   - "Tôi đang làm gì?"
   - "Có cái nào quá hạn không?"
   - "Lan Anh đang làm những dự án nào?"
```

## 📊 Monitoring & Logs

### Logs cần chú ý
```
✅ Good signs:
🤖 AI Service V2 initialized with Gemini 2.5 Flash
🎯 Intent: { action: 'count', entities: ['project'] }
📊 Context fetched: { users: 10, projects: 11, tasks: 25 }
✅ AI Response: ...

❌ Warning signs:
⚠️ No AI API key found
❌ AI Query Error: ...
⚠️ Empty AI response
```

### Health Check
```bash
# Tạo endpoint health check
GET /api/ai/health

# Response:
{
  "status": "ok",
  "version": "v2",
  "model": "gemini-2.5-flash",
  "uptime": 12345
}
```

## 🔧 Troubleshooting

### Problem 1: "Cannot find module aiService.v2"
```bash
# Kiểm tra file tồn tại
ls -la services/aiService.v2.js

# Nếu không có, tạo lại
# Copy từ backup hoặc git
```

### Problem 2: "Empty responses"
```bash
# Check API key
cat .env | grep GOOGLE_AI_KEY

# Test API key
node -e "const ai = require('./services/aiService.v2'); ai.queryDatabase('test', 1)"
```

### Problem 3: "Database errors"
```bash
# Check database connection
node -e "require('./models').sequelize.authenticate()"

# Check data exists
node -e "require('./models').DuAn.findAll().then(r => console.log(r.length))"
```

### Problem 4: "Slow responses"
```bash
# Kiểm tra logs
tail -f logs/server.log | grep "AI"

# Measure response time
time curl -X POST http://localhost:5000/api/ai/ask -d '{"question":"test"}'

# Optimize:
# - Reduce maxOutputTokens
# - Add database indexes
# - Cache frequent queries
```

## 📈 Performance Optimization

### 1. Database Indexes
```sql
-- Add indexes cho frequent queries
CREATE INDEX idx_duan_status ON DuAns(status);
CREATE INDEX idx_duan_userid ON DuAns(userId);
CREATE INDEX idx_task_trangthai ON Tasks(trangThai);
CREATE INDEX idx_task_nguoiduocgiao ON Tasks(nguoiDuocGiaoId);
```

### 2. Caching (Future)
```javascript
// Implement Redis caching
const redis = require('redis');
const cache = redis.createClient();

// Cache user context
const cacheKey = `ai:context:${userId}`;
const cached = await cache.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... fetch data ...
await cache.set(cacheKey, JSON.stringify(context), 'EX', 300); // 5 min
```

### 3. Rate Limiting
```javascript
// Add rate limiting middleware
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many AI requests, please try again later'
});

router.post('/api/ai/ask', aiLimiter, aiController.askAI);
```

## 🎯 Success Metrics

### Mục tiêu ngắn hạn (1 tuần)
- [ ] 95% câu hỏi được trả lời thành công
- [ ] Response time < 3 giây
- [ ] 0 crashes/errors
- [ ] User satisfaction > 80%

### Mục tiêu dài hạn (1 tháng)
- [ ] 98% success rate
- [ ] Response time < 2 giây
- [ ] Support 50+ question types
- [ ] User satisfaction > 90%

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `tail -f logs/server.log`
2. Run test suite: `node test-ai-v2.js`
3. Review documentation: `AI_SERVICE_V2_IMPROVEMENTS.md`
4. Check GitHub issues
5. Contact dev team

## 🎉 Deployment Complete!

Sau khi deploy xong:
1. ✅ Verify logs không có errors
2. ✅ Test ít nhất 5 loại câu hỏi khác nhau
3. ✅ Monitor performance trong 24h đầu
4. ✅ Collect user feedback
5. ✅ Update documentation nếu cần

**Chúc mừng! Bạn đã deploy thành công AI Service V2! 🚀**
