import { create } from 'zustand';
import { apiFetch } from '../utils/api';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  status: string;
  isRead: boolean;
  metadata?: any;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  announcements: Announcement[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  fetchAnnouncements: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  refresh: () => Promise<void>;
}

const extractData = (payload: any) =>
  payload?.success && payload?.data ? payload.data : payload;

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  announcements: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await apiFetch('/api/v1/notifications', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const data = extractData(json);
        // Backend returns { notifications: [...] }
        const list = data?.notifications || (Array.isArray(data) ? data : []);
        set({ notifications: list });
      }
    } catch {}
  },

  fetchAnnouncements: async () => {
    try {
      const res = await apiFetch('/api/v1/announcements', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const data = extractData(json);
        // Backend returns { items: [...], pagination: {...} }
        const list = data?.items || data?.announcements || (Array.isArray(data) ? data : []);
        set({ announcements: list });
      }
    } catch {}
  },

  fetchUnreadCount: async () => {
    try {
      const res = await apiFetch('/api/v1/notifications/unread-count', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const data = extractData(json);
        set({ unreadCount: typeof data === 'number' ? data : data?.count || data?.unreadCount || 0 });
      }
    } catch {}
  },

  markAsRead: async (id: string) => {
    try {
      await apiFetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, status: 'READ' } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {}
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  refresh: async () => {
    const { fetchNotifications, fetchAnnouncements, fetchUnreadCount } = get();
    await Promise.all([fetchNotifications(), fetchAnnouncements(), fetchUnreadCount()]);
  },
}));

export default useNotificationStore;
