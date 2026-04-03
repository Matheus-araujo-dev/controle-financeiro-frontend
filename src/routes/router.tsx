import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

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
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
];

export const appRouter = createBrowserRouter(appRoutes);
