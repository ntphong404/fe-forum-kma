import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatIconButton from './ChatIconButton';
import MiniChatWindow from './MiniChatWindow';
import type { Conversation } from '@/interfaces/chat.types';

interface OpenChat {
  conversation: Conversation;
  id: string;
}

export default function ChatManager() {
  const navigate = useNavigate();
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);

  const handleOpenMiniChat = (conversation: Conversation) => {
    // Check if already open
    const exists = openChats.find(
      (chat) => chat.conversation.conversationId === conversation.conversationId
    );

    if (exists) {
      // Bring to front by moving to end
      setOpenChats((prev) =>
        prev.filter((c) => c.id !== exists.id).concat(exists)
      );
      return;
    }

    // Limit to 3 open chats
    setOpenChats((prev) => {
      const newChat: OpenChat = {
        conversation,
        id: conversation.conversationId,
      };

      if (prev.length >= 3) {
        return [...prev.slice(1), newChat];
      }

      return [...prev, newChat];
    });
  };

  const handleCloseChat = (id: string) => {
    setOpenChats((prev) => prev.filter((chat) => chat.id !== id));
  };

  const handleOpenFullChat = () => {
    navigate('/chat');
  };

  return (
    <>
      <ChatIconButton
        onOpenFullChat={handleOpenFullChat}
        onOpenMiniChat={handleOpenMiniChat}
      />

      {/* Mini Chat Windows */}
      {openChats.map((chat, index) => (
        <MiniChatWindow
          key={chat.id}
          conversation={chat.conversation}
          onClose={() => handleCloseChat(chat.id)}
          position={index}
        />
      ))}
    </>
  );
}
