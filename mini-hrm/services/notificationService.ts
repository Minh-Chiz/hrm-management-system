import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { ApiResponse, AppNotification, CreateNotificationPayload } from '@/types';
import { simulateDelay, fetchWithAuth } from './apiUtils';

const STORAGE_KEY_NOTIFICATIONS = '@hrm_notifications';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    userId: '1', // Trần Văn A
    title: 'Đơn được duyệt 🎉',
    message: 'Đơn xin nghỉ phép ngày 15/07 của bạn đã được duyệt.',
    time: '10 phút trước',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    type: 'request_approved',
    icon: 'check-circle',
    iconColor: '#05e777',
    read: false,
  },
  {
    id: 'n2',
    userId: '1', // Trần Văn A
    title: 'Công việc mới 📋',
    message: 'Bạn được giao công việc mới: Fix bug giao diện mobile.',
    time: '1 giờ trước',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    type: 'task_assigned',
    icon: 'assignment',
    iconColor: '#00e5ff',
    read: false,
  },
  {
    id: 'n3',
    userId: '2', // Nguyễn Thị B
    title: 'Thông báo hệ thống 📢',
    message: 'Hệ thống sẽ bảo trì từ 23:00 - 01:00 ngày 20/07/2026.',
    time: 'Hôm qua',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'system',
    icon: 'campaign',
    iconColor: '#bac9cc',
    read: true,
  },
];

const mapBackendNotificationToAppNotification = (item: any): AppNotification => {
  const defaultIcons: Record<string, AppNotification['icon']> = {
    request_approved: 'check-circle',
    request_rejected: 'cancel',
    task_assigned: 'assignment',
    system: 'campaign',
  };

  const defaultColors: Record<string, string> = {
    request_approved: '#05e777',
    request_rejected: '#ffb4ab',
    task_assigned: '#00e5ff',
    system: '#bac9cc',
  };

  const type = (item.type as AppNotification['type']) || 'system';

  return {
    id: String(item.id),
    userId: String(item.userId),
    title: item.title || '',
    message: item.message || '',
    time: item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'),
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    type,
    icon: item.icon || defaultIcons[type] || 'campaign',
    iconColor: item.iconColor || defaultColors[type] || '#bac9cc',
    read: Boolean(item.read ?? item.isRead ?? false),
    requestId: item.requestId ? String(item.requestId) : undefined,
  };
};

export const notificationService = {
  /**
   * Fetch all notifications
   */
  async getNotifications(): Promise<ApiResponse<AppNotification[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(150);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        const data: AppNotification[] = stored ? (JSON.parse(stored) as AppNotification[]) : INITIAL_NOTIFICATIONS;
        return { success: true, data };
      } catch (e) {
        return { success: true, data: INITIAL_NOTIFICATIONS };
      }
    } else {
      const res = await fetchWithAuth<any[]>('/notifications');
      if (res.success && Array.isArray(res.data)) {
        const notifications = res.data.map(mapBackendNotificationToAppNotification);
        return { success: true, data: notifications };
      }
      return { success: false, data: [], message: res.message };
    }
  },

  /**
   * Add a new notification
   */
  async addNotification(payload: CreateNotificationPayload): Promise<ApiResponse<AppNotification[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(150);
      const res = await this.getNotifications();
      const currentList = res.data || INITIAL_NOTIFICATIONS;

      const newNoti: AppNotification = {
        id: String(Date.now() + Math.random()),
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        time: 'Vừa xong',
        createdAt: new Date().toISOString(),
        type: payload.type,
        icon: payload.icon,
        iconColor: payload.iconColor,
        read: false,
        requestId: payload.requestId,
      };

      const updated = [newNoti, ...currentList];
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Đã gửi thông báo mới' };
    } else {
      const createRes = await fetchWithAuth<any>('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: payload.userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          icon: payload.icon,
          iconColor: payload.iconColor,
          requestId: payload.requestId,
        }),
      });

      if (createRes.success) {
        return await this.getNotifications();
      }
      return { success: false, message: createRes.message };
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<ApiResponse<AppNotification[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(150);
      const res = await this.getNotifications();
      const currentList = res.data || INITIAL_NOTIFICATIONS;

      const updated = currentList.map(n => (n.id === id ? { ...n, read: true } : n));
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
      return { success: true, data: updated };
    } else {
      const updateRes = await fetchWithAuth<any>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (updateRes.success) {
        return await this.getNotifications();
      }
      return { success: false, message: updateRes.message };
    }
  },

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<ApiResponse<AppNotification[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(150);
      const res = await this.getNotifications();
      const currentList = res.data || INITIAL_NOTIFICATIONS;

      const updated = currentList.map(n =>
        n.userId === userId || n.userId === 'all' ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
      return { success: true, data: updated };
    } else {
      const updateRes = await fetchWithAuth<any>('/notifications/read-all', {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      });

      if (updateRes.success) {
        return await this.getNotifications();
      }
      return { success: false, message: updateRes.message };
    }
  },
};

