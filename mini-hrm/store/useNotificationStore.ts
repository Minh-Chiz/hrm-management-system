import { create } from 'zustand';
import { notificationService } from '@/services';
import { AppNotification, CreateNotificationPayload } from '@/types';

interface NotificationState {
  notifications: AppNotification[];
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  addNotification: (payload: CreateNotificationPayload) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;
  setNotifications: (notifications: AppNotification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationService.getNotifications();
      if (res.success && res.data) {
        set({ notifications: res.data });
      }
    } catch (e) {
      console.error('[useNotificationStore] Error fetching notifications:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: async (payload) => {
    const res = await notificationService.addNotification(payload);
    if (res.success && res.data) set({ notifications: res.data });
  },

  markNotificationAsRead: async (id) => {
    const res = await notificationService.markAsRead(id);
    if (res.success && res.data) set({ notifications: res.data });
  },

  markAllNotificationsAsRead: async (userId) => {
    const res = await notificationService.markAllAsRead(userId);
    if (res.success && res.data) set({ notifications: res.data });
  },

  setNotifications: (notifications) => set({ notifications }),
}));
