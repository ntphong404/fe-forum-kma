import { useState, useEffect } from 'react';
import { GroupService } from '@/features/groups/services/group.service';

interface GroupInfo {
    groupName: string;
    isLoading: boolean;
}

interface UseGroupInfoParams {
    groupId?: string;
    initialGroupName?: string;
}

/**
 * Custom hook để fetch và cache thông tin group
 * Nếu backend đã cung cấp groupName, sử dụng trực tiếp
 * Nếu không, fetch từ GroupService
 */
export function useGroupInfo({
    groupId,
    initialGroupName,
}: UseGroupInfoParams): GroupInfo {
    const [groupName, setGroupName] = useState<string>(initialGroupName || '');
    const [isLoading, setIsLoading] = useState<boolean>(
        !initialGroupName && !!groupId
    );

    useEffect(() => {
        // Nếu không có groupId, không cần fetch
        if (!groupId) {
            setGroupName('');
            setIsLoading(false);
            return;
        }

        // Nếu backend đã cung cấp groupName, sử dụng trực tiếp
        if (initialGroupName) {
            setGroupName(initialGroupName);
            setIsLoading(false);
            return;
        }

        // Fallback: fetch từ GroupService
        let isMounted = true;

        const loadGroup = async () => {
            try {
                setIsLoading(true);
                const group = await GroupService.getGroupById(groupId);

                if (isMounted) {
                    setGroupName(group.groupName || '');
                }
            } catch {
                if (isMounted) {
                    setGroupName('');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadGroup();

        return () => {
            isMounted = false;
        };
    }, [groupId, initialGroupName]);

    return { groupName, isLoading };
}

export default useGroupInfo;
