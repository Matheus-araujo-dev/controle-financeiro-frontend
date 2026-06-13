import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { financialRouteObjects, placeholderRouteObjects, supportRegistryRouteObjects, comprasPlanejadasRouteObjects } from './route-definitions';

const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const NeonLedgerLayout = lazy(() => import('../layouts/NeonLedgerLayout').then(m => ({ default: m.NeonLedgerLayout })));
const AccessDeniedPage = lazy(() => import('../pages/AccessDeniedPage').then(m => ({ default: m.AccessDeniedPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const FamiliaPage = lazy(() => import('../features/familia/FamiliaPage').then(m => ({ default: m.FamiliaPage })));
const RelatoriosPage = lazy(() => import('../features/relatorios/RelatoriosPage').then(m => ({ default: m.RelatoriosPage })));
const OrcamentoPage = lazy(() => import('../features/orcamento/pages/OrcamentoPage').then(m => ({ default: m.OrcamentoPage })));
const AceitarConvitePage = lazy(() => import('../features/familia/AceitarConvitePage').then(m => ({ default: m.AceitarConvitePage })));
const NotFoundPage = lazy(() => import('./NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AgenteChatPage = lazy(() => import('../features/agente/AgenteChatPage').then(m => ({ default: m.AgenteChatPage })));
const WhatsappVinculoPage = lazy(() => import('../features/agente/WhatsappVinculoPage').then(m => ({ default: m.WhatsappVinculoPage })));

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <NeonLedgerLayout />
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
      {
        path: 'orcamento',
        element: <OrcamentoPage />,
        handle: {
          title: 'Orçamento'
        }
      },
      {
        path: 'relatorios',
        element: <RelatoriosPage />,
        handle: {
          title: 'Relatórios'
        }
      },
      {
        path: 'familia',
        element: <FamiliaPage />,
        handle: {
          title: 'Família'
        }
      },
      {
        path: 'compras-planejadas',
        handle: {
          title: 'Planejador de Compras'
        },
        children: comprasPlanejadasRouteObjects
      },
      {
        path: 'agente/chat',
        element: <AgenteChatPage />,
        handle: { title: 'Chat financeiro' }
      },
      {
        path: 'agente/whatsapp',
        element: <WhatsappVinculoPage />,
        handle: { title: 'Vínculo WhatsApp' }
      },
      ...supportRegistryRouteObjects,
      ...financialRouteObjects,
      ...placeholderRouteObjects
    ]
  },
  {
    path: '/convite/:token',
    element: <AceitarConvitePage />
  },
  {
    path: '/login',
    element: <LoginPage />
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
