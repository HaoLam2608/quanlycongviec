const { GoogleGenerativeAI } = require('@google/generative-ai');
const { User, Task, DuAn, Assignment, Group, GroupMember, GroupProject, Subtask, Role } = require('../models');
const { Op } = require('sequelize');

/**
 * ========================================
 * ENHANCED AI SERVICE V2
 * ========================================
 * Features:
 * - Smart intent detection
 * - Comprehensive data fetching
 * - Optimized prompt engineering
 * - Better error handling
 * - Support for complex queries
 * ========================================
 */

class AIServiceV2 {
    constructor() {
        // Load .env file
        require('dotenv').config();
        
        const apiKey = process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ No AI API key found. AI features will use fallback responses.');
            this.genAI = null;
            this.model = null;
            this.embeddingModel = null;
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            // Use same model as V1 for parity
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            // Use text-embedding-004 for semantic search (same as V1)
            this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
            console.log('🤖 AI Service V2 initialized with Gemini API');
        }
    }

    // ============================================
    // CORE AI QUERY FUNCTION
    // ============================================
    
    async queryDatabase(question, userId) {
        console.log('🤖 AI Query V2:', question, '| User:', userId);
        
        try {
            // Step 1: Analyze question intent
            const intent = this.analyzeQuestionIntent(question);
            console.log('🎯 Intent:', intent);
            
            // Step 2: Fetch comprehensive context
            const context = await this.fetchComprehensiveContext(userId, question, intent);
            console.log('📊 Context fetched:', {
                currentUser: !!context.currentUser,
                users: context.users?.length || 0,
                projects: context.projects?.length || 0,
                tasks: context.tasks?.length || 0,
                subtasks: context.subtasks?.length || 0,
                groups: context.groups?.length || 0
            });
            
            // Step 3: Generate AI response
            const response = await this.generateIntelligentResponse(question, context, intent);
            
            return response;
        } catch (error) {
            console.error('❌ AI Query Error:', error);
            return this.generateErrorResponse(question, error);
        }
    }

    // ============================================
    // INTENT ANALYSIS
    // ============================================
    
    analyzeQuestionIntent(question) {
        const q = question.toLowerCase();
        
        const intent = {
            type: 'general',
            action: null,
            entities: [],
            filters: {},
            needsUsers: false,
            needsProjects: false,
            needsTasks: false,
            needsGroups: false,
            targetPerson: null,
            wantsRoleInfo: false,
            wantsGroupManagement: false,
            wantsGroupMembers: false,
            followUpGroupReference: false
        };

        // Detect question type
        if (/có bao nhiêu|bao nhiêu|count|đếm|số lượng/i.test(question)) {
            intent.action = 'count';
        } else if (/quá hạn|trễ hạn|tre han|qua han|deadline|overdue/i.test(question)) {
            intent.action = 'check_overdue';
        } else if (/tôi|mình|của tôi|của mình|my/i.test(question)) {
            intent.action = 'my_data';
        } else if (/người tên|người có tên|user|thành viên.*tên/i.test(question)) {
            intent.action = 'user_data';
            // Extract person name
            const nameMatch = question.match(/(?:người tên|người có tên|tên|thành viên)\s+(?:tên\s+)?([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]+)/i);
            if (nameMatch) {
                intent.targetPerson = nameMatch[1].trim();
            }
        } else if (/danh sách|list|liệt kê|cho tôi xem/i.test(question)) {
            intent.action = 'list';
        } else if (/tìm|search|find/i.test(question)) {
            intent.action = 'search';
        }

        // Detect entities
        if (/dự án|project/i.test(question)) {
            intent.entities.push('project');
            intent.needsProjects = true;
        }
        if (/công việc|task|nhiệm vụ/i.test(question)) {
            intent.entities.push('task');
            intent.needsTasks = true;
        }
        if (/nhóm|group|team/i.test(question)) {
            intent.entities.push('group');
            intent.needsGroups = true;
        }
        if (/người|user|thành viên/i.test(question)) {
            intent.entities.push('user');
            intent.needsUsers = true;
        }

        const roleKeywords = /(vai trò|vaitro|role|teamlead|team lead|leader|trưởng nhóm|truong nhom|quản lý nhóm|quan ly nhom)/i;
        if (roleKeywords.test(question)) {
            intent.wantsRoleInfo = true;
            intent.needsGroups = true;
            intent.needsUsers = true;
        }

        const groupManagementKeywords = /(quản lý nhóm|quan ly nhom|teamlead|team lead|dẫn dắt nhóm|dan dat nhom|lead team|lead nhóm|lead nhom|group lead)/i;
        if (groupManagementKeywords.test(question) || (/nhóm|group|team/i.test(question) && /tôi|my|của tôi|cua toi|mình|minh/i.test(question))) {
            intent.wantsGroupManagement = true;
            intent.needsGroups = true;
        }

        const groupMemberKeywords = /(thành viên|member|members|trong nhóm|những ai trong|ai trong nhóm|team gồm|bao gồm những ai)/i;
        if (groupMemberKeywords.test(question)) {
            intent.wantsGroupMembers = true;
            intent.needsGroups = true;
            intent.needsUsers = true;
        }

        if (/trong đó|trong do|nhóm đó|nhom do|team đó|team do/i.test(question)) {
            intent.followUpGroupReference = true;
            intent.needsGroups = true;
        }

        // Detect status filters
        if (/đang chạy|đang thực hiện|in progress/i.test(question)) {
            intent.filters.status = 'dang_chay';
        } else if (/hoàn thành|completed|xong/i.test(question)) {
            intent.filters.status = 'da_hoan_thanh';
        } else if (/chưa bắt đầu|not started/i.test(question)) {
            intent.filters.status = 'chua_bat_dau';
        }

        // If no specific entities detected, fetch all relevant data
        if (intent.entities.length === 0) {
            intent.needsProjects = true;
            intent.needsTasks = true;
            intent.needsUsers = intent.action === 'user_data' || intent.targetPerson;
        }

        return intent;
    }

    // ============================================
    // COMPREHENSIVE DATA FETCHING
    // ============================================
    
    async fetchComprehensiveContext(userId, question, intent) {
        const context = {};

        try {
            // Always fetch current user info
            context.currentUser = await User.findByPk(userId, {
                attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
                include: [{ model: Role, as: 'role', attributes: ['name'] }]
            });

            // Fetch projects with full details
            if (intent.needsProjects || intent.action === 'count' || intent.action === 'check_overdue') {
                context.projects = await this.fetchProjectsWithDetails(userId, intent);
            }

            // Fetch tasks with full details
            if (intent.needsTasks || intent.action === 'count' || intent.action === 'check_overdue') {
                context.tasks = await this.fetchTasksWithDetails(userId, intent);
            }

            // Fetch subtasks
            if (intent.needsTasks) {
                context.subtasks = await this.fetchSubtasksWithDetails(userId);
            }

            // Fetch users (for user-related questions)
            if (intent.needsUsers || intent.targetPerson) {
                context.users = await this.fetchUsersWithDetails(intent.targetPerson);
            }

            // Fetch groups
            if (intent.needsGroups) {
                context.groups = await this.fetchGroupsWithDetails(userId);
            }

            return context;
        } catch (error) {
            console.error('Error fetching context:', error);
            return context;
        }
    }

    async fetchProjectsWithDetails(userId, intent) {
        const where = {};
        
        if (intent.filters.status) {
            where.status = intent.filters.status;
        }

        const projects = await DuAn.findAll({
            where,
            limit: 200,
            order: [['createdAt', 'DESC']],
            include: [
                { 
                    model: User, 
                    as: 'nguoiDamNhan', 
                    attributes: ['id', 'hoten', 'manv', 'email']
                },
                {
                    model: GroupProject,
                    as: 'groupProjects',
                    include: [{
                        model: Group,
                        as: 'group',
                        attributes: ['id', 'name']
                    }]
                }
            ]
        });

        return projects.map(p => p.toJSON());
    }

    async fetchTasksWithDetails(userId, intent) {
        const where = {};
        
        if (intent.filters.status) {
            where.trangThai = intent.filters.status;
        }

        // Fetch tasks related to user (assigned to or created by)
        const tasks = await Task.findAll({
            where,
            limit: 200,
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'nguoiGiao', attributes: ['id', 'hoten', 'manv'] },
                { model: User, as: 'nguoiDuocGiao', attributes: ['id', 'hoten', 'manv'] },
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] }
            ]
        });

        return tasks.map(t => t.toJSON());
    }

    async fetchSubtasksWithDetails(userId) {
        const subtasks = await Subtask.findAll({
            limit: 100,
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'nguoiThucHien', attributes: ['id', 'hoten', 'manv'] },
                { model: Task, as: 'task', attributes: ['id', 'tentask'] }
            ]
        });

        return subtasks.map(s => s.toJSON());
    }

    async fetchUsersWithDetails(searchName = null) {
        const where = {};
        
        if (searchName) {
            where.hoten = { [Op.like]: `%${searchName}%` };
        }

        const users = await User.findAll({
            where,
            limit: searchName ? 10 : 50,
            attributes: ['id', 'manv', 'hoten', 'email', 'sdt', 'chucvu'],
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });

        return users.map(u => u.toJSON());
    }

    async fetchGroupsWithDetails(userId) {
        const groups = await Group.findAll({
            limit: 50,
            include: [
                { model: User, as: 'leader', attributes: ['id', 'hoten', 'manv'] },
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'hoten', 'manv'],
                    through: {
                        model: GroupMember,
                        attributes: ['roleInGroup', 'joinedAt']
                    }
                }
            ]
        });

        return groups.map(g => g.toJSON());
    }

    // ============================================
    // INTELLIGENT RESPONSE GENERATION
    // ============================================
    
    async generateIntelligentResponse(question, context, intent) {
        // If no AI model, use smart fallback
        if (!this.model) {
            return this.generateSmartFallback(question, context, intent);
        }

        try {
            const prompt = this.buildOptimizedPrompt(question, context, intent);
            
            console.log('🤖 Calling Gemini API...');
            console.log('📊 Prompt length:', prompt.length, 'characters');

            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3, // Lower for more focused answers
                    maxOutputTokens: 4096,
                    topP: 0.9,
                    topK: 40,
                }
            });

            const response = await result.response;
            const answer = response.text();

            console.log('✅ AI Response:', answer.substring(0, 200) + '...');

            if (!answer || answer.trim().length === 0) {
                console.warn('⚠️ Empty AI response, using fallback');
                return this.generateSmartFallback(question, context, intent);
            }

            return {
                answer: answer,
                sources: this.extractSources(context),
                confidence: 'high'
            };

        } catch (error) {
            console.error('AI Generation Error:', error);
            return this.generateSmartFallback(question, context, intent);
        }
    }

    // ============================================
    // OPTIMIZED PROMPT ENGINEERING
    // ============================================
    
    buildOptimizedPrompt(question, context, intent) {
        const today = new Date().toLocaleDateString('vi-VN');
        
        let prompt = `Bạn là trợ lý AI cho hệ thống quản lý công việc. Hôm nay là ${today}.

`;

        // Add current user context
        if (context.currentUser) {
            const roleLabel = context.currentUser.role?.name || context.currentUser.chucvu;
            prompt += `NGƯỜI DÙNG: ${context.currentUser.hoten} (ID: ${context.currentUser.id}, Mã: ${context.currentUser.manv || 'N/A'})\n`;
            if (roleLabel) {
                prompt += `VAI TRÒ HIỆN TẠI: ${roleLabel}\n`;
            }
            prompt += `\n`;
        }

        // Add specific instructions based on intent
        if (intent.action === 'check_overdue') {
            prompt += `⚠️ CÂU HỎI VỀ QUÁ HẠN - Kiểm tra ngayketthuc/ngayKetThuc < ${today} VÀ status != hoàn thành\n\n`;
        } else if (intent.action === 'user_data' && intent.targetPerson) {
            prompt += `🔍 TÌM THÔNG TIN VỀ: "${intent.targetPerson}"\n\n`;
        } else if (intent.action === 'my_data') {
            prompt += `👤 TÌM DỮ LIỆU CỦA NGƯỜI DÙNG HIỆN TẠI (ID: ${context.currentUser?.id})\n\n`;
        }

        // Add data sections (compact format)
        if (context.projects && context.projects.length > 0) {
            prompt += this.formatProjectsCompact(context.projects, intent);
        }

        if (context.tasks && context.tasks.length > 0) {
            prompt += this.formatTasksCompact(context.tasks, intent);
        }

        if (context.users && context.users.length > 0) {
            prompt += this.formatUsersCompact(context.users);
        }

        if (context.groups && context.groups.length > 0) {
            prompt += this.formatGroupsCompact(context.groups, context.currentUser?.id, intent);
        }

        // Add instructions
        prompt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nHƯỚNG DẪN:\n`;
        prompt += `1. Trả lời chính xác, chi tiết dựa trên dữ liệu trên\n`;
        prompt += `2. Format với markdown và emoji đẹp\n`;
        prompt += `3. Nếu hỏi về "tôi/mình" → tìm theo ID người dùng hiện tại\n`;
        prompt += `4. Nếu hỏi về người khác → tìm theo tên trong danh sách\n`;
        prompt += `5. PIC = Person In Charge (người phụ trách)\n`;
    prompt += `6. QUAN TRỌNG: Nếu hỏi "có bao nhiêu", "đếm", "tổng số" → trả lời SỐ LƯỢNG CỤ THỂ và LIỆT KÊ\n`;
    prompt += `7. QUAN TRỌNG: Nếu hỏi "danh sách", "liệt kê" → LIỆT KÊ CHI TIẾT, KHÔNG NÓI "hỏi cụ thể hơn"\n`;
    prompt += `8. Nếu không có dữ liệu → nói "Không có" hoặc "0", KHÔNG nói "hỏi cụ thể hơn"\n`;
    prompt += `9. Nếu câu hỏi nhắc "vai trò", "teamlead", "leader" hoặc "nhóm của tôi" → mô tả rõ chức vụ hiện tại và các nhóm người dùng đang dẫn dắt/thuộc về.\n`;
    prompt += `10. Đánh dấu những nhóm mà người dùng là leader bằng cụm từ "Bạn phụ trách" trong câu trả lời khi có dữ liệu.\n`;
    prompt += `11. Nếu câu hỏi nhắc "thành viên"/"members" hoặc "nhóm đó" → liệt kê tên từng thành viên trong nhóm liên quan, ưu tiên nhóm mà người dùng đang phụ trách.\n\n`;
        
        prompt += `CÂU HỎI: ${question}\n\nTRẢ LỜI:`;

        return prompt;
    }

    formatProjectsCompact(projects, intent) {
        let text = `DỰ ÁN (${projects.length}):\n`;
        const showAll = intent.action === 'check_overdue' || intent.action === 'count';
        const projectsToShow = showAll ? projects : projects.slice(0, 15);

        projectsToShow.forEach((p, i) => {
            const pic = p.nguoiDamNhan ? `${p.nguoiDamNhan.hoten} (${p.nguoiDamNhan.manv})` : 'Chưa có';
            const start = p.ngaybatdau ? new Date(p.ngaybatdau).toLocaleDateString('vi-VN') : 'N/A';
            const end = p.ngayketthuc ? new Date(p.ngayketthuc).toLocaleDateString('vi-VN') : 'N/A';
            text += `${i+1}. ${p.tenduan} | ${start}→${end} | ${p.status} | PIC: ${pic}\n`;
        });

        if (!showAll && projects.length > 15) {
            text += `... và ${projects.length - 15} dự án khác\n`;
        }
        text += `\n`;
        return text;
    }

    formatTasksCompact(tasks, intent) {
        let text = `CÔNG VIỆC (${tasks.length}):\n`;
        const showAll = intent.action === 'check_overdue' || intent.action === 'count';
        const tasksToShow = showAll ? tasks : tasks.slice(0, 15);

        tasksToShow.forEach((t, i) => {
            const deadline = t.ngayKetThuc ? new Date(t.ngayKetThuc).toLocaleDateString('vi-VN') : 'N/A';
            const assignee = t.nguoiDuocGiao ? t.nguoiDuocGiao.hoten : 'Chưa phân';
            text += `${i+1}. ${t.tentask} | ${t.trangThai} | Hạn: ${deadline} | Người: ${assignee}\n`;
        });

        if (!showAll && tasks.length > 15) {
            text += `... và ${tasks.length - 15} công việc khác\n`;
        }
        text += `\n`;
        return text;
    }

    formatUsersCompact(users) {
        let text = `THÀNH VIÊN (${users.length}):\n`;
        users.slice(0, 20).forEach((u, i) => {
            text += `${i+1}. ${u.hoten} (${u.manv}) - ${u.chucvu || 'N/A'}`;
            if (u.email) text += ` | ${u.email}`;
            text += `\n`;
        });
        if (users.length > 20) text += `... và ${users.length - 20} thành viên khác\n`;
        text += `\n`;
        return text;
    }

    formatGroupsCompact(groups, currentUserId = null, intent = null) {
        let text = `NHÓM (${groups.length}):\n`;
        groups.slice(0, 10).forEach((g, i) => {
            const leaderName = g.leader ? `${g.leader.hoten}${g.leader.manv ? ` (${g.leader.manv})` : ''}` : 'Chưa có';
            const members = this.getGroupMembers(g);
            const memberCount = members.length;
            const tags = [];
            if (currentUserId && this.isUserLeaderOfGroup(g, currentUserId)) {
                tags.push('Bạn phụ trách');
            } else if (currentUserId && this.isUserMemberOfGroup(g, currentUserId)) {
                tags.push('Bạn là thành viên');
            }
            text += `${i+1}. ${g.name} | Leader: ${leaderName} | ${memberCount} thành viên${tags.length ? ` | ${tags.join(', ')}` : ''}\n`;
            if (intent?.wantsGroupMembers && memberCount > 0) {
                const sampleMembers = members.slice(0, 4)
                    .map(m => `${m.hoten}${m.manv ? ` (${m.manv})` : ''}`)
                    .join(', ');
                text += `   ↳ Thành viên: ${sampleMembers}${memberCount > 4 ? '…' : ''}\n`;
            }
        });
        if (groups.length > 10) text += `... và ${groups.length - 10} nhóm khác\n`;
        text += `\n`;
        return text;
    }

    // ============================================
    // SMART FALLBACK (Rule-based responses)
    // ============================================
    
    generateSmartFallback(question, context, intent) {
        let answer = '';

        // Handle counting questions
        if (intent.action === 'count') {
            answer = this.handleCountingQuestion(context, question);
        }
        // Handle overdue checks
        else if (intent.action === 'check_overdue') {
            answer = this.handleOverdueCheck(context);
        }
        // Handle user data questions
        else if (intent.action === 'user_data') {
            answer = this.handleUserDataQuestion(context, intent.targetPerson);
        }
        // Handle my data questions
        else if (intent.action === 'my_data') {
            answer = this.handleMyDataQuestion(context, intent);
        }
        else if (intent.wantsGroupMembers) {
            answer = this.handleGroupMemberQuestion(context, intent);
        }
        // General summary
        else {
            answer = this.generateGeneralSummary(context);
        }

        return {
            answer: answer,
            sources: this.extractSources(context),
            confidence: 'medium'
        };
    }

    handleCountingQuestion(context, question) {
        let answer = '📊 **THỐNG KÊ:**\n\n';

        if (context.projects) {
            const running = context.projects.filter(p => p.status === 'dang_chay').length;
            const completed = context.projects.filter(p => p.status === 'da_hoan_thanh').length;
            const notStarted = context.projects.filter(p => p.status === 'chua_bat_dau').length;

            answer += `📁 **Dự án:** ${context.projects.length} tổng\n`;
            answer += `- ▶️ Đang chạy: ${running}\n`;
            answer += `- ✅ Hoàn thành: ${completed}\n`;
            answer += `- ⏸️ Chưa bắt đầu: ${notStarted}\n\n`;
        }

        if (context.tasks) {
            const running = context.tasks.filter(t => t.trangThai === 'Đang chạy').length;
            const completed = context.tasks.filter(t => t.trangThai === 'Hoàn thành').length;

            answer += `📋 **Công việc:** ${context.tasks.length} tổng\n`;
            answer += `- ▶️ Đang chạy: ${running}\n`;
            answer += `- ✅ Hoàn thành: ${completed}\n\n`;
        }

        if (context.users) {
            answer += `👥 **Thành viên:** ${context.users.length} người\n\n`;
        }

        return answer;
    }

    handleOverdueCheck(context) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueProjects = (context.projects || []).filter(p => {
            if (!p.ngayketthuc || p.status === 'da_hoan_thanh') return false;
            const deadline = new Date(p.ngayketthuc);
            return deadline < today;
        });

        const overdueTasks = (context.tasks || []).filter(t => {
            if (!t.ngayKetThuc || t.trangThai === 'Hoàn thành') return false;
            const deadline = new Date(t.ngayKetThuc);
            return deadline < today;
        });

        if (overdueProjects.length === 0 && overdueTasks.length === 0) {
            return '✅ **KHÔNG CÓ** dự án hoặc công việc nào quá hạn! 🎉';
        }

        let answer = '🚨 **CẢNH BÁO QUÁ HẠN:**\n\n';

        if (overdueProjects.length > 0) {
            answer += `📁 **${overdueProjects.length} Dự án quá hạn:**\n`;
            overdueProjects.forEach((p, i) => {
                const deadline = new Date(p.ngayketthuc);
                const daysLate = Math.floor((today - deadline) / (1000 * 60 * 60 * 24));
                const pic = p.nguoiDamNhan ? p.nguoiDamNhan.hoten : 'Chưa có';
                answer += `${i+1}. **${p.tenduan}**\n`;
                answer += `   - Deadline: ${deadline.toLocaleDateString('vi-VN')}\n`;
                answer += `   - Trễ: ${daysLate} ngày\n`;
                answer += `   - PIC: ${pic}\n`;
                answer += `   - Trạng thái: ${p.status}\n`;
            });
            answer += '\n';
        }

        if (overdueTasks.length > 0) {
            answer += `📋 **${overdueTasks.length} Công việc quá hạn:**\n`;
            overdueTasks.slice(0, 10).forEach((t, i) => {
                const deadline = new Date(t.ngayKetThuc);
                const daysLate = Math.floor((today - deadline) / (1000 * 60 * 60 * 24));
                const assignee = t.nguoiDuocGiao ? t.nguoiDuocGiao.hoten : 'Chưa phân';
                answer += `${i+1}. **${t.tentask}**\n`;
                answer += `   - Deadline: ${deadline.toLocaleDateString('vi-VN')}\n`;
                answer += `   - Trễ: ${daysLate} ngày\n`;
                answer += `   - Người nhận: ${assignee}\n`;
            });
            if (overdueTasks.length > 10) {
                answer += `... và ${overdueTasks.length - 10} công việc khác\n`;
            }
        }

        return answer;
    }

    handleUserDataQuestion(context, targetPerson) {
        if (!context.users || context.users.length === 0) {
            return `❌ Không tìm thấy thông tin về người tên "${targetPerson}"`;
        }

        const user = context.users[0];
        let answer = `👤 **THÔNG TIN VỀ ${user.hoten}:**\n\n`;
        answer += `- Mã NV: ${user.manv}\n`;
        answer += `- Chức vụ: ${user.chucvu || 'N/A'}\n`;
        if (user.email) answer += `- Email: ${user.email}\n`;
        if (user.sdt) answer += `- SĐT: ${user.sdt}\n`;
        if (user.role) answer += `- Role: ${user.role.name}\n`;
        answer += `\n`;

        // Find projects this person is managing
        const userProjects = (context.projects || []).filter(p => 
            p.nguoiDamNhan && p.nguoiDamNhan.id === user.id
        );

        if (userProjects.length > 0) {
            answer += `📁 **Dự án phụ trách (${userProjects.length}):**\n`;
            userProjects.forEach((p, i) => {
                answer += `${i+1}. ${p.tenduan} - ${p.status}\n`;
            });
        } else {
            answer += `📁 Chưa được phân công phụ trách dự án nào.\n`;
        }

        // Find tasks assigned to this person
        const userTasks = (context.tasks || []).filter(t =>
            t.nguoiDuocGiao && t.nguoiDuocGiao.id === user.id
        );

        if (userTasks.length > 0) {
            answer += `\n📋 **Công việc được giao (${userTasks.length}):**\n`;
            userTasks.slice(0, 5).forEach((t, i) => {
                answer += `${i+1}. ${t.tentask} - ${t.trangThai}\n`;
            });
            if (userTasks.length > 5) {
                answer += `... và ${userTasks.length - 5} công việc khác\n`;
            }
        }

        const userGroups = (context.groups || []).filter(g => 
            this.isUserLeaderOfGroup(g, user.id) || this.isUserMemberOfGroup(g, user.id)
        );

        if (userGroups.length > 0) {
            answer += `\n👥 **Nhóm liên quan (${userGroups.length}):**\n`;
            userGroups.forEach((g, i) => {
                const relation = this.isUserLeaderOfGroup(g, user.id) ? 'Leader' : 'Thành viên';
                answer += `${i+1}. ${g.name} · ${relation}\n`;
            });
        }

        return answer;
    }

    handleMyDataQuestion(context, intent) {
        const user = context.currentUser;
        if (!user) {
            return '❌ Không xác định được thông tin người dùng hiện tại.';
        }

        const roleLabel = user.role?.name || user.chucvu || 'Chưa cập nhật';
        let answer = `� Chào ${user.hoten}!\n\n`;
        answer += `- 🧩 Vai trò hiện tại: **${roleLabel}**\n`;
        if (user.chucvu && user.role?.name && user.role.name !== user.chucvu) {
            answer += `- Chức danh nội bộ: ${user.chucvu}\n`;
        }
        if (user.manv) {
            answer += `- Mã nhân viên: ${user.manv}\n`;
        }
        if (user.email) {
            answer += `- Email: ${user.email}\n`;
        }
        answer += '\n';

        const groups = context.groups || [];
        const leadingGroups = groups.filter(g => this.isUserLeaderOfGroup(g, user.id));
        const memberGroups = groups.filter(g => !this.isUserLeaderOfGroup(g, user.id) && this.isUserMemberOfGroup(g, user.id));

        if (leadingGroups.length > 0) {
            answer += `👨‍💼 **Nhóm bạn đang phụ trách (${leadingGroups.length}):**\n`;
            leadingGroups.forEach((g, index) => {
                const memberCount = g.members?.length || 0;
                answer += `${index + 1}. ${g.name} · ${memberCount} thành viên\n`;
            });
            answer += '\n';
        } else if (intent?.wantsGroupManagement || intent?.needsGroups) {
            answer += '👨‍💼 Bạn hiện chưa được giao làm leader nhóm nào.\n\n';
        }

        if (memberGroups.length > 0) {
            answer += `🤝 **Nhóm bạn đang tham gia (${memberGroups.length}):**\n`;
            memberGroups.forEach((g, index) => {
                answer += `${index + 1}. ${g.name} (Leader: ${g.leader?.hoten || 'Chưa có'})\n`;
            });
            answer += '\n';
        }

        const myProjects = (context.projects || []).filter(p =>
            p.nguoiDamNhan && p.nguoiDamNhan.id === user.id
        );

        if (myProjects.length > 0) {
            answer += `📁 **Dự án bạn phụ trách (${myProjects.length}):**\n`;
            myProjects.forEach((p, i) => {
                const end = p.ngayketthuc ? new Date(p.ngayketthuc).toLocaleDateString('vi-VN') : 'N/A';
                answer += `${i+1}. ${p.tenduan} - ${p.status} - Deadline: ${end}\n`;
            });
            answer += '\n';
        } else {
            answer += `📁 Bạn chưa được phân công phụ trách dự án nào.\n\n`;
        }

        const myTasks = (context.tasks || []).filter(t =>
            t.nguoiDuocGiao && t.nguoiDuocGiao.id === user.id
        );

        if (myTasks.length > 0) {
            answer += `📋 **Công việc được giao cho bạn (${myTasks.length}):**\n`;
            myTasks.slice(0, 10).forEach((t, i) => {
                const end = t.ngayKetThuc ? new Date(t.ngayKetThuc).toLocaleDateString('vi-VN') : 'N/A';
                answer += `${i+1}. ${t.tentask} - ${t.trangThai} - Hạn: ${end}\n`;
            });
            if (myTasks.length > 10) {
                answer += `... và ${myTasks.length - 10} công việc khác\n`;
            }
        } else {
            answer += `📋 Bạn chưa có công việc nào được giao.\n`;
        }

        return answer;
    }

    handleGroupMemberQuestion(context, intent) {
        const user = context.currentUser;
        if (!user) {
            return '❌ Không xác định được thông tin người dùng hiện tại.';
        }

        const groups = context.groups || [];
        const leadingGroups = groups.filter(g => this.isUserLeaderOfGroup(g, user.id));

        if (leadingGroups.length === 0) {
            return '❌ Bạn chưa phụ trách nhóm nào.';
        }

        // Focus on the first group they lead (most relevant for follow-up)
        const targetGroup = leadingGroups[0];
        const members = this.getGroupMembers(targetGroup);

        let answer = `👥 **Thành viên nhóm "${targetGroup.name}":**\n\n`;
        
        if (members.length === 0) {
            answer += 'Nhóm này chưa có thành viên nào.\n';
        } else {
            members.forEach((member, index) => {
                const name = member.hoten || 'N/A';
                const code = member.manv ? ` (${member.manv})` : '';
                const role = member.chucvu || '';
                answer += `${index + 1}. **${name}**${code}`;
                if (role) {
                    answer += ` - ${role}`;
                }
                answer += '\n';
            });
            answer += `\n_Tổng cộng: ${members.length} thành viên_`;
        }

        if (leadingGroups.length > 1) {
            answer += `\n\n💡 _Bạn còn phụ trách ${leadingGroups.length - 1} nhóm khác. Hỏi cụ thể tên nhóm nếu cần xem thành viên của nhóm đó._`;
        }

        return answer;
    }

    generateGeneralSummary(context) {
        let answer = '📊 **TỔNG QUAN HỆ THỐNG:**\n\n';

        if (context.projects) {
            answer += `📁 Dự án: ${context.projects.length}\n`;
        }
        if (context.tasks) {
            answer += `📋 Công việc: ${context.tasks.length}\n`;
        }
        if (context.users) {
            answer += `👥 Thành viên: ${context.users.length}\n`;
        }
        if (context.groups) {
            answer += `👨‍👩‍👧‍👦 Nhóm: ${context.groups.length}\n`;
        }

        answer += `\n💡 *Hãy hỏi cụ thể hơn để tôi có thể trả lời chi tiết!*`;

        return answer;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    extractSources(context) {
        const sources = [];
        if (context.projects?.length) sources.push({ type: 'projects', count: context.projects.length });
        if (context.tasks?.length) sources.push({ type: 'tasks', count: context.tasks.length });
        if (context.users?.length) sources.push({ type: 'users', count: context.users.length });
        if (context.groups?.length) sources.push({ type: 'groups', count: context.groups.length });
        return sources;
    }

    getGroupMembers(group) {
        if (!group) return [];
        
        // Try the belongsToMany association first
        if (group.members && Array.isArray(group.members)) {
            return group.members;
        }
        
        // Fallback to hasMany association if available
        if (group.groupMembers && Array.isArray(group.groupMembers)) {
            return group.groupMembers.map(gm => gm.user).filter(u => u);
        }
        
        return [];
    }

    isUserLeaderOfGroup(group, userId) {
        if (!group || !userId) return false;
        const leaderId = group.leader?.id || group.leaderId;
        return leaderId === userId;
    }

    isUserMemberOfGroup(group, userId) {
        if (!group || !userId) return false;

        if (group.members && Array.isArray(group.members)) {
            return group.members.some(member => member.id === userId || member.userId === userId);
        }

        if (group.groupMembers && Array.isArray(group.groupMembers)) {
            return group.groupMembers.some(member => member.userId === userId || member.user?.id === userId);
        }

        return false;
    }

    generateErrorResponse(question, error) {
        return {
            answer: `❌ Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn: "${question}"\n\nLỗi: ${error.message}\n\nVui lòng thử lại sau.`,
            sources: [],
            confidence: 'low'
        };
    }
}

module.exports = new AIServiceV2();
