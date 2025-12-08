// Use AI Service V2 for enhanced intelligence
const aiService = require('../services/aiService.v2');
const aiFeedbackService = require('../services/aiFeedbackService');

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

exports.rateAnswer = async (req, res) => {
    try {
        const userId = req.user.id;
        const { responseId, rating, question, answer, comment, intentSummary } = req.body;

        if (!responseId || typeof rating === 'undefined') {
            return res.status(400).json({ error: 'responseId và rating là bắt buộc' });
        }

        const numericRating = Number(rating);
        if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ error: 'rating phải nằm trong khoảng 1-5' });
        }

        const feedback = await aiFeedbackService.recordFeedback({
            userId,
            responseId,
            rating: numericRating,
            question: question || null,
            answer: answer || null,
            comment: comment || null,
            intentSummary: intentSummary || null
        });

        res.json({ success: true, feedback });
    } catch (error) {
        console.error('AI feedback error:', error);
        res.status(500).json({ error: error.message });
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
