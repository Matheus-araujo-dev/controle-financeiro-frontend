import { create } from 'zustand';
import type { AppNotification, AppNotificationLevel } from '../types/notification';

type NotificationState = {
  queue: AppNotification[];
  push: (notification: Omit<AppNotification, 'id'>) => void;
  shift: () => void;
  clear: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  queue: [],
  push: (notification) =>
    set((state) => ({
      queue: [
        ...state.queue,
        {
          ...notification,
          id: crypto.randomUUID()
        }
      ]
    })),
  shift: () =>
    set((state) => ({
      queue: state.queue.slice(1)
    })),
  clear: () => set({ queue: [] })
}));

export function notify(level: AppNotificationLevel, title: string, description?: string) {
  useNotificationStore.getState().push({
    level,
    title,
    description
  });
}
