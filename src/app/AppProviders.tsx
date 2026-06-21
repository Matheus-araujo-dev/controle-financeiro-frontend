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
          colorPrimary: '#2bf58e',
          colorInfo: '#2bf58e',
          colorSuccess: '#2bf58e',
          colorWarning: '#f5b454',
          colorError: '#f0857f',
          colorLink: '#2bf58e',
          colorLinkHover: '#6ee7b7',
          colorLinkActive: '#15dd84',
          colorTextBase: '#e8eae9',
          colorTextDescription: '#98a09d',
          colorBgBase: '#0d0f11',
          colorBgContainer: '#181b1f',
          colorBgElevated: '#1f2329',
          colorBorder: 'rgba(255,255,255,0.12)',
          colorBorderSecondary: 'rgba(255,255,255,0.07)',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontFamilyCode: "'Inter', 'Segoe UI', sans-serif",
          borderRadius: 12,
          borderRadiusLG: 14,
          borderRadiusSM: 9,
          wireframe: false,
        },
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'transparent',
            siderBg: '#0d0f11',
            triggerBg: '#121417',
            triggerColor: '#e8eae9',
          },
          Menu: {
            darkItemBg: 'transparent',
            itemBg: 'transparent',
            itemColor: '#98a09d',
            itemHoverColor: '#e8eae9',
            itemSelectedColor: '#2bf58e',
            itemSelectedBg: 'rgba(43, 245, 142, 0.10)',
            itemActiveBg: 'rgba(43, 245, 142, 0.10)',
            groupTitleColor: '#6b736f'
          },
          Card: {
            colorBgContainer: '#181b1f',
            colorBorderSecondary: 'rgba(255,255,255,0.07)'
          },
          Button: {
            borderRadius: 12,
            controlHeight: 40,
            controlHeightLG: 44,
            defaultBg: '#181b1f',
            defaultBorderColor: 'rgba(255,255,255,0.12)',
            defaultColor: '#e8eae9',
            primaryShadow: 'none'
          },
          Input: {
            activeBg: '#1f2329',
            hoverBg: '#1f2329',
            activeBorderColor: 'rgba(43,245,142,0.45)'
          },
          InputNumber: {
            activeBg: '#1f2329',
            hoverBg: '#1f2329',
            activeBorderColor: 'rgba(43,245,142,0.45)'
          },
          Select: {
            optionSelectedBg: 'rgba(43,245,142,0.12)',
            activeBorderColor: 'rgba(43,245,142,0.45)',
            selectorBg: '#181b1f'
          },
          Table: {
            headerBg: '#1f2329',
            headerColor: '#98a09d',
            rowHoverBg: '#1f2329',
            colorFillAlter: '#121417',
            borderColor: 'rgba(255,255,255,0.07)'
          },
          Tag: {
            defaultBg: '#1f2329',
            defaultColor: '#e8eae9'
          },
          Breadcrumb: {
            itemColor: '#6b736f',
            lastItemColor: '#e8eae9',
            linkColor: '#98a09d',
            separatorColor: '#6b736f'
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
