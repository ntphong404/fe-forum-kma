// Components
export { default as UserChatButton } from './components/UserChatButton';
export { default as ChatPage } from './components/ChatPage';
export { default as ChatWindow } from './components/ChatWindow';
export { default as AIChatWindow } from './components/AIChatWindow';
export { default as MiniAIChatWindow } from './components/MiniAIChatWindow';
export { default as AIAvatar } from './components/AIAvatar';
export { default as ConversationList, AI_CONVERSATION_ID } from './components/ConversationList';
export { default as CreateGroupDialog } from './components/CreateGroupDialog';
export { default as ChatIconButton } from './components/ChatIconButton';
export { default as ChatHeaderIcon } from './components/ChatHeaderIcon';
export { default as ChatDropdown } from './components/ChatDropdown';
export { default as MiniChatWindow } from './components/MiniChatWindow';
export { default as ChatManager } from './components/ChatManager';
export { default as NewMessageDialog } from './components/NewMessageDialog';
export { default as StartChatButton } from './components/StartChatButton';
export { default as ChatContainer } from './components/ChatContainer';
export { default as FriendsList } from './components/FriendsList';
export { default as ChatMediaUpload } from './components/ChatMediaUpload';
export { default as ChatMessageContent } from './components/ChatMessageContent';

// Services
export { ChatService } from './services/chat.service';

// Utils
export { startChatWithUser, openFriendsList, closeFriendsList } from './utils/chatActions';

// Types
export type {
  Message,
  Conversation,
  SendMessageRequest,
  CreateGroupRequest,
  CreateGroupResponse,
  MessageType,
  ConversationType,
} from '@/interfaces/chat.types';
