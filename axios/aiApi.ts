import api from './config';

export const aiApi = {
  // Ask AI a question
  async ask(question: string) {
    const response = await api.post('/ai/ask', { question });
    return response.data;
  },

  // Get chat history
  async getHistory() {
    const response = await api.get('/ai/history');
    return response.data;
  }
};
