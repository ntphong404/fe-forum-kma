import axios from 'axios';
import { ChatBotRequest, ChatBotResponse } from '@/interfaces/chatbot.types';

const CHATBOT_API_URL = import.meta.env.VITE_CHAT_BOT_URL;

export const chatbotService = {
    async sendMessage(request: ChatBotRequest): Promise<ChatBotResponse> {
        try {
            const response = await axios.post<ChatBotResponse>(CHATBOT_API_URL, request, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error sending message to chatbot:', error);
            throw error;
        }
    },
};

