import { create } from 'zustand';

interface UIState {
  // State
  globalLoading: boolean;
  modals: {
    [key: string]: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;

  // Actions
  setGlobalLoading: (loading: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  globalLoading: false,
  modals: {},
  notifications: [],

  // Actions
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  openModal: (modalId) => 
    set((state) => ({ 
      modals: { ...state.modals, [modalId]: true } 
    })),

  closeModal: (modalId) => 
    set((state) => ({ 
      modals: { ...state.modals, [modalId]: false } 
    })),

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));