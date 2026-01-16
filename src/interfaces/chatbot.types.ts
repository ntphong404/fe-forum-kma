export interface ChatBotMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    buttons?: ChatBotButton[];
}

export interface ChatBotButton {
    title: string;
    payload: string;
    type: string;
}

export interface ChatBotRequest {
    sender: string;
    message: string;
}

export interface ChatBotResponseItem {
    recipient_id: string;
    text: string;
    buttons?: ChatBotButton[];
}

export type ChatBotResponse = ChatBotResponseItem[];
