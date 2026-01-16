// Components
export { default as CommentSection } from './components/CommentSection';
export { default as CommentItem } from './components/CommentItem';
export { default as CommentMediaDisplay } from './components/CommentMediaDisplay';

// Services
export { CommentService } from './services/comment.service';
export type { GetCommentsParams } from './services/comment.service';

// Types
export type {
    Comment,
    CreateCommentRequest,
    UpdateCommentRequest,
    CommentType,
} from '@/interfaces/post.types';
