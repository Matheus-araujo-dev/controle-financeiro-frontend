import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NeonLedgerLayout } from './NeonLedgerLayout';
import { useAuthStore } from '../store/auth-store';

// ── Mock react-router-dom ───────────────────────────────────────────────────
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/dashboard', search: '', hash: '', state: null, key: 'default' };

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
  Outlet: () => <div data-testid="outlet" />,
  useLocation: vi.fn(() => mockLocation),
  useMatches: vi.fn(() => [{ handle: { title: 'Dashboard' }, id: 'root', data: null, params: {}, pathname: '/dashboard' }]),
  useNavigate: vi.fn(() => mockNavigate)
}));

// ── Mock app-shell-store ────────────────────────────────────────────────────
const mockSetPageTitle = vi.fn();
vi.mock('../store/app-shell-store', () => ({
  useAppShellStore: vi.fn(() => ({
    pageTitle: 'Dashboard',
    setPageTitle: mockSetPageTitle
  }))
}));

// ── Mock auth API ───────────────────────────────────────────────────────────
const mockLogoutSession = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/http/auth-api', () => ({
  logoutSession: (...args: unknown[]) => mockLogoutSession(...args)
}));

// ── Mock familia API ────────────────────────────────────────────────────────
const mockListarParticipacoes = vi.fn().mockResolvedValue([
  { id: 'ws-1', nome: 'Família Araújo', meuPapel: 'Dono' }
]);
const mockSelecionarWorkspace = vi.fn().mockResolvedValue({
  sessao: {
    accessToken: 'new-token',
    usuario: {
      id: 'u-1',
      nome: 'Matheus',
      email: 'matheus@example.com',
      avatarUrl: null,
      workspace: { id: 'ws-2' },
      familia: { id: 'ws-2' }
    }
  }
});

vi.mock('../features/familia/familia-api', () => ({
  listarMinhasParticipacoes: (...args: unknown[]) => mockListarParticipacoes(...args),
  selecionarWorkspace: (...args: unknown[]) => mockSelecionarWorkspace(...args)
}));

// ── Stub other dependencies ─────────────────────────────────────────────────
vi.mock('../store/notification-store', () => ({
  notify: vi.fn()
}));

vi.mock('../services/http/api-error', () => ({
  getApiErrorMessage: vi.fn((e: unknown) => String(e))
}));

vi.mock('../components/quick-launch/QuickLaunchButton', () => ({
  QuickLaunchButton: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <button type="button" data-testid="quick-launch" className={className}>{children ?? 'Lançar'}</button>
  )
}));

vi.mock('../components/ui/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../components/layout/PageHeaderActionsSlot', () => ({
  PageHeaderActionsSlotContext: React.createContext<HTMLElement | null>(null)
}));

// ── Test helpers ────────────────────────────────────────────────────────────

function renderLayout(children?: React.ReactNode) {
  return render(<NeonLedgerLayout>{children}</NeonLedgerLayout>);
}

function setUser(overrides: Record<string, unknown> = {}) {
  useAuthStore.setState({
    currentUser: {
      userId: 'u-1',
      displayName: 'Matheus Araújo',
      email: 'matheus@example.com',
      avatarUrl: null as null,
      workspace: { id: 'ws-1' },
      familia: { id: 'ws-1' }
    } as never,
    ...overrides
  });
}

function clearUser() {
  useAuthStore.setState({ currentUser: null });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('NeonLedgerLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    clearUser();
    mockListarParticipacoes.mockResolvedValue([]);
  });

  it('renders the main shell container', () => {
    renderLayout();
    expect(screen.getByTestId('admin-shell')).toBeInTheDocument();
  });

  it('renders branding that contains ControleFinanceiro', () => {
    renderLayout();
    expect(screen.getAllByText(/Controle/)[0]).toBeInTheDocument();
  });

  it('renders skip-to-content accessibility link', () => {
    renderLayout();
    expect(screen.getByText('Pular para o conteúdo principal')).toBeInTheDocument();
  });

  it('renders page title from appShellStore', () => {
    renderLayout();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders children in main content area when provided', () => {
    renderLayout(<p>Conteúdo aqui</p>);
    expect(screen.getByText('Conteúdo aqui')).toBeInTheDocument();
  });

  it('renders Outlet when no children provided', () => {
    renderLayout();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders user display name when currentUser is set', async () => {
    setUser();
    renderLayout();
    await waitFor(() => {
      expect(screen.getByText('Matheus Araújo')).toBeInTheDocument();
    });
  });

  it('renders initial avatar letter when avatarUrl is null', async () => {
    setUser();
    renderLayout();
    await waitFor(() => {
      const letters = screen.getAllByText('M');
      expect(letters.length).toBeGreaterThan(0);
    });
  });

  it('renders avatar image when avatarUrl is provided', async () => {
    useAuthStore.setState({
      currentUser: {
        userId: 'u-2',
        displayName: 'Joao',
        email: 'joao@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        workspace: { id: 'ws-1' },
        familia: { id: 'ws-1' }
      } as never
    });
    renderLayout();
    await waitFor(() => {
      const avatarImgs = screen.getAllByRole('img');
      expect(avatarImgs.some((img) => img.getAttribute('src')?.includes('avatar.jpg'))).toBe(true);
    });
  });

  it('renders logout button for authenticated users', () => {
    setUser();
    renderLayout();
    expect(screen.getByLabelText('Sair')).toBeInTheDocument();
  });

  it('opens mobile drawer when hamburger button is clicked', async () => {
    setUser();
    renderLayout();
    const menuBtn = screen.getByLabelText('Abrir menu');
    await userEvent.click(menuBtn);
    // Drawer content should be visible (uses createPortal into document.body)
    await waitFor(() => {
      expect(document.body.querySelector('.fixed.inset-0')).not.toBeNull();
    });
  });

  it('toggles sidebar to collapsed when toggle button is clicked', async () => {
    renderLayout();
    // Initially expanded
    const expandBtn = screen.getByLabelText('Retrair menu');
    await userEvent.click(expandBtn);
    await waitFor(() => {
      expect(screen.getByLabelText('Expandir menu')).toBeInTheDocument();
    });
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('toggles sidebar back to expanded when clicked again', async () => {
    renderLayout();
    const retractBtn = screen.getByLabelText('Retrair menu');
    await userEvent.click(retractBtn);
    await waitFor(() => { expect(screen.getByLabelText('Expandir menu')).toBeInTheDocument(); });
    const expandBtn = screen.getByLabelText('Expandir menu');
    await userEvent.click(expandBtn);
    await waitFor(() => {
      expect(screen.getByLabelText('Retrair menu')).toBeInTheDocument();
    });
    expect(localStorage.getItem('sidebar-collapsed')).toBe('false');
  });

  it('reads sidebar collapsed state from localStorage on mount', () => {
    localStorage.setItem('sidebar-collapsed', 'true');
    renderLayout();
    expect(screen.getByLabelText('Expandir menu')).toBeInTheDocument();
  });

  it('renders navigation groups from navigationStructure', () => {
    renderLayout();
    // At least one nav section heading should be rendered
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders bottom mobile navigation bar with Home link', () => {
    renderLayout();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders without user (unauthenticated state)', () => {
    clearUser();
    renderLayout();
    expect(screen.getByTestId('admin-shell')).toBeInTheDocument();
    expect(screen.queryByText('Matheus Araújo')).not.toBeInTheDocument();
  });

  it('calls logoutSession and clears session on logout click', async () => {
    setUser();
    renderLayout();
    const logoutBtn = screen.getByLabelText('Sair');
    await userEvent.click(logoutBtn);
    await waitFor(() => {
      expect(mockLogoutSession).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(useAuthStore.getState().currentUser).toBeNull();
    });
  });

  it('clears session even when logoutSession API throws', async () => {
    setUser();
    mockLogoutSession.mockRejectedValueOnce(new Error('Network error'));
    renderLayout();
    const logoutBtn = screen.getByLabelText('Sair');
    await userEvent.click(logoutBtn);
    await waitFor(() => {
      expect(useAuthStore.getState().currentUser).toBeNull();
    });
  });

  it('loads workspace participacoes when user and workspace are set', async () => {
    mockListarParticipacoes.mockResolvedValue([
      { id: 'ws-1', nome: 'Família Araújo', meuPapel: 'Dono' }
    ]);
    setUser();
    renderLayout();
    await waitFor(() => {
      expect(mockListarParticipacoes).toHaveBeenCalled();
    });
  });

  it('handles participacoes load failure gracefully', async () => {
    mockListarParticipacoes.mockRejectedValueOnce(new Error('API error'));
    setUser();
    renderLayout();
    await waitFor(() => {
      expect(mockListarParticipacoes).toHaveBeenCalled();
    });
    // Should still render the layout even on error
    expect(screen.getByTestId('admin-shell')).toBeInTheDocument();
  });

  it('does not load participacoes when currentUser is null', async () => {
    clearUser();
    renderLayout();
    await waitFor(() => {
      // With no user, participacoes should not be fetched
      expect(mockListarParticipacoes).not.toHaveBeenCalled();
    });
  });

  it('toggles a navigation group collapsed state', async () => {
    renderLayout();
    // The h3 headings are rendered inside group-toggle buttons
    const geralHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(geralHeadings.length).toBeGreaterThan(0);
    // Click the button that wraps the first h3 heading
    const firstGroupBtn = geralHeadings[0].closest('button');
    if (firstGroupBtn) {
      await userEvent.click(firstGroupBtn);
      await waitFor(() => {
        const stored = localStorage.getItem('sidebar-collapsed-groups');
        expect(stored).not.toBeNull();
      });
    }
  });
});
