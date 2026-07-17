import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MovimentacoesWorkspacePage } from './MovimentacoesWorkspacePage';

// Mock child pages to avoid their API dependencies
vi.mock('./FinancialAccountListPage', () => ({
  FinancialAccountListPage: ({ config }: { config: { key: string } }) => (
    <div data-testid={`financial-list-${config.key}`}>FinancialAccountListPage ({config.key})</div>
  )
}));

vi.mock('./MovimentacoesPage', () => ({
  MovimentacoesPage: () => <div data-testid="movimentacoes-page">MovimentacoesPage</div>
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

function renderWorkspace(initialTab: 'pagar' | 'receber' | 'extrato') {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={createQC()}>
        <MovimentacoesWorkspacePage initialTab={initialTab} />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('MovimentacoesWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FinancialAccountListPage with contas-pagar config when initialTab=pagar', () => {
    renderWorkspace('pagar');
    expect(screen.getByTestId('financial-list-contas-pagar')).toBeInTheDocument();
    expect(screen.queryByTestId('movimentacoes-page')).not.toBeInTheDocument();
  });

  it('renders FinancialAccountListPage with contas-receber config when initialTab=receber', () => {
    renderWorkspace('receber');
    expect(screen.getByTestId('financial-list-contas-receber')).toBeInTheDocument();
    expect(screen.queryByTestId('movimentacoes-page')).not.toBeInTheDocument();
  });

  it('renders MovimentacoesPage when initialTab=extrato', () => {
    renderWorkspace('extrato');
    expect(screen.getByTestId('movimentacoes-page')).toBeInTheDocument();
    expect(screen.queryByTestId('financial-list-contas-pagar')).not.toBeInTheDocument();
  });

  it('marks the active tab with aria-current=page', () => {
    renderWorkspace('receber');
    const activeBtn = screen.getByRole('button', { name: /A receber/i });
    expect(activeBtn).toHaveAttribute('aria-current', 'page');
    const inactiveBtn = screen.getByRole('button', { name: /A pagar/i });
    expect(inactiveBtn).not.toHaveAttribute('aria-current');
  });

  it('navigates to /contas-pagar when A pagar tab is clicked', async () => {
    renderWorkspace('extrato');
    await userEvent.click(screen.getByRole('button', { name: /A pagar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/contas-pagar');
  });

  it('navigates to /contas-receber when A receber tab is clicked', async () => {
    renderWorkspace('pagar');
    await userEvent.click(screen.getByRole('button', { name: /A receber/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/contas-receber');
  });

  it('navigates to /movimentacoes when Extrato tab is clicked', async () => {
    renderWorkspace('pagar');
    await userEvent.click(screen.getByRole('button', { name: /Extrato/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/movimentacoes');
  });

  it('renders all three tab buttons', () => {
    renderWorkspace('pagar');
    expect(screen.getByRole('button', { name: /A pagar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /A receber/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extrato/i })).toBeInTheDocument();
  });
});
