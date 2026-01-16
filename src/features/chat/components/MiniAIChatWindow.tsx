import { useState, useRef, useEffect } from 'react';
import { X, Send, RotateCw, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatbotService } from '../../chatbot/services/chatbot.service';
import type { ChatBotMessage } from '@/interfaces/chatbot.types';
import AIAvatar from './AIAvatar';
import TypingMessage from './TypingMessage';
import { useAuthStore } from '@/store/useStore';

interface MiniAIChatWindowProps {
  onClose: () => void;
  position: number;
}

export default function MiniAIChatWindow({ onClose, position }: MiniAIChatWindowProps) {
  const user = useAuthStore((s) => s.user);
  const [senderId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<ChatBotMessage[]>([
    {
      id: '1',
      text: 'Chào bạn! 👋 Mình là Trợ lý AI KMA. Bạn cần hỗ trợ gì?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Track which message is currently being typed (for typing effect)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate position (stacked from right)
  const rightOffset = 16 + position * 340;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        text: 'Chào bạn! 👋 Mình là Trợ lý AI KMA. Bạn cần hỗ trợ gì?',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setInputValue('');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatBotMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage({
        sender: senderId,
        message: currentInput,
      });

      if (response && response.length > 0) {
        // Add all bot responses and start typing animation for the first one
        const botResponses: ChatBotMessage[] = response.map((item, index) => ({
          id: `${Date.now()}_${index}`,
          text: item.text,
          sender: 'bot' as const,
          timestamp: new Date(),
          buttons: item.buttons,
        }));

        setMessages((prev) => [...prev, ...botResponses]);
        // Start typing animation for the first bot response
        if (botResponses.length > 0) {
          setTypingMessageId(botResponses[0].id);
        }
      }
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      const botResponse: ChatBotMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setTypingMessageId(botResponse.id);
    } finally {
      setIsLoading(false);
      // Delay focus to ensure input is enabled after state update
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card
      className="fixed bottom-0 w-80 h-[480px] z-40 shadow-2xl flex flex-col gap-0 overflow-hidden border border-purple-200 rounded-t-2xl rounded-b-none bg-white"
      style={{ right: `${rightOffset}px` }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AIAvatar size="sm" />
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1">
              Trợ lý AI
              <Sparkles className="w-3 h-3" />
            </h3>
            <p className="text-xs text-white/80">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
            title="Làm mới"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-purple-50/50 to-white">
        {messages.map((message) => {
          // Find if this message should be animated (it's the current typing message)
          const shouldAnimate = message.sender === 'bot' && message.id === typingMessageId;

          // Find the next bot message to animate after this one completes
          const handleTypingComplete = () => {
            // Find the next bot message after the current one
            const currentBotMessages = messages
              .filter((m) => m.sender === 'bot')
              .map((m) => m.id);
            const currentIndex = currentBotMessages.indexOf(message.id);
            const nextBotMessageId = currentBotMessages[currentIndex + 1];

            if (nextBotMessageId) {
              setTypingMessageId(nextBotMessageId);
            } else {
              setTypingMessageId(null);
            }
          };

          return (
            <div
              key={message.id}
              className={`flex gap-2 items-end ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'bot' && (
                <AIAvatar size="sm" className="mb-1" />
              )}

              {message.sender === 'bot' ? (
                <TypingMessage
                  message={message}
                  shouldAnimate={shouldAnimate}
                  onTypingComplete={handleTypingComplete}
                  typingSpeed={15}
                  variant="mini"
                />
              ) : (
                <div className="flex flex-col items-end max-w-[85%]">
                  <div className="rounded-2xl px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-sm">
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                </div>
              )}

              {message.sender === 'user' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs mb-1 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    user?.firstName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2 justify-start items-end">
            <AIAvatar size="sm" className="mb-1" />
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập câu hỏi..."
            className="flex-1 h-9 text-sm rounded-full border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-400"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-9 w-9 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
