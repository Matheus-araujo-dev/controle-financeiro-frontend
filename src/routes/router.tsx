import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteErrorPage } from './RouteErrorPage';
import { lazyWithRetry as lazy } from './lazy-with-retry';
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
const AuthCallbackPage = lazy(() => import('../pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const AgenteChatPage = lazy(() => import('../features/agente/AgenteChatPage').then(m => ({ default: m.AgenteChatPage })));
const WhatsappVinculoPage = lazy(() => import('../features/agente/WhatsappVinculoPage').then(m => ({ default: m.WhatsappVinculoPage })));
const PlanosPage = lazy(() => import('../features/planos/PlanosPage').then(m => ({ default: m.PlanosPage })));
const InvestimentosPage = lazy(() => import('../features/investimentos/InvestimentosPage').then(m => ({ default: m.InvestimentosPage })));

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <NeonLedgerLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    handle: {
      title: 'Início'
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
          title: 'Espaços'
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
        path: 'planos',
        element: <PlanosPage />,
        handle: { title: 'Planos de poupança' }
      },
      {
        path: 'investimentos',
        element: <InvestimentosPage />,
        handle: { title: 'Investimentos' }
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
    element: <AceitarConvitePage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
    errorElement: <RouteErrorPage />
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
