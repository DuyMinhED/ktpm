import axiosInstance from './axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  success: boolean;
  reply: string | null;
  error: string | null;
}

export const aiApi = {
  chat: async (message: string, history: ChatMessage[] = []): Promise<AiChatResponse> => {
    const response = await axiosInstance.post('/v1/ai/chat', {
      message,
      history,
    });
    return response.data;
  },
};
