import React, { useEffect, useMemo, useState } from 'react';
import { PageHeaderActionsSlotContext } from '../components/layout/PageHeaderActionsSlot';
import { Link, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { Select } from 'antd';
import { navigationItems, navigationStructure } from '../constants/navigation';
import { useAppShellStore } from '../store/app-shell-store';
import { useAuthStore, useCurrentUser } from '../store/auth-store';
import { logoutSession } from '../services/http/auth-api';
import { QuickLaunchButton } from '../components/quick-launch/QuickLaunchButton';
import { Tooltip } from '../components/ui/Tooltip';
import { listarMinhasParticipacoes, selecionarWorkspace, type ParticipacaoWorkspaceResponse } from '../features/familia/familia-api';
import { notify } from '../store/notification-store';
import { getApiErrorMessage } from '../services/http/api-error';

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

const PRIMARY = '#2bf58e';
const ERROR = '#f0857f';

function readSidebarCollapsed(): boolean {
  try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
}

function readCollapsedGroups(): Set<string> {
  try {
    const stored = localStorage.getItem('sidebar-collapsed-groups');
    if (stored) return new Set<string>(JSON.parse(stored) as string[]);
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
  const [participacoes, setParticipacoes] = useState<ParticipacaoWorkspaceResponse[]>([]);
  const [headerActionsSlot, setHeaderActionsSlot] = useState<HTMLElement | null>(null);
  const [loadingEspacos, setLoadingEspacos] = useState(false);
  const activeWorkspaceId = currentUser?.workspace?.id ?? currentUser?.familia?.id;
  const participacoesOptions = Array.isArray(participacoes) ? participacoes : [];

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
      candidates.find(({ prefix }) => currentPath === prefix || currentPath.startsWith(`${prefix}/`))?.key ?? '/dashboard'
    );
  }, [location.pathname]);

  useEffect(() => {
    setPageTitle(breadcrumbTitles.at(-1) ?? 'Dashboard');
  }, [breadcrumbTitles, setPageTitle]);

  useEffect(() => {
    if (!currentUser || !activeWorkspaceId) {
      setParticipacoes([]);
      return;
    }

    let cancelled = false;
    setLoadingEspacos(true);
    void listarMinhasParticipacoes()
      .then((items) => {
        if (!cancelled) {
          setParticipacoes(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setParticipacoes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingEspacos(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, currentUser?.userId]);

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
      if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey);
      try { localStorage.setItem('sidebar-collapsed-groups', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }


  const handleLogout = async () => {
    const { clearSession } = useAuthStore.getState();
    try { await logoutSession(); } catch { /* logout local acontece de qualquer forma */ }
    clearSession();
    navigate('/login', { replace: true });
  };

  const handleSelecionarEspaco = async (familiaId: string) => {
    if (!familiaId || familiaId === activeWorkspaceId) {
      return;
    }

    try {
      setLoadingEspacos(true);
      const response = await selecionarWorkspace(familiaId);
      useAuthStore.getState().applyTokenResponse(response.sessao);
      notify('success', 'Espaco ativo atualizado');
      window.location.reload();
    } catch (err) {
      notify('error', 'Nao foi possivel trocar de espaco', getApiErrorMessage(err));
      setLoadingEspacos(false);
    }
  };

  const sidebarWidth = sidebarCollapsed ? 64 : 256;

  return (
    <div className="bg-surface font-body text-white min-h-screen" data-testid="admin-shell">
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-8 py-4 bg-surface/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-6 min-w-0">
          <Link to="/dashboard" className="text-2xl font-black tracking-tighter font-headline whitespace-nowrap" style={{ color: PRIMARY }}>
            Controle<span className="text-white">Financeiro</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 min-w-0 text-on-surface-variant text-sm font-medium">
            {breadcrumbTitles.map((title, index) => (
              <React.Fragment key={`${title}-${index}`}>
                {index > 0 && <span className="material-symbols-outlined text-base">chevron_right</span>}
                <span className={index === breadcrumbTitles.length - 1 ? 'text-white' : undefined}>{title}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QuickLaunchButton
            className="hidden sm:inline-flex shadow-[0_0_12px_rgba(43,245,142,0.12)]"
            icon={<span className="material-symbols-outlined block text-lg leading-none">add</span>}
          >
            Lancar
          </QuickLaunchButton>
          {currentUser && (
            <div className="hidden lg:flex flex-col items-end leading-tight min-w-[220px]">
              <span className="text-sm font-bold text-white">{currentUser.displayName}</span>
              <Select
                size="small"
                value={activeWorkspaceId}
                loading={loadingEspacos}
                onChange={(value) => void handleSelecionarEspaco(value)}
                style={{ width: '100%', marginTop: 6 }}
                popupMatchSelectWidth={false}
                options={participacoesOptions.map((item) => ({
                  value: item.id,
                  label: `${item.nome} - ${item.meuPapel}`
                }))}
              />
            </div>
          )}
          <Tooltip content="Espacos" side="bottom">
            <Link
              to="/familia"
              aria-label="Espacos"
              className="w-10 h-10 rounded-full border-2 border-primary/30 bg-surface-container flex items-center justify-center overflow-hidden hover:border-primary transition-all"
            >
              {currentUser?.avatarUrl ? (
                <img alt={currentUser.displayName} src={currentUser.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold" style={{ color: PRIMARY }}>
                  {(currentUser?.displayName ?? '?').charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          </Tooltip>
          <Tooltip content="Sair" side="bottom">
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Sair"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-highest cursor-pointer transition-all border-0"
            >
              <span className="material-symbols-outlined" style={{ color: ERROR, fontSize: '20px', lineHeight: 1 }}>
                logout
              </span>
            </button>
          </Tooltip>
        </div>
      </nav>

      <Tooltip content={sidebarCollapsed ? 'Expandir menu' : 'Retrair menu'} side="right">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Retrair menu'}
          className="hidden lg:flex fixed z-[45] items-center justify-center rounded-r-xl transition-all duration-200 border border-l-0"
          style={{
            left: sidebarWidth,
            top: '50vh',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '44px',
            backgroundColor: 'rgba(43, 245, 142, 0.06)',
            borderColor: 'rgba(43, 245, 142, 0.2)',
            color: PRIMARY,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(43, 245, 142, 0.14)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(43, 245, 142, 0.06)'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px', color: PRIMARY }}>
            {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </Tooltip>

      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-[72px] bottom-0 py-5 overflow-y-auto transition-all duration-200 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
        style={{ backgroundColor: 'var(--color-surface-container)' }}
      >
        <nav className="flex-1">
          {navigationStructure.map((group) => {
            const isGroupCollapsed = collapsedGroups.has(group.key);

            return (
              <div key={group.key} className={sidebarCollapsed ? 'mb-4' : 'mb-5'}>
                {sidebarCollapsed ? (
                  <div className="mx-2 mb-2 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-4 mb-1 py-0.5 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <h3 className="font-bold font-headline text-xs uppercase tracking-wider" style={{ color: PRIMARY }}>
                      {group.label}
                    </h3>
                    <span
                      className="material-symbols-outlined transition-transform duration-200"
                      style={{
                        fontSize: '16px',
                        color: PRIMARY,
                        transform: isGroupCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                      }}
                    >
                      chevron_right
                    </span>
                  </button>
                )}

                {(sidebarCollapsed || !isGroupCollapsed) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = item.key === selectedKey;
                      const icon = navIcons[item.key] ?? 'circle';

                      return (
                        <Tooltip key={item.key} content={item.label} side="right" disabled={!sidebarCollapsed}>
                          <Link
                            to={item.key}
                            className={`flex items-center transition-all ${
                              sidebarCollapsed
                                ? `justify-center py-2.5 mx-1.5 rounded-xl ${isActive ? 'bg-primary/12 shadow-[inset_0_0_10px_rgba(43,245,142,0.18)]' : 'hover:bg-primary/10'}`
                                : `gap-3 py-2.5 pl-4 pr-6 font-body text-sm font-medium tracking-wide ${isActive ? 'bg-primary/12 shadow-[inset_0_0_10px_rgba(43,245,142,0.18)] border-r-4 border-primary/80' : 'hover:bg-primary/10'}`
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-xl shrink-0"
                              style={{ color: PRIMARY }}
                            >
                              {icon}
                            </span>
                            {!sidebarCollapsed && (
                              <span className="truncate" style={{ color: PRIMARY }}>
                                {item.label}
                              </span>
                            )}
                          </Link>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main
        className="pt-24 pb-28 lg:pb-12 px-4 md:px-8 min-h-screen transition-all duration-200 max-lg:!ml-0"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <header className="mb-6">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-medium">
            Inteligencia financeira
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
            <h1 className="text-2xl md:text-3xl font-black font-headline text-white !mb-0">{pageTitle}</h1>
            <div
              ref={(el) => { if (el !== null) setHeaderActionsSlot(el); }}
              className="flex items-center gap-3"
            />
          </div>
        </header>
        <PageHeaderActionsSlotContext.Provider value={headerActionsSlot}>
          {children ?? <Outlet />}
        </PageHeaderActionsSlotContext.Provider>
      </main>

      {!/\/(contas-pagar|contas-receber|faturas)\/[^/]/.test(location.pathname) && (
        <QuickLaunchButton className="lg:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-primary text-on-primary border-0 shadow-[0_10px_30px_rgba(43,245,142,0.35)] flex items-center justify-center cursor-pointer active:scale-95 transition-all" />
      )}

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-5 pt-2 lg:hidden bg-[#0e0e0e]/80 backdrop-blur-xl rounded-t-3xl border-t border-outline-variant/15 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {[
          { to: '/dashboard', icon: 'grid_view', label: 'Home' },
          { to: '/contas-pagar', icon: 'south_west', label: 'Pagar' },
          { to: '/contas-receber', icon: 'north_east', label: 'Receber' },
          { to: '/faturas', icon: 'credit_card', label: 'Cartoes' },
          { to: '/familia', icon: 'menu', label: 'Espaços' }
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center p-2 font-body text-[10px] font-bold uppercase transition-all ${
              item.to === selectedKey ? 'rounded-xl scale-110' : 'text-on-surface-variant'
            }`}
            style={item.to === selectedKey ? { color: PRIMARY } : undefined}
          >
            <span
              className="material-symbols-outlined"
              style={item.to === selectedKey ? { fontVariationSettings: "'FILL' 1", color: PRIMARY } : undefined}
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











