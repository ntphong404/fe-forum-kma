import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: number;
  name: string;
  avatar: string;
  lastMessage?: string;
  unread?: number;
}

const mockContacts: Contact[] = [
  { id: 1, name: 'Nguyễn Văn An', avatar: 'NA', lastMessage: 'Oke bạn, mình hiểu rồi!', unread: 2 },
  { id: 2, name: 'Trần Thị Bình', avatar: 'TB', lastMessage: 'Cảm ơn bạn nhiều nhé' },
  { id: 3, name: 'Lê Minh Cường', avatar: 'LC', lastMessage: 'Hẹn gặp lại' },
  { id: 4, name: 'Phạm Thu Hà', avatar: 'PH', lastMessage: 'Được rồi', unread: 1 },
];

const mockMessages = [
  { id: 1, sender: 'them', text: 'Chào bạn!', time: '10:30' },
  { id: 2, sender: 'me', text: 'Chào bạn, mình có thể giúp gì không?', time: '10:31' },
  { id: 3, sender: 'them', text: 'Mình muốn hỏi về bài tập nhóm tuần này', time: '10:32' },
  { id: 4, sender: 'me', text: 'Oke bạn, deadline là thứ 6 tuần này nhé', time: '10:33' },
];

interface UserChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export default function UserChatButton({ isOpen, onToggle, unreadCount = 3 }: UserChatButtonProps) {
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && selectedChat) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedChat]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'me' as const,
        text: message,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Window - Hiển thị bên phải, ngay cạnh icon */}
      {isOpen && (
        <Card className="fixed bottom-6 right-24 w-[380px] h-[550px] z-40 shadow-2xl flex flex-col overflow-hidden border-0 rounded-2xl bg-white">
          {!selectedChat ? (
            /* Contact List */
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Tin nhắn</h3>
                    <p className="text-xs text-white/90">{mockContacts.length} đoạn chat</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
                  title="Đóng"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-0 rounded-full"
                  />
                </div>
              </div>

              {/* Contacts */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {mockContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedChat(contact)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {contact.avatar}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{contact.name}</span>
                          {contact.unread && (
                            <Badge className="bg-red-500 text-white text-xs h-5 min-w-5 rounded-full">
                              {contact.unread}
                            </Badge>
                          )}
                        </div>
                        {contact.lastMessage && (
                          <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            /* Chat View */
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedChat(null)}
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
                >
                  ←
                </Button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                    {selectedChat.avatar}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{selectedChat.name}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="h-full">
                  <div className="p-4 space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'them' && selectedChat && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs">
                            {selectedChat.avatar}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === 'me'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-800'
                            }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                        </div>
                        {msg.sender === 'me' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs">
                            B
                          </div>
                        )}
                      </div>
                    ))}\n                    {/* Invisible element for auto-scrolling */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 rounded-full"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="rounded-full bg-blue-500 hover:bg-blue-600"
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Icon Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          onClick={onToggle}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-2xl hover:scale-110 transition-all duration-300"
          size="icon"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </Button>
        {!isOpen && unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 min-w-5 rounded-full border-2 border-white">
            {unreadCount}
          </Badge>
        )}
      </div>
    </>
  );
}
