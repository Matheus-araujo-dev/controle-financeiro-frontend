export type AppNotificationLevel = 'success' | 'info' | 'warning' | 'error';

export type AppNotification = {
  id: string;
  level: AppNotificationLevel;
  title: string;
  description?: string;
};
