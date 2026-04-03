import { useEffect, useMemo } from 'react';
import { Breadcrumb, Layout, Menu, Space, Typography } from 'antd';
import { Link, Outlet, useMatches } from 'react-router-dom';
import { navigationItems } from '../constants/navigation';
import { useAppShellStore } from '../store/app-shell-store';

type RouteHandle = {
  title?: string;
};

export function AdminLayout() {
  const matches = useMatches();
  const { collapsed, pageTitle, setCollapsed, setPageTitle } = useAppShellStore();

  const breadcrumbItems = useMemo(
    () =>
      matches
        .map((match) => (match.handle as RouteHandle | undefined)?.title)
        .filter((title): title is string => Boolean(title))
        .map((title) => ({ title })),
    [matches]
  );

  useEffect(() => {
    setPageTitle(breadcrumbItems.at(-1)?.title ?? 'Dashboard');
  }, [breadcrumbItems, setPageTitle]);

  return (
    <Layout className="admin-layout" hasSider data-testid="admin-shell">
      <Layout.Sider
        breakpoint="lg"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        className="admin-layout__sider"
      >
        <div className="admin-layout__brand">
          <Typography.Title level={4}>Controle</Typography.Title>
          <Typography.Text>Financeiro</Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={['/dashboard']}
          items={navigationItems.map((item) => ({
            key: item.key,
            label: <Link to={item.key}>{item.label}</Link>
          }))}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="admin-layout__header">
          <Space direction={undefined} orientation="vertical" size={0}>
            <Typography.Text className="admin-layout__eyebrow">Nucleo administrativo</Typography.Text>
            <Typography.Title level={3}>{pageTitle}</Typography.Title>
          </Space>
        </Layout.Header>
        <Layout.Content className="admin-layout__content">
          <Breadcrumb items={breadcrumbItems} className="admin-layout__breadcrumb" />
          <div className="admin-layout__panel">
            <Outlet />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
