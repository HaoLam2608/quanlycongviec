// Use AI Service V2 for enhanced intelligence
const aiService = require('../services/aiService.v2');

/**
 * Ask AI a question about the project data
 */
exports.askAI = async (req, res) => {
    try {
        const { question } = req.body;
        const userId = req.user.id;

        if (!question || question.trim().length === 0) {
            return res.status(400).json({ error: 'Question is required' });
        }

        console.log(`🤖 AI Request from user ${userId}: "${question}"`);

        // Query AI service V2
        const response = await aiService.queryDatabase(question, userId);

        res.json({
            success: true,
            question,
            ...response
        });
    } catch (error) {
        console.error('AI ask error:', error);
        res.status(500).json({ 
            error: error.message,
            answer: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.'
        });
    }
};

/**
 * Get AI chat history for user
 */
exports.getChatHistory = async (req, res) => {
    try {
        // TODO: Implement chat history storage
        res.json({
            history: []
        });
    } catch (error) {
        console.error('Get AI history error:', error);
        res.status(500).json({ error: error.message });
    }
};
