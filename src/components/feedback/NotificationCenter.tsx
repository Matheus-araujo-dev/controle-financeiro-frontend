import { useEffect, useRef, useState } from 'react';
import { App as AntdApp } from 'antd';
import { useNotificationStore } from '../../store/notification-store';

type LiveAnnouncement = { text: string; assertive: boolean } | null;

export function NotificationCenter() {
  const { notification } = AntdApp.useApp();
  const notificationRef = useRef(notification);
  notificationRef.current = notification;

  const item = useNotificationStore((state) => state.queue[0]);
  const shift = useNotificationStore((state) => state.shift);
  const [announcement, setAnnouncement] = useState<LiveAnnouncement>(null);

  useEffect(() => {
    if (!item) return;

    // Defer to the next task so the current React commit phase completes before
    // AntD's CSSMotion schedules its own setState, preventing the infinite update loop.
    const t = setTimeout(() => {
      notificationRef.current[item.level]({
        message: item.title,
        description: item.description,
        placement: 'topRight',
        duration: 4,
      });

      setAnnouncement({
        text: item.description ? `${item.title}. ${item.description}` : item.title,
        assertive: item.level === 'error' || item.level === 'warning',
      });

      shift();
    }, 0);

    return () => clearTimeout(t);
  }, [item, shift]);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement && !announcement.assertive ? announcement.text : ''}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {announcement && announcement.assertive ? announcement.text : ''}
      </div>
    </>
  );
}
