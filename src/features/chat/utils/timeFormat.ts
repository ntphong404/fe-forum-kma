/**
 * Format message time professionally for chat messages
 * - Today: just show time (15:27)
 * - Yesterday: "Hôm qua, 14:30"
 * - Within 7 days: "Thứ 2, 10:00"
 * - Older: "30/12/2025, 15:45"
 */
export const formatMessageTime = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Today: just show time
    if (messageDate.getTime() === today.getTime()) {
        return timeStr;
    }

    // Yesterday: "Hôm qua, 14:30"
    if (messageDate.getTime() === yesterday.getTime()) {
        return `Hôm qua, ${timeStr}`;
    }

    // Within the same week (last 7 days): "Thứ 2, 10:00"
    const daysDiff = Math.floor((today.getTime() - messageDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysDiff < 7) {
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return `${dayNames[date.getDay()]}, ${timeStr}`;
    }

    // Older: "30/12/2025, 15:45"
    const dateStr = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    return `${dateStr}, ${timeStr}`;
};

/**
 * Format time for conversation list (last message time)
 * - Today: just show time (15:27)
 * - Yesterday: "Hôm qua"
 * - Within 7 days: "Thứ 2"
 * - Older: "30/12"
 */
export const formatConversationTime = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Today: just show time
    if (messageDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    // Yesterday
    if (messageDate.getTime() === yesterday.getTime()) {
        return 'Hôm qua';
    }

    // Within the same week (last 7 days)
    const daysDiff = Math.floor((today.getTime() - messageDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysDiff < 7) {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return dayNames[date.getDay()];
    }

    // Older: "30/12"
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
    });
};
