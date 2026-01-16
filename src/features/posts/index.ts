// ===================================
// POSTS FEATURE
// ===================================

// Components
export { default as PostCard } from './components/PostCard';
export { default as PostDetailModal } from './components/PostDetailModal';
export { default as CreatePost } from './components/CreatePost';
export { default as ForumFeed } from './components/ForumFeed';

// Post sub-components
export * from './components/post';

// Services
export { PostService } from './services/post.service';

// Hooks
export { useAuthorInfo } from './hooks/useAuthorInfo';

// Re-export hooks from other features for convenience
export { useReaction } from '@/features/reactions/hooks/useReaction';
export { useGroupInfo } from '@/features/groups/hooks/useGroupInfo';

// Types
export type {
    ApiPost,
    PostStatus,
    PostType,
    PaginatedResponse,
    CreatePostRequest,
    UpdatePostRequest,
} from '@/interfaces/post.types';
