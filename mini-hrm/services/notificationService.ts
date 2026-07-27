import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { ApiResponse, AppNotification, CreateNotificationPayload } from '@/types';
import { simulateDelay } from './apiUtils';

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

export const notificationService = {
  /**
   * Fetch all notifications
   */
  async getNotifications(): Promise<ApiResponse<AppNotification[]>> {
    await simulateDelay(150);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      const data: AppNotification[] = stored ? (JSON.parse(stored) as AppNotification[]) : INITIAL_NOTIFICATIONS;
      return { success: true, data };
    } catch (e) {
      return { success: true, data: INITIAL_NOTIFICATIONS };
    }
  },

  /**
   * Add a new notification
   */
  async addNotification(payload: CreateNotificationPayload): Promise<ApiResponse<AppNotification[]>> {
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
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<ApiResponse<AppNotification[]>> {
    await simulateDelay(150);
    const res = await this.getNotifications();
    const currentList = res.data || INITIAL_NOTIFICATIONS;

    const updated = currentList.map(n => (n.id === id ? { ...n, read: true } : n));
    await AsyncStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    return { success: true, data: updated };
  },

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<ApiResponse<AppNotification[]>> {
    await simulateDelay(150);
    const res = await this.getNotifications();
    const currentList = res.data || INITIAL_NOTIFICATIONS;

    const updated = currentList.map(n =>
      n.userId === userId || n.userId === 'all' ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    return { success: true, data: updated };
  },
};
