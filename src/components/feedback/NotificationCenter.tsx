import { useEffect } from 'react';
import { App as AntdApp } from 'antd';
import { useNotificationStore } from '../../store/notification-store';

export function NotificationCenter() {
  const { notification } = AntdApp.useApp();
  const item = useNotificationStore((state) => state.queue[0]);
  const shift = useNotificationStore((state) => state.shift);

  useEffect(() => {
    if (!item) {
      return;
    }

    notification[item.level]({
      title: item.title,
      description: item.description,
      placement: 'topRight',
      duration: 4,
    });

    shift();
  }, [item, notification, shift]);

  return null;
}
