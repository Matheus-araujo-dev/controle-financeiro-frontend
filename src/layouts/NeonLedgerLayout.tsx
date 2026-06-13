import React, { useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { navigationItems, navigationStructure } from '../constants/navigation';
import { useAppShellStore } from '../store/app-shell-store';
import { useAuthStore, useCurrentUser } from '../store/auth-store';
import { logoutSession } from '../services/http/auth-api';
import { QuickLaunchButton } from '../components/quick-launch/QuickLaunchButton';

type RouteHandle = {
  title?: string;
};

const navIcons: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/orcamento': 'savings',
  '/relatorios': 'monitoring',
  '/contas-pagar': 'arrow_upward',
  '/contas-receber': 'arrow_downward',
  '/recorrencias': 'sync',
  '/movimentacoes': 'swap_horiz',
  '/faturas': 'credit_card',
  '/importacoes-whatsapp': 'chat',
  '/conciliacao': 'checklist',
  '/pessoas': 'group',
  '/formas-pagamento': 'wallet',
  '/contas-bancarias': 'account_balance',
  '/cartoes': 'credit_card',
  '/contas-gerenciais': 'account_tree',
  '/compras-planejadas': 'shopping_cart',
  '/familia': 'diversity_3',
  '/agente/chat': 'smart_toy',
  '/agente/whatsapp': 'phone_iphone'
};

const sideItemBase =
  'py-2.5 px-6 flex items-center gap-3 transition-all font-body text-sm font-medium tracking-wide';
const sideItemInactive = `${sideItemBase} text-on-surface-variant hover:bg-surface-container-highest hover:text-white`;
const sideItemActive = `${sideItemBase} bg-surface-container text-primary shadow-[inset_0_0_10px_rgba(63,255,139,0.1)] border-r-4 border-primary`;

interface NeonLedgerLayoutProps {
  children?: React.ReactNode;
}

export function NeonLedgerLayout({ children }: NeonLedgerLayoutProps) {
  const matches = useMatches();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { pageTitle, setPageTitle } = useAppShellStore();

  const breadcrumbTitles = useMemo(
    () =>
      matches
        .map((match) => (match.handle as RouteHandle | undefined)?.title)
        .filter((title): title is string => Boolean(title)),
    [matches]
  );

  const selectedKey = useMemo(() => {
    const currentPath = location.pathname;

    return (
      navigationItems
        .map((item) => item.key)
        .sort((left, right) => right.length - left.length)
        .find((key) => currentPath === key || currentPath.startsWith(`${key}/`)) ?? '/dashboard'
    );
  }, [location.pathname]);

  useEffect(() => {
    setPageTitle(breadcrumbTitles.at(-1) ?? 'Dashboard');
  }, [breadcrumbTitles, setPageTitle]);

  const handleLogout = async () => {
    const { refreshToken, clearSession } = useAuthStore.getState();
    try {
      await logoutSession(refreshToken);
    } catch {
      // Logout local sempre acontece, mesmo se a API estiver fora.
    }
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-surface font-body text-white min-h-screen" data-testid="admin-shell">
      {/* Barra superior */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-8 py-4 bg-[#0e0e0e] bg-opacity-90 backdrop-blur-md shadow-[0_20px_50px_rgba(63,255,139,0.05)]">
        <div className="flex items-center gap-6 min-w-0">
          <Link to="/dashboard" className="text-2xl font-black text-primary tracking-tighter font-headline whitespace-nowrap">
            Controle<span className="text-white">Financeiro</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 min-w-0 text-on-surface-variant text-sm font-medium">
            {breadcrumbTitles.map((title, index) => (
              <React.Fragment key={`${title}-${index}`}>
                {index > 0 ? <span className="material-symbols-outlined text-base">chevron_right</span> : null}
                <span className={index === breadcrumbTitles.length - 1 ? 'text-white' : undefined}>{title}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QuickLaunchButton className="hidden sm:flex items-center gap-2 bg-primary text-on-primary font-bold text-sm rounded-xl px-4 py-2 border-0 cursor-pointer hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-lg">add</span> Lançar
          </QuickLaunchButton>
          {currentUser ? (
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-bold text-white">{currentUser.displayName}</span>
              {currentUser.familia ? (
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  {currentUser.familia.nome}
                </span>
              ) : null}
            </div>
          ) : null}
          <Link
            to="/familia"
            title="Minha família"
            className="w-10 h-10 rounded-full border-2 border-primary/30 bg-surface-container flex items-center justify-center overflow-hidden hover:border-primary transition-all"
          >
            {currentUser?.avatarUrl ? (
              <img alt={currentUser.displayName} src={currentUser.avatarUrl} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold">{(currentUser?.displayName ?? '?').charAt(0).toUpperCase()}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            title="Sair"
            className="bg-surface-container p-2 rounded-full hover:bg-surface-container-highest cursor-pointer transition-all border-0 text-error"
          >
            <span className="material-symbols-outlined block">logout</span>
          </button>
        </div>
      </nav>

      {/* Navegação lateral */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-[72px] bottom-0 w-64 bg-surface-container-low py-6 overflow-y-auto">
        <nav className="flex-1">
          {navigationStructure.map((group) => (
            <div key={group.key} className="mb-6">
              <h3 className="px-6 mb-2 text-primary font-bold font-headline text-xs uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.key}
                    to={item.key}
                    className={item.key === selectedKey ? sideItemActive : sideItemInactive}
                  >
                    <span className="material-symbols-outlined text-xl">{navIcons[item.key] ?? 'circle'}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="lg:ml-64 pt-24 pb-28 lg:pb-12 px-4 md:px-8 min-h-screen">
        <header className="mb-6">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-medium">
            Inteligência financeira
          </p>
          <h1 className="text-2xl md:text-3xl font-black font-headline text-white mt-1 mb-0">{pageTitle}</h1>
        </header>
        {children || <Outlet />}
      </main>

      {/* Botão flutuante de lançamento rápido (mobile) */}
      <QuickLaunchButton className="lg:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-primary text-on-primary border-0 shadow-[0_10px_30px_rgba(63,255,139,0.35)] flex items-center justify-center cursor-pointer active:scale-95 transition-all" />

      {/* Navegação inferior (mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-5 pt-2 lg:hidden bg-[#0e0e0e]/80 backdrop-blur-xl rounded-t-3xl border-t border-outline-variant/15 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {[
          { to: '/dashboard', icon: 'grid_view', label: 'Home' },
          { to: '/contas-pagar', icon: 'south_west', label: 'Pagar' },
          { to: '/contas-receber', icon: 'north_east', label: 'Receber' },
          { to: '/faturas', icon: 'credit_card', label: 'Cartões' },
          { to: '/familia', icon: 'menu', label: 'Conta' }
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center p-2 font-body text-[10px] font-bold uppercase transition-all ${
              item.to === selectedKey ? 'bg-primary text-[#0e0e0e] rounded-xl scale-110' : 'text-on-surface-variant'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={item.to === selectedKey ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
