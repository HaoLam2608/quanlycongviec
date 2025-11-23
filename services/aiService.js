const { GoogleGenerativeAI } = require('@google/generative-ai');
const { User, Task, DuAn, Assignment, Conversation, Message } = require('../models');
const { Op } = require('sequelize');

class AIService {
    constructor() {
        // Initialize Google Gemini AI
        const apiKey = process.env.GOOGLE_AI_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ No AI API key found. AI features will use fallback responses.');
        }
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        // Use gemini-2.5-flash (fastest and latest flash model)
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;
        // Use text-embedding-004 for semantic search
        this.embeddingModel = this.genAI ? this.genAI.getGenerativeModel({ model: 'text-embedding-004' }) : null;
        console.log('🤖 AI Service initialized with model: gemini-2.5-flash + text-embedding-004');
    }

    /**
     * Create vector embedding for text
     */
    async createEmbedding(text) {
        try {
            if (!this.embeddingModel) return null;
            
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values; // Array of floats
        } catch (error) {
            console.error('Embedding error:', error.message);
            return null;
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        
        if (magA === 0 || magB === 0) return 0;
        return dotProduct / (magA * magB);
    }

    /**
     * Find similar tasks using vector embeddings
     */
    async findSimilarTasks(question, tasks, topK = 10) {
        try {
            if (!tasks || tasks.length === 0) return tasks;
            
            console.log('🔍 Finding similar tasks using embeddings...');
            const questionVec = await this.createEmbedding(question);
            
            if (!questionVec) {
                console.log('⚠️ Embedding failed, returning all tasks');
                return tasks.slice(0, topK);
            }
            
            // Create embeddings for all tasks (in parallel batches)
            const taskWithSimilarity = await Promise.all(
                tasks.map(async (task) => {
                    const taskText = `${task.tentask || ''} ${task.mota || ''}`.trim();
                    if (!taskText) return { task, similarity: 0 };
                    
                    const taskVec = await this.createEmbedding(taskText);
                    const similarity = this.cosineSimilarity(questionVec, taskVec);
                    
                    return { task, similarity };
                })
            );
            
            // Sort by similarity and return top K
            const sorted = taskWithSimilarity
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);
            
            console.log('✅ Found similar tasks:', sorted.map(t => ({ 
                name: t.task.tentask, 
                similarity: t.similarity.toFixed(3) 
            })));
            
            return sorted.map(t => t.task);
        } catch (error) {
            console.error('Error in findSimilarTasks:', error.message);
            return tasks.slice(0, topK);
        }
    }

    /**
     * Find similar projects using vector embeddings
     */
    async findSimilarProjects(question, projects, topK = 10) {
        try {
            if (!projects || projects.length === 0) return projects;
            
            console.log('🔍 Finding similar projects using embeddings...');
            const questionVec = await this.createEmbedding(question);
            
            if (!questionVec) return projects.slice(0, topK);
            
            const projectWithSimilarity = await Promise.all(
                projects.map(async (project) => {
                    const projectText = `${project.tenduan || ''} ${project.mota || ''}`.trim();
                    if (!projectText) return { project, similarity: 0 };
                    
                    const projectVec = await this.createEmbedding(projectText);
                    const similarity = this.cosineSimilarity(questionVec, projectVec);
                    
                    return { project, similarity };
                })
            );
            
            const sorted = projectWithSimilarity
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);
            
            console.log('✅ Found similar projects:', sorted.map(p => ({ 
                name: p.project.tenduan, 
                similarity: p.similarity.toFixed(3) 
            })));
            
            return sorted.map(p => p.project);
        } catch (error) {
            console.error('Error in findSimilarProjects:', error.message);
            return projects.slice(0, topK);
        }
    }

    /**
     * Query database based on user's question
     */
    async queryDatabase(question, userId) {
        console.log('🤖 AI Query:', question, 'from user:', userId);
        
        // Analyze question to determine what data to fetch
        const intent = await this.analyzeIntent(question);
        
        // ALWAYS fetch comprehensive context (current user + related data based on question)
        // This ensures AI has enough information to answer any question
        const contextData = await this.fetchRelevantData(intent, userId, question);
        
        // Generate response using LLM with context
        const response = await this.generateResponse(question, contextData, userId);
        
        return response;
    }    /**
     * Analyze user's intent to determine what data to query
     */
    async analyzeIntent(question) {
        const lowerQuestion = question.toLowerCase();
        
        const intent = {
            type: 'general',
            entities: [],
            keywords: []
        };

        // Detect entities and intent
        if (lowerQuestion.includes('task') || lowerQuestion.includes('công việc') || lowerQuestion.includes('nhiệm vụ')) {
            intent.type = 'tasks';
            intent.entities.push('Task');
        }
        
        if (lowerQuestion.includes('dự án') || lowerQuestion.includes('project')) {
            intent.type = 'projects';
            intent.entities.push('DuAn');
        }
        
        if (lowerQuestion.includes('user') || lowerQuestion.includes('người dùng') || lowerQuestion.includes('thành viên')) {
            intent.type = 'users';
            intent.entities.push('User');
        }
        
        if (lowerQuestion.includes('assignment') || lowerQuestion.includes('phân công')) {
            intent.type = 'assignments';
            intent.entities.push('Assignment');
        }
        
        if (lowerQuestion.includes('tin nhắn') || lowerQuestion.includes('chat') || lowerQuestion.includes('message')) {
            intent.type = 'messages';
            intent.entities.push('Message');
        }

        // Extract time-based keywords
        if (lowerQuestion.includes('hôm nay') || lowerQuestion.includes('today')) {
            intent.keywords.push('today');
        }
        if (lowerQuestion.includes('tuần này') || lowerQuestion.includes('this week')) {
            intent.keywords.push('this_week');
        }
        if (lowerQuestion.includes('tháng này') || lowerQuestion.includes('this month')) {
            intent.keywords.push('this_month');
        }

        // Status keywords
        if (lowerQuestion.includes('hoàn thành') || lowerQuestion.includes('completed')) {
            intent.keywords.push('completed');
        }
        if (lowerQuestion.includes('đang làm') || lowerQuestion.includes('đang chạy') || lowerQuestion.includes('in progress') || lowerQuestion.includes('đang có')) {
            intent.keywords.push('in_progress');
        }
        if (lowerQuestion.includes('chậm') || lowerQuestion.includes('delayed') || lowerQuestion.includes('overdue') || lowerQuestion.includes('quá hạn')) {
            intent.keywords.push('overdue');
        }
        if (lowerQuestion.includes('cần làm') || lowerQuestion.includes('phải làm') || lowerQuestion.includes('chưa làm')) {
            intent.keywords.push('pending');
        }

        console.log('🎯 Detected intent:', intent);
        return intent;
    }

    /**
     * Fetch relevant data from database based on intent
     * Strategy: Fetch broad context so AI can answer various questions
     */
    async fetchRelevantData(intent, userId, question = '') {
        const data = {};
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        try {
            // ALWAYS fetch current user info - this is essential context
            const user = await User.findByPk(userId, {
                attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                include: [{ model: require('../models').Role, as: 'role' }]
            });
            data.currentUser = user?.toJSON();

            // Determine what to fetch based on intent OR fetch everything for general questions
            const shouldFetchTasks = intent.entities.includes('Task') || intent.type === 'general';
            const shouldFetchProjects = intent.entities.includes('DuAn') || intent.type === 'general';
            const shouldFetchUsers = intent.entities.includes('User') || intent.type === 'general';
            const shouldFetchAssignments = intent.entities.includes('Assignment');

            // Fetch Tasks (if needed)
            if (shouldFetchTasks) {
                const whereClause = {};
                
                // Time filters
                if (intent.keywords.includes('today')) {
                    whereClause.createdAt = { [Op.gte]: new Date(today.setHours(0, 0, 0, 0)) };
                } else if (intent.keywords.includes('this_week')) {
                    whereClause.createdAt = { [Op.gte]: weekAgo };
                } else if (intent.keywords.includes('this_month')) {
                    whereClause.createdAt = { [Op.gte]: monthAgo };
                }

                // Status filters
                if (intent.keywords.includes('completed')) {
                    whereClause.trangThai = 'Hoàn thành';
                } else if (intent.keywords.includes('in_progress')) {
                    whereClause.trangThai = 'Đang chạy';
                } else if (intent.keywords.includes('pending')) {
                    whereClause.trangThai = { [Op.in]: ['Chưa bắt đầu', 'Chờ xác nhận hoàn thành'] };
                } else if (intent.keywords.includes('overdue')) {
                    whereClause.ngayKetThuc = { [Op.lt]: new Date() };
                    whereClause.trangThai = { [Op.ne]: 'Hoàn thành' };
                }

                // Only get tasks related to user
                let tasks = await Task.findAll({
                    where: {
                        ...whereClause,
                        [Op.or]: [
                            { nguoiGiaoId: userId },
                            { nguoiDuocGiaoId: userId }
                        ]
                    },
                    limit: 100, // Fetch more for vector filtering
                    order: [['createdAt', 'DESC']],
                    include: [
                        { model: User, as: 'nguoiGiao', attributes: ['id', 'hoten', 'manv'] },
                        { model: User, as: 'nguoiDuocGiao', attributes: ['id', 'hoten', 'manv'] }
                    ]
                });
                
                // Apply semantic search if question has meaningful content
                const tasksArray = tasks.map(t => t.toJSON());
                if (tasksArray.length > 0 && question && question.length > 10) {
                    // Use vector embeddings to find most relevant tasks
                    const similarTasks = await this.findSimilarTasks(question, tasksArray, 20);
                    data.tasks = similarTasks;
                } else {
                    data.tasks = tasksArray.slice(0, 50);
                }
            }

            // Fetch Projects (if needed)
            if (shouldFetchProjects) {
                // Try to match project by name if user typed a name
                let projects;
                const nameTokens = (question || '').match(/\p{L}+/gu) || [];
                const candidate = nameTokens.find(t => t.length >= 3);
                if (candidate) {
                    projects = await DuAn.findAll({
                        where: {
                            tenduan: { [Op.like]: `%${candidate}%` }
                        },
                        limit: 50,
                        order: [['createdAt', 'DESC']]
                    });
                    // If no match found, get all projects
                    if (projects.length === 0) {
                        projects = await DuAn.findAll({
                            limit: 50,
                            order: [['createdAt', 'DESC']]
                        });
                    }
                } else {
                    projects = await DuAn.findAll({
                        limit: 50,
                        order: [['createdAt', 'DESC']]
                    });
                }
                
                // Apply semantic search for projects
                const projectsArray = projects.map(p => p.toJSON());
                if (projectsArray.length > 0 && question && question.length > 10) {
                    const similarProjects = await this.findSimilarProjects(question, projectsArray, 15);
                    data.projects = similarProjects;
                } else {
                    data.projects = projectsArray.slice(0, 20);
                }
            }

            // Fetch Users (if needed)
            if (shouldFetchUsers) {
                let users;
                let searchName = null;
                let searchCode = null;
                
                // 1. Try to extract employee code (e.g., QLY001, NV001, etc.)
                const codeMatch = question.match(/\b([A-Z]{2,}[0-9]{3,})\b/);
                if (codeMatch) {
                    searchCode = codeMatch[1];
                    console.log('🔍 Extracted employee code:', searchCode);
                }
                
                // 2. Try to extract full Vietnamese name from question
                // Match patterns like "cho Lâm Nguyễn Anh Hào" or "nhắn tin cho Nguyễn Văn A"
                const fullNamePatterns = [
                    /(?:cho|với|người|user|thành viên)\s+\*\*([^*]+)\*\*/i,  // Match **Tên** pattern
                    /(?:cho|với|người|user|thành viên)\s+([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+(?:\s+[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+){2,})/i,
                    /(?:tên|tên là|có tên)\s+([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]*(?:\s+[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]*)*)/i
                ];
                
                for (const pattern of fullNamePatterns) {
                    const match = question.match(pattern);
                    if (match && match[1]) {
                        searchName = match[1].trim().replace(/\*/g, ''); // Remove ** markers
                        console.log('🔍 Extracted name from question:', searchName);
                        break;
                    }
                }
                
                // 3. Search by employee code first (most specific)
                if (searchCode) {
                    users = await User.findAll({
                        where: { manv: searchCode },
                        attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                        limit: 10,
                        include: [{ model: require('../models').Role, as: 'role' }]
                    });
                    console.log(`📊 Found ${users.length} users by code "${searchCode}"`);
                }
                
                // 4. If no code or code not found, search by name
                if ((!users || users.length === 0) && searchName) {
                    // Split name into parts for flexible matching
                    const nameParts = searchName.split(/\s+/).filter(p => p.length > 0);
                    
                    // Try exact match first
                    users = await User.findAll({
                        where: { 
                            hoten: { [Op.like]: `%${searchName}%` }
                        },
                        attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                        limit: 50,
                        include: [{ model: require('../models').Role, as: 'role' }]
                    });
                    
                    // If no exact match, try matching all name parts
                    if (users.length === 0 && nameParts.length > 1) {
                        const nameConditions = nameParts.map(part => ({ 
                            hoten: { [Op.like]: `%${part}%` } 
                        }));
                        users = await User.findAll({
                            where: { [Op.and]: nameConditions },
                            attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                            limit: 50,
                            include: [{ model: require('../models').Role, as: 'role' }]
                        });
                    }
                    
                    console.log(`📊 Found ${users.length} users matching name "${searchName}"`);
                }
                
                // 5. Fallback: if still no results, try capitalized words
                if (!users || users.length === 0) {
                    const nameTokens = (question || '').match(/[A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+/g) || [];
                    const candidateTokens = nameTokens.filter(t => t.length >= 3);
                    
                    if (candidateTokens.length > 0) {
                        const orClauses = candidateTokens.map(t => ({ hoten: { [Op.like]: `%${t}%` } }));
                        users = await User.findAll({
                            where: { [Op.or]: orClauses },
                            attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                            limit: 50,
                            include: [{ model: require('../models').Role, as: 'role' }]
                        });
                        console.log(`📊 Found ${users.length} users using fallback search`);
                    } else {
                        // No specific search criteria, return all users (for general questions)
                        users = await User.findAll({
                            attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                            limit: 50,
                            include: [{ model: require('../models').Role, as: 'role' }]
                        });
                    }
                }
                
                data.users = users.map(u => u.toJSON());
            }

            // Fetch Assignments (if needed)
            if (shouldFetchAssignments) {
                const assignments = await Assignment.findAll({
                    where: {
                        [Op.or]: [
                            { managerId: userId },
                            { assigneeId: userId }
                        ]
                    },
                    limit: 50,
                    order: [['createdAt', 'DESC']],
                    include: [
                        { model: User, as: 'manager', attributes: ['id', 'hoten', 'manv'] },
                        { model: User, as: 'assignee', attributes: ['id', 'hoten', 'manv'] }
                    ]
                });
                data.assignments = assignments.map(a => a.toJSON());
            }

            console.log('📊 Fetched data keys:', Object.keys(data));
            // small preview for debugging (avoid huge dumps)
            try {
                const preview = {
                    users: data.users ? {
                        count: data.users.length,
                        samples: data.users.slice(0, 5).map(u => ({ id: u.id, hoten: u.hoten, manv: u.manv }))
                    } : undefined,
                    projects: data.projects ? {
                        count: data.projects.length,
                        samples: data.projects.slice(0, 5).map(p => ({ id: p.id, tenduan: p.tenduan, mota: p.mota?.substring(0, 50) }))
                    } : undefined,
                    tasks: data.tasks ? {
                        count: data.tasks.length,
                        samples: data.tasks.slice(0, 5).map(t => ({ id: t.id, tentask: t.tentask, trangThai: t.trangThai, ngayKetThuc: t.ngayKetThuc }))
                    } : undefined
                };
                console.log('📋 Data preview:', JSON.stringify(preview, null, 2));
            } catch (e) {
                console.error('Preview error:', e.message);
            }
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return data;
        }
    }

    /**
     * Generate AI response using Google Gemini with context from database
     */
    async generateResponse(question, contextData, userId) {
        try {
            // If no AI model available, use fallback
            if (!this.model) {
                console.log('⚠️ No AI model available, using fallback');
                return this.generateFallbackResponse(question, contextData);
            }

            // Debug: show a concise context preview to help troubleshooting
            try {
                console.log('DEBUG context preview:', JSON.stringify({
                    currentUser: contextData.currentUser ? { id: contextData.currentUser.id, hoten: contextData.currentUser.hoten } : null,
                    users: contextData.users ? contextData.users.length : 0,
                    projects: contextData.projects ? contextData.projects.length : 0,
                    tasks: contextData.tasks ? contextData.tasks.length : 0
                }));
            } catch (e) {
                // ignore
            }

            // Build system prompt with context
            const systemPrompt = this.buildSystemPrompt(contextData);
            const fullPrompt = `${systemPrompt}\n\nCÂU HỎI: ${question}\n\nTRẢ LỜI:`;
            
            console.log('🤖 Calling Gemini API...');
            
            // Call Google Gemini API with generation config
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            });
            
            const response = await result.response;
            const answer = response.text();
            
            console.log('✅ Gemini response received');
            
            return {
                answer: answer,
                sources: this.extractSources(contextData),
                confidence: 'high'
            };
        } catch (error) {
            console.error('Gemini AI error:', error.message);
            console.log('📊 Using fallback response instead');
            
            // Fallback to rule-based response if API fails
            return this.generateFallbackResponse(question, contextData);
        }
    }

    /**
     * Build system prompt with database context
     */
    buildSystemPrompt(contextData) {
        let prompt = `Bạn là trợ lý AI thông minh cho hệ thống quản lý công việc.
Bạn có khả năng truy vấn và phân tích dữ liệu từ database để trả lời các câu hỏi của người dùng.

DỮ LIỆU HIỆN CÓ:
`;
        
        if (contextData.currentUser) {
            prompt += `\nNGƯỜI DÙNG HIỆN TẠI:\n`;
            prompt += `- Tên: ${contextData.currentUser.hoten}\n`;
            prompt += `- Mã NV: ${contextData.currentUser.manv}\n`;
            prompt += `- Email: ${contextData.currentUser.email || 'N/A'}\n`;
            prompt += `- SĐT: ${contextData.currentUser.sdt || 'N/A'}\n`;
            prompt += `- Chức vụ: ${contextData.currentUser.chucvu || 'N/A'}\n`;
            prompt += `- Role: ${contextData.currentUser.role?.name || 'N/A'}\n`;
        }

        if (contextData.tasks && contextData.tasks.length > 0) {
            prompt += `\nCÔNG VIỆC (Tổng: ${contextData.tasks.length}):\n`;
            contextData.tasks.slice(0, 15).forEach((task, idx) => {
                const tenTask = task.tentask || task.tieuDe || 'Không rõ';
                const deadline = task.ngayKetThuc || task.thoiHan;
                const moTa = task.mota || '';
                const moTaShort = moTa.length > 150 ? moTa.substring(0, 150) + '...' : moTa;
                
                prompt += `${idx + 1}. **${tenTask}**\n`;
                if (moTaShort) prompt += `   📝 Mô tả: ${moTaShort}\n`;
                prompt += `   📊 Trạng thái: ${task.trangThai}\n`;
                prompt += `   ⏰ Hạn: ${deadline ? new Date(deadline).toLocaleDateString('vi-VN') : 'N/A'}\n`;
                if (task.mucDoUuTien) {
                    const uuTienMap = { low: '🟢 Thấp', medium: '🟡 Trung bình', high: '🔴 Cao' };
                    prompt += `   ⚡ Ưu tiên: ${uuTienMap[task.mucDoUuTien] || task.mucDoUuTien}\n`;
                }
                if (task.tienDo !== undefined && task.tienDo !== null) {
                    prompt += `   📈 Tiến độ: ${task.tienDo}%\n`;
                }
                if (task.nguoiGiao) prompt += `   👤 Người giao: ${task.nguoiGiao.hoten} (${task.nguoiGiao.manv})\n`;
                if (task.nguoiDuocGiao) prompt += `   👥 Người nhận: ${task.nguoiDuocGiao.hoten} (${task.nguoiDuocGiao.manv})\n`;
                if (task.ngayBatDau) prompt += `   📅 Ngày bắt đầu: ${new Date(task.ngayBatDau).toLocaleDateString('vi-VN')}\n`;
            });
            if (contextData.tasks.length > 15) {
                prompt += `... và ${contextData.tasks.length - 15} công việc khác\n`;
            }
        }

        if (contextData.projects && contextData.projects.length > 0) {
            prompt += `\nDỰ ÁN (Tổng: ${contextData.projects.length}):\n`;
            contextData.projects.slice(0, 10).forEach((project, idx) => {
                const ten = project.tenduan || project.tenDuAn || 'Không có tên';
                const mo = project.mota || project.moTa || '';
                const moShort = mo.length > 100 ? mo.substring(0, 100) + '...' : mo;
                const ngayBD = project.ngaybatdau ? new Date(project.ngaybatdau).toLocaleDateString('vi-VN') : 'N/A';
                const ngayKT = project.ngayketthuc ? new Date(project.ngayketthuc).toLocaleDateString('vi-VN') : 'N/A';
                const trangThai = project.status || 'N/A';
                prompt += `${idx + 1}. ${ten}\n`;
                if (moShort) prompt += `   - Mô tả: ${moShort}\n`;
                prompt += `   - Thời gian: ${ngayBD} → ${ngayKT}\n`;
                prompt += `   - Trạng thái: ${trangThai}\n`;
            });
            if (contextData.projects.length > 10) {
                prompt += `... và ${contextData.projects.length - 10} dự án khác\n`;
            }
        }

        if (contextData.users && contextData.users.length > 0) {
            prompt += `\nTHÀNH VIÊN (Tổng: ${contextData.users.length}):\n`;
            contextData.users.slice(0, 20).forEach((u, idx) => {
                prompt += `${idx + 1}. ${u.hoten}\n`;
                prompt += `   - Mã NV: ${u.manv || 'N/A'}\n`;
                prompt += `   - Chức vụ: ${u.chucvu || 'N/A'}\n`;
                if (u.email) prompt += `   - Email: ${u.email}\n`;
                if (u.sdt) prompt += `   - SĐT: ${u.sdt}\n`;
            });
            if (contextData.users.length > 20) {
                prompt += `... và ${contextData.users.length - 20} thành viên khác\n`;
            }
        }

        if (contextData.assignments && contextData.assignments.length > 0) {
            prompt += `\nPHÂN CÔNG (Tổng: ${contextData.assignments.length}):\n`;
        }

        prompt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prompt += `HƯỚNG DẪN TRẢ LỜI:
1. Phân tích câu hỏi kỹ lưỡng để hiểu ý định của người dùng
2. Sử dụng dữ liệu phía trên để trả lời chính xác
3. Nếu hỏi về công việc cụ thể, hãy bao gồm:
   - Tên công việc đầy đủ
   - Mô tả chi tiết (nếu có)
   - Trạng thái hiện tại
   - Deadline (ngày hết hạn)
   - Độ ưu tiên
   - Người giao và người nhận công việc
   - Tiến độ hoàn thành (%)
4. Nếu hỏi về người dùng/thành viên HOẶC muốn liên hệ ai đó:
   - Tìm người được hỏi trong danh sách THÀNH VIÊN ở trên
   - Trả về: tên, mã NV, chức vụ, email, SĐT của người ĐÓ (không phải người hỏi)
   - Nếu có email/SĐT thì PHẢI hiển thị, đừng nói "không có thông tin"
   - VÍ DỤ: Nếu hỏi "muốn nhắn tin cho Lâm Nguyễn Anh Hào", hãy tìm Lâm Nguyễn Anh Hào trong danh sách và trả về email/SĐT của anh ấy
5. Nếu hỏi về dự án, bao gồm: tên, mô tả, thời gian, trạng thái
6. Nếu hỏi về số liệu/thống kê, hãy đếm và tính toán từ dữ liệu có sẵn
7. Format output với markdown và emoji cho dễ đọc
8. Trả lời bằng tiếng Việt, ngắn gọn, súc tích, và thân thiện
9. Nếu không tìm thấy người/thông tin được hỏi, hãy nói rõ "Không tìm thấy trong hệ thống"
10. KHÔNG BAO GIỜ bịa đặt hoặc phỏng đoán thông tin không có trong dữ liệu
11. QUAN TRỌNG: Phân biệt người hỏi (NGƯỜI DÙNG HIỆN TẠI) và người được hỏi đến (trong danh sách THÀNH VIÊN)`;
        
        return prompt;
    }

    /**
     * Extract data sources for citation
     */
    extractSources(contextData) {
        const sources = [];
        
        if (contextData.tasks?.length > 0) {
            sources.push({ type: 'tasks', count: contextData.tasks.length });
        }
        if (contextData.projects?.length > 0) {
            sources.push({ type: 'projects', count: contextData.projects.length });
        }
        if (contextData.users?.length > 0) {
            sources.push({ type: 'users', count: contextData.users.length });
        }
        
        return sources;
    }

    /**
     * Fallback response when AI model fails (rule-based)
     */
    generateFallbackResponse(question, contextData) {
        let answer = '';
        
        // Analyze question type and provide relevant answer
        const lowerQ = question.toLowerCase();
        
        if (contextData.tasks && contextData.tasks.length > 0) {
            const total = contextData.tasks.length;
            const completed = contextData.tasks.filter(t => t.trangThai === 'Hoàn thành').length;
            const inProgress = contextData.tasks.filter(t => t.trangThai === 'Đang chạy').length;
            const pending = contextData.tasks.filter(t => t.trangThai === 'Chưa bắt đầu').length;
            const waiting = contextData.tasks.filter(t => t.trangThai === 'Chờ xác nhận hoàn thành').length;
            
            answer += `📋 **CÔNG VIỆC:**\n`;
            answer += `- Tổng số: ${total} công việc\n`;
            answer += `- ✅ Hoàn thành: ${completed}\n`;
            answer += `- 🔄 Đang chạy: ${inProgress}\n`;
            answer += `- ⏸️ Chưa bắt đầu: ${pending}\n`;
            if (waiting > 0) answer += `- ⏳ Chờ xác nhận: ${waiting}\n`;
            
            // Show details of in-progress tasks
            if (inProgress > 0 && contextData.tasks.filter(t => t.trangThai === 'Đang chạy').length <= 5) {
                answer += `\n**Chi tiết công việc đang chạy:**\n`;
                contextData.tasks.filter(t => t.trangThai === 'Đang chạy').forEach((task, idx) => {
                    const tenTask = task.tentask || 'N/A';
                    const deadline = task.ngayKetThuc ? new Date(task.ngayKetThuc).toLocaleDateString('vi-VN') : 'N/A';
                    const uuTien = task.mucDoUuTien || 'N/A';
                    answer += `${idx + 1}. **${tenTask}**\n`;
                    answer += `   - ⏰ Hạn: ${deadline}\n`;
                    answer += `   - ⚡ Ưu tiên: ${uuTien}\n`;
                    if (task.tienDo) answer += `   - 📈 Tiến độ: ${task.tienDo}%\n`;
                    if (task.nguoiGiao) answer += `   - 👤 Người giao: ${task.nguoiGiao.hoten}\n`;
                });
            }
            answer += '\n';
        }

        if (contextData.projects && contextData.projects.length > 0) {
            answer += `📁 **DỰ ÁN:**\n`;
            answer += `Có ${contextData.projects.length} dự án:\n`;
            contextData.projects.slice(0, 5).forEach((p, idx) => {
                const ten = p.tenduan || p.tenDuAn || 'Không rõ';
                const trangThai = p.status || 'N/A';
                answer += `${idx + 1}. ${ten} - ${trangThai}\n`;
            });
            if (contextData.projects.length > 5) {
                answer += `... và ${contextData.projects.length - 5} dự án khác\n`;
            }
            answer += '\n';
        }

        if (contextData.users && contextData.users.length > 0) {
            answer += `👥 **THÀNH VIÊN:**\n`;
            answer += `Có ${contextData.users.length} thành viên trong hệ thống.\n`;
            // If asked about specific user and found match
            if (contextData.users.length <= 3) {
                contextData.users.forEach((u, idx) => {
                    answer += `${idx + 1}. ${u.hoten} (${u.manv || 'N/A'}) - ${u.chucvu || 'N/A'}\n`;
                    if (u.email) answer += `   Email: ${u.email}\n`;
                    if (u.sdt) answer += `   SĐT: ${u.sdt}\n`;
                });
            }
            answer += '\n';
        }

        // Add helpful suggestions if no data
        if (!answer) {
            answer = 'Tôi chưa tìm thấy dữ liệu phù hợp với câu hỏi của bạn.\n\n';
            answer += '**Gợi ý câu hỏi:**\n';
            answer += '- "Tôi có bao nhiêu công việc?"\n';
            answer += '- "Cho tôi xem danh sách dự án"\n';
            answer += '- "Công việc nào đang quá hạn?"\n';
            answer += '- "Thông tin về người dùng [tên]"\n';
        }

        return {
            answer: answer,
            sources: this.extractSources(contextData),
            confidence: 'low'
        };
    }
}

module.exports = new AIService();
