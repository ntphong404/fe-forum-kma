import { ApiService } from '@/api/api.service';
import type { Notification, NotificationListResponse } from '@/interfaces/notification.types';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://72.60.198.235:8080/api/v1';
const NOTIFICATION_SERVICE_BASE = '/notifications';

export class NotificationService {
    /**
     * Lấy danh sách thông báo của user hiện tại
     * Gọi trực tiếp API để nhận đúng response structure
     */
    static async getNotifications(userId: string): Promise<NotificationListResponse> {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get<NotificationListResponse>(
            `${API_BASE_URL}${NOTIFICATION_SERVICE_BASE}?userId=${userId}`,
            {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            }
        );
        // Backend trả về trực tiếp { unreadCount, data }
        return response.data;
    }

    /**
     * Đánh dấu một thông báo đã đọc
     */
    static async markAsRead(notificationId: string, userId: string): Promise<Notification> {
        const response = await ApiService.put<Notification>(
            `${NOTIFICATION_SERVICE_BASE}/${notificationId}/read?userId=${userId}`,
            {},
            true
        );
        return response;
    }

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    static async markAllAsRead(userId: string): Promise<number> {
        const response = await ApiService.put<number>(
            `${NOTIFICATION_SERVICE_BASE}/read-all?userId=${userId}`,
            {},
            true
        );
        return response;
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const response = await ApiService.get<number>(
            `${NOTIFICATION_SERVICE_BASE}/unread-count?userId=${userId}`,
            true
        );
        return response;
    }
}
