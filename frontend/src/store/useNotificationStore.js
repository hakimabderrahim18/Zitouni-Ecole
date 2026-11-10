import { create } from 'zustand';
import axios from 'axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get('/api/notifications');
      const data = response.data || {};
      const notifs = Array.isArray(data)
        ? data
        : Array.isArray(data.notifications)
        ? data.notifications
        : [];
      const unread =
        typeof data.unreadCount === 'number'
          ? data.unreadCount
          : notifs.filter((n) => !n.isRead).length;

      set({
        notifications: notifs,
        unreadCount: unread,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    if (!notification || !notification._id) return;
    const exists = get().notifications.some((n) => n._id === notification._id);
    if (exists) return;

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (notificationId) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await axios.put('/api/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
