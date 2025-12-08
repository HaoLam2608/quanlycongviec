const fs = require('fs');
const path = require('path');

const FEEDBACK_FILE = path.join(__dirname, '..', 'uploads', 'ai-feedback.log');

async function ensureDir() {
    await fs.promises.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
}

async function recordFeedback(payload) {
    await ensureDir();
    const entry = {
        ...payload,
        timestamp: new Date().toISOString()
    };
    await fs.promises.appendFile(FEEDBACK_FILE, JSON.stringify(entry) + '\n', 'utf8');
    return entry;
}

module.exports = {
    recordFeedback
};
