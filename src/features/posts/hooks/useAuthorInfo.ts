import { useState, useEffect } from 'react';
import { AuthService } from '@/features/auth/services/auth.service';

interface AuthorInfo {
    authorName: string;
    authorAvatarUrl: string | null;
    isLoading: boolean;
}

interface UseAuthorInfoParams {
    authorId: string;
    initialName?: string;
    initialAvatarUrl?: string | null;
}

/**
 * Custom hook để fetch và cache thông tin author
 * Nếu backend đã cung cấp thông tin, sử dụng trực tiếp
 * Nếu không, fetch từ AuthService
 */
export function useAuthorInfo({
    authorId,
    initialName,
    initialAvatarUrl,
}: UseAuthorInfoParams): AuthorInfo {
    const [authorName, setAuthorName] = useState<string>(initialName || '');
    const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(
        initialAvatarUrl || null
    );
    const [isLoading, setIsLoading] = useState<boolean>(!initialName);

    useEffect(() => {
        // Nếu backend đã cung cấp author info, sử dụng trực tiếp
        if (initialName) {
            setAuthorName(initialName);
            setAuthorAvatarUrl(initialAvatarUrl || null);
            setIsLoading(false);
            return;
        }

        // Fallback: fetch từ AuthService
        let isMounted = true;

        const loadAuthor = async () => {
            if (!authorId) {
                setAuthorName('Ẩn danh');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const user = await AuthService.getUserById(authorId);

                if (isMounted) {
                    const name =
                        `${user.lastName || ''} ${user.firstName || ''}`.trim() ||
                        user.username ||
                        authorId.substring(0, 8);
                    setAuthorName(name);
                    setAuthorAvatarUrl(user.avatarUrl || null);
                }
            } catch {
                if (isMounted) {
                    setAuthorName(authorId?.substring(0, 8) || 'Ẩn danh');
                    setAuthorAvatarUrl(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadAuthor();

        return () => {
            isMounted = false;
        };
    }, [authorId, initialName, initialAvatarUrl]);

    return { authorName, authorAvatarUrl, isLoading };
}

export default useAuthorInfo;
