import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface NotificationItem {
  _id: string;
  type?: 'message' | 'course' | 'schedule' | 'post' | string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/api/notifications');
      const data = response.data;
      set({
        notifications: data.notifications || [],
        unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : (data.notifications || []).filter((n: any) => !n.isRead).length,
        isLoading: false,
      });
    } catch (error) {
      // Fallback notifications if endpoint is empty
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.warn('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.put('/api/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.warn('Error marking all notifications as read:', error);
    }
  },
}));
