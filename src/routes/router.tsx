import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { financialRouteObjects, placeholderRouteObjects, supportRegistryRouteObjects } from './route-definitions';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    handle: {
      title: 'Inicio'
    },
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        handle: {
          title: 'Dashboard'
        }
      },
      ...supportRegistryRouteObjects,
      ...financialRouteObjects,
      ...placeholderRouteObjects
    ]
  },
  {
    path: '/acesso-negado',
    element: <AccessDeniedPage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
];

export const appRouter = createBrowserRouter(appRoutes);
