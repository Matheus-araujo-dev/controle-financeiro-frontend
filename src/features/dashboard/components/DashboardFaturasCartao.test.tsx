import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardFaturasCartao } from './DashboardFaturasCartao';
import type { FaturaResumo } from '../../../types/financeiro';

const financeiroApiMock = vi.hoisted(() => ({
  faturas: {
    listar: vi.fn()
  }
}));

vi.mock('../../../services/http/financeiro-api', () => ({
  financeiroApi: financeiroApiMock
}));

function makeFatura(overrides: Partial<FaturaResumo> = {}): FaturaResumo {
  return {
    id: 'f-1',
    cartaoId: 'c-1',
    cartaoNome: 'Nubank',
    competencia: '2026-07',
    dataFechamento: '2026-07-25',
    dataVencimento: '2026-07-28',
    valorTotal: 1500,
    dataPagamento: null,
    statusCodigo: 'ABERTA',
    statusNome: 'Aberta',
    quantidadeItens: 5,
    ...overrides
  };
}

function renderComponent() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardFaturasCartao />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardFaturasCartao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    financeiroApiMock.faturas.listar.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Carregando faturas...')).toBeInTheDocument();
  });

  it('shows empty state when no faturas', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 1 });
    renderComponent();
    expect(await screen.findByText(/Nenhuma fatura em aberto/)).toBeInTheDocument();
  });

  it('shows fatura cards when data available', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [makeFatura({ cartaoNome: 'Nubank Gold' })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    expect(await screen.findByText('Nubank Gold')).toBeInTheDocument();
  });

  it('shows at most 4 faturas (slices to visiveis)', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: Array.from({ length: 6 }, (_, i) => makeFatura({ id: `f-${i}`, cartaoNome: `Cartao ${i}`, dataVencimento: `2026-07-${10 + i}` })),
      page: 1, pageSize: 50, totalItems: 6, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Cartao 0');
    expect(screen.getByText('Cartao 3')).toBeInTheDocument();
    expect(screen.queryByText('Cartao 4')).not.toBeInTheDocument();
    expect(screen.getByText(/\+2 fatura\(s\)/)).toBeInTheDocument();
  });

  it('does not show "+" text when exactly 4 faturas', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: Array.from({ length: 4 }, (_, i) => makeFatura({ id: `f-${i}`, cartaoNome: `Cartao ${i}`, dataVencimento: `2026-07-${10 + i}` })),
      page: 1, pageSize: 50, totalItems: 4, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Cartao 0');
    expect(screen.queryByText(/fatura\(s\) prevista\(s\)/)).not.toBeInTheDocument();
  });

  it('sorts faturas by dataVencimento ascending', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [
        makeFatura({ id: 'f-2', cartaoNome: 'Segundo', dataVencimento: '2026-07-20' }),
        makeFatura({ id: 'f-1', cartaoNome: 'Primeiro', dataVencimento: '2026-07-10' })
      ],
      page: 1, pageSize: 50, totalItems: 2, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Primeiro');
    const links = screen.getAllByRole('link').filter(l => l.getAttribute('href')?.startsWith('/faturas/'));
    expect(links[0]).toHaveTextContent('Primeiro');
    expect(links[1]).toHaveTextContent('Segundo');
  });

  it('renders "Ver todas" link', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 1 });
    renderComponent();
    await screen.findByText(/Nenhuma fatura/);
    expect(screen.getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/faturas');
  });

  it('shows fatura link to detail page', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [makeFatura({ id: 'fatura-abc' })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Nubank');
    expect(screen.getByRole('link', { name: /Nubank/ })).toHaveAttribute('href', '/faturas/fatura-abc');
  });

  it('shows quantity of items per fatura', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [makeFatura({ quantidadeItens: 7 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    await screen.findByText(/7 item\(ns\)/);
  });
});
