import type { PropsWithChildren } from 'react';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { NotificationCenter } from '../components/feedback/NotificationCenter';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3fff8b',
          colorInfo: '#3fff8b',
          colorSuccess: '#3fff8b',
          colorWarning: '#ffb84d',
          colorError: '#ff716c',
          colorLink: '#3fff8b',
          colorLinkHover: '#65ecae',
          colorLinkActive: '#13ea79',
          colorTextBase: '#ffffff',
          colorTextDescription: '#adaaaa',
          colorBgBase: '#0e0e0e',
          colorBgContainer: '#1a1a1a',
          colorBgElevated: '#20201f',
          colorBorder: 'rgba(118,117,117,0.28)',
          colorBorderSecondary: 'rgba(72,72,71,0.24)',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontFamilyCode: "'Inter', 'Segoe UI', sans-serif",
          borderRadius: 16,
          borderRadiusLG: 18,
          borderRadiusSM: 12,
          wireframe: false,
        },
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
            siderBg: '#0e0e0e',
            triggerBg: '#131313',
            triggerColor: '#ffffff',
          },
          Menu: {
            darkItemBg: 'transparent',
            itemBg: 'transparent',
            itemColor: '#adaaaa',
            itemHoverColor: '#ffffff',
            itemSelectedColor: '#3fff8b',
            itemSelectedBg: 'rgba(63, 255, 139, 0.08)',
            itemActiveBg: 'rgba(63, 255, 139, 0.08)',
            groupTitleColor: '#767575'
          },
          Card: {
            colorBgContainer: '#1a1a1a',
            colorBorderSecondary: 'rgba(72,72,71,0.2)'
          },
          Button: {
            borderRadius: 14,
            controlHeight: 40,
            controlHeightLG: 46,
            defaultBg: '#1a1a1a',
            defaultBorderColor: 'rgba(118,117,117,0.28)',
            defaultColor: '#ffffff',
            primaryShadow: '0 10px 20px rgba(63,255,139,0.18)'
          },
          Input: {
            activeBg: '#20201f',
            hoverBg: '#20201f',
            activeBorderColor: 'rgba(63,255,139,0.4)'
          },
          InputNumber: {
            activeBg: '#20201f',
            hoverBg: '#20201f',
            activeBorderColor: 'rgba(63,255,139,0.4)'
          },
          Select: {
            optionSelectedBg: 'rgba(63,255,139,0.12)',
            activeBorderColor: 'rgba(63,255,139,0.4)',
            selectorBg: '#1a1a1a'
          },
          Table: {
            headerBg: '#20201f',
            headerColor: '#adaaaa',
            rowHoverBg: '#20201f',
            colorFillAlter: '#131313',
            borderColor: 'rgba(72,72,71,0.18)'
          },
          Tag: {
            defaultBg: '#20201f',
            defaultColor: '#ffffff'
          },
          Breadcrumb: {
            itemColor: '#767575',
            lastItemColor: '#ffffff',
            linkColor: '#adaaaa',
            separatorColor: '#767575'
          }
        }
      }}
    >
      <AntdApp>
        <NotificationCenter />
        {children}
      </AntdApp>
    </ConfigProvider>
  );
}
