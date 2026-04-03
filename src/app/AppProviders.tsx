import type { PropsWithChildren } from 'react';
import { App as AntdApp } from 'antd';
import { NotificationCenter } from '../components/feedback/NotificationCenter';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AntdApp>
      <NotificationCenter />
      {children}
    </AntdApp>
  );
}
