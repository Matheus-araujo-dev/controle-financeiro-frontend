import { useEffect, useState } from 'react';
import { App as AntdApp } from 'antd';
import { useNotificationStore } from '../../store/notification-store';

type LiveAnnouncement = { text: string; assertive: boolean } | null;

export function NotificationCenter() {
  const { notification } = AntdApp.useApp();
  const item = useNotificationStore((state) => state.queue[0]);
  const shift = useNotificationStore((state) => state.shift);
  const [announcement, setAnnouncement] = useState<LiveAnnouncement>(null);

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

    // Anuncia a notificação para leitores de tela via região live (o toast do AntD
    // não é anunciado de forma confiável). Erros/avisos são assertivos; info/sucesso, polite.
    setAnnouncement({
      text: item.description ? `${item.title}. ${item.description}` : item.title,
      assertive: item.level === 'error' || item.level === 'warning',
    });

    shift();
  }, [item, notification, shift]);

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
