import React, { useEffect, useMemo, useState } from 'react';
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
  '/faturas/importar': 'upload_file',
  '/importacoes-whatsapp': 'chat',
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

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  } catch {
    return false;
  }
}

function readCollapsedGroups(): Set<string> {
  try {
    const stored = localStorage.getItem('sidebar-collapsed-groups');
    if (stored) {
      return new Set<string>(JSON.parse(stored) as string[]);
    }
  } catch { /* ignore */ }
  return new Set<string>();
}

interface NeonLedgerLayoutProps {
  children?: React.ReactNode;
}

export function NeonLedgerLayout({ children }: NeonLedgerLayoutProps) {
  const matches = useMatches();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { pageTitle, setPageTitle } = useAppShellStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(readSidebarCollapsed);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(readCollapsedGroups);

  const breadcrumbTitles = useMemo(
    () =>
      matches
        .map((match) => (match.handle as RouteHandle | undefined)?.title)
        .filter((title): title is string => Boolean(title)),
    [matches]
  );

  const selectedKey = useMemo(() => {
    const currentPath = location.pathname;
    const candidates = navigationItems
      .flatMap((item) => [item.key, ...(item.aliases ?? [])].map((prefix) => ({ key: item.key, prefix })))
      .sort((left, right) => right.prefix.length - left.prefix.length);
    return (
      candidates.find(
        ({ prefix }) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
      )?.key ?? '/dashboard'
    );
  }, [location.pathname]);

  useEffect(() => {
    setPageTitle(breadcrumbTitles.at(-1) ?? 'Dashboard');
  }, [breadcrumbTitles, setPageTitle]);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function toggleGroup(groupKey: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      try { localStorage.setItem('sidebar-collapsed-groups', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  const handleLogout = async () => {
    const { clearSession } = useAuthStore.getState();
    try {
      await logoutSession();
    } catch {
      // Logout local sempre acontece, mesmo se a API estiver fora.
    }
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-surface font-body text-white min-h-screen" data-testid="admin-shell">
      {/* Barra superior */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-8 py-4 bg-surface/90 backdrop-blur-md border-b border-white/5">
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
          <QuickLaunchButton
            className="hidden sm:inline-flex shadow-[0_0_12px_rgba(63,255,139,0.12)]"
            icon={<span className="material-symbols-outlined block text-lg leading-none">add</span>}
          >
            Lançar
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
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-[72px] bottom-0 bg-surface-container-low py-4 overflow-y-auto overflow-x-hidden transition-all duration-200 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Botão retrair/expandir */}
        <div className={`flex mb-4 px-3 ${sidebarCollapsed ? 'justify-center' : 'justify-end'}`}>
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expandir menu' : 'Retrair menu'}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-lg">
              {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="flex-1">
          {navigationStructure.map((group) => {
            const isGroupCollapsed = collapsedGroups.has(group.key);

            return (
              <div key={group.key} className={`${sidebarCollapsed ? 'mb-4' : 'mb-5'}`}>
                {/* Cabeçalho do grupo */}
                {sidebarCollapsed ? (
                  /* Em modo retraído: separador simples */
                  <div className="mx-3 mb-2 h-px bg-white/8" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-4 mb-1 group/group-header"
                  >
                    <h3 className="text-primary font-bold font-headline text-xs uppercase tracking-wider">
                      {group.label}
                    </h3>
                    <span
                      className={`material-symbols-outlined text-sm text-primary/50 group-hover/group-header:text-primary transition-all duration-200 ${
                        isGroupCollapsed ? 'rotate-0' : 'rotate-90'
                      }`}
                    >
                      chevron_right
                    </span>
                  </button>
                )}

                {/* Itens do grupo */}
                {(!isGroupCollapsed || sidebarCollapsed) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = item.key === selectedKey;
                      const icon = navIcons[item.key] ?? 'circle';

                      return (
                        <div key={item.key} className="relative group/nav-item">
                          <Link
                            to={item.key}
                            className={`flex items-center transition-all font-body text-sm font-medium ${
                              sidebarCollapsed
                                ? `justify-center py-2.5 mx-2 rounded-xl ${
                                    isActive
                                      ? 'bg-primary/12 text-primary shadow-[inset_0_0_10px_rgba(63,255,139,0.16)]'
                                      : 'text-primary hover:bg-primary/10'
                                  }`
                                : `gap-3 py-2.5 pl-4 pr-6 ${
                                    isActive
                                      ? 'bg-primary/12 text-primary shadow-[inset_0_0_10px_rgba(63,255,139,0.16)] border-r-4 border-primary/80'
                                      : 'text-primary hover:bg-primary/10'
                                  }`
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl shrink-0">{icon}</span>
                            {!sidebarCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </Link>

                          {/* Tooltip em modo retraído */}
                          {sidebarCollapsed && (
                            <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-surface-container-highest px-3 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-white/10 opacity-0 group-hover/nav-item:opacity-100 transition-opacity duration-150">
                              {item.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <main
        className={`pt-24 pb-28 lg:pb-12 px-4 md:px-8 min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
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
              item.to === selectedKey ? 'text-primary rounded-xl scale-110' : 'text-on-surface-variant'
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
