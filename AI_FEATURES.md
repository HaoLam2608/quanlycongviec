# 🤖 AI Features Documentation

## Vector Embedding & Semantic Search

### Tổng quan
AI Service hiện đã tích hợp **vector embeddings** từ Google Gemini `text-embedding-004` để thực hiện **semantic search** (tìm kiếm theo ngữ nghĩa).

### Cách hoạt động

#### 1. **Traditional Search (Trước đây)**
```
User: "công việc về thiết kế UI"
  ↓
SQL WHERE tentask LIKE '%thiết%' OR tentask LIKE '%kế%' OR tentask LIKE '%UI%'
  ↓
Kết quả: Chỉ match nếu có từ khóa chính xác
```

#### 2. **Semantic Search (Hiện tại)**
```
User: "công việc về thiết kế giao diện"
  ↓
1. Convert câu hỏi → vector embedding (768 dimensions)
2. Convert mỗi task → vector embedding
3. Tính cosine similarity giữa các vectors
4. Sắp xếp theo similarity score (0-1)
  ↓
Kết quả: Tìm được tasks về "thiết kế UI", "UX design", "giao diện người dùng"
         ngay cả khi không có từ khóa chính xác!
```

### Ví dụ thực tế

**Câu hỏi linh hoạt:**
- ❓ "Việc gì liên quan đến mobile app" → Tìm tasks về iOS, Android, React Native
- ❓ "Dự án về AI" → Tìm projects chứa machine learning, chatbot, automation
- ❓ "Task cần làm gấp" → Tìm tasks ưu tiên cao, deadline gần
- ❓ "Công việc backend" → Tìm tasks về API, database, server

**So sánh kết quả:**

| Câu hỏi | Keyword Search | Semantic Search |
|---------|---------------|-----------------|
| "thiết kế UI" | ✅ Tasks có từ "UI" | ✅ UI, UX, giao diện, mockup |
| "làm app mobile" | ❌ Không match | ✅ iOS, Android, mobile, app |
| "việc khẩn cấp" | ❌ Không có từ "khẩn" | ✅ Tasks ưu tiên cao |
| "dự án AI" | ✅ Chỉ có từ "AI" | ✅ AI, ML, automation, bot |

### API Endpoints

#### POST /ai/ask
```json
{
  "question": "Dự án nào liên quan đến mobile development?"
}
```

**Response:**
```json
{
  "answer": "Có 2 dự án liên quan:\n1. **App iOS quản lý công việc**\n   - Mô tả: Phát triển ứng dụng native iOS...\n   - Similarity: 0.856\n2. **React Native App**\n   - Mô tả: Cross-platform mobile app...\n   - Similarity: 0.782",
  "sources": [
    { "type": "projects", "count": 2 }
  ],
  "confidence": "high"
}
```

### Technical Details

#### Vector Embedding Model
- **Model**: `text-embedding-004`
- **Dimensions**: 768 floats
- **Max tokens**: ~2048 tokens per text
- **API**: Google Generative AI

#### Similarity Calculation
```javascript
cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB); // Returns 0-1
}
```

#### Performance
- **Tasks**: Fetch 100 → Semantic filter → Top 20
- **Projects**: Fetch 50 → Semantic filter → Top 15
- **Speed**: ~200-500ms per embedding (parallel processing)
- **Fallback**: If embedding fails, returns SQL results

### Configuration

#### Environment Variables
```env
GOOGLE_AI_KEY=your_gemini_api_key_here
```

#### Tuning Parameters

**In `aiService.js`:**
```javascript
// Adjust number of results
const similarTasks = await this.findSimilarTasks(question, tasksArray, 20); // Top 20
const similarProjects = await this.findSimilarProjects(question, projectsArray, 15); // Top 15

// Minimum question length for semantic search
if (question && question.length > 10) { // Adjust threshold
    // Use embeddings
}
```

### Logs & Debugging

**Console output khi sử dụng embeddings:**
```
🔍 Finding similar tasks using embeddings...
✅ Found similar tasks: [
  { name: 'Thiết kế UI/UX', similarity: '0.892' },
  { name: 'Tạo mockup giao diện', similarity: '0.756' },
  { name: 'Phát triển frontend', similarity: '0.621' }
]
```

### Limitations

1. **API Rate Limits**: Free tier Gemini API có giới hạn requests/minute
2. **Latency**: Mỗi embedding call ~100-300ms, nhiều tasks sẽ chậm hơn
3. **Text Length**: Chỉ dùng `tentask + mota` (không include full context)
4. **No Caching**: Embeddings được tính mỗi lần query (chưa cache)

### Future Improvements

#### Phase 1: Caching (Giảm latency)
```javascript
// Lưu embeddings vào DB
ALTER TABLE Tasks ADD COLUMN embedding BLOB;

// Chỉ tính embedding khi task thay đổi
if (!task.embedding) {
    task.embedding = await createEmbedding(task.tentask + task.mota);
    await task.save();
}
```

#### Phase 2: Vector Database
```javascript
// Migrate sang Pinecone/Weaviate
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_KEY });
const index = pinecone.index('tasks');

// Query nhanh hơn nhiều
const results = await index.query({
    vector: questionVector,
    topK: 20
});
```

#### Phase 3: Hybrid Search
```javascript
// Kết hợp SQL filter + Vector search
const sqlResults = await Task.findAll({ where: { trangThai: 'Đang chạy' } });
const vectorResults = await findSimilarTasks(question, sqlResults);
```

### Testing

**Test semantic search:**
```bash
# Start backend
npm run dev1

# Test API
curl -X POST http://localhost:3000/ai/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Công việc về thiết kế giao diện"}'
```

**Expected behavior:**
- Questions >10 chars → Use embeddings
- Questions ≤10 chars → Use SQL only
- Embedding fails → Fallback to SQL results
- Returns top K most similar items

### FAQ

**Q: Có tốn phí không?**
A: Gemini text-embedding-004 FREE trong free tier (có rate limit)

**Q: Có chậm hơn không?**
A: Chậm hơn ~200-500ms (vì phải gọi API embeddings), nhưng kết quả chính xác hơn nhiều

**Q: Có cần vector database không?**
A: Chưa cần, đang dùng in-memory calculation. Nếu >1000 tasks thì nên migrate sang vector DB

**Q: Làm sao tắt semantic search?**
A: Comment out phần `findSimilarTasks` và `findSimilarProjects` trong `fetchRelevantData`

---

**Last updated:** 2025-11-23
**Version:** 1.0
**Author:** AI Service Team
