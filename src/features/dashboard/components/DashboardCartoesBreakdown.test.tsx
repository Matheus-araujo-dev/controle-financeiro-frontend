import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardCartoesBreakdown } from './DashboardCartoesBreakdown';

const financeiroApiMock = vi.hoisted(() => ({
  faturas: {
    listar: vi.fn()
  }
}));

const cadastrosApiMock = vi.hoisted(() => ({
  cartoes: {
    listar: vi.fn()
  }
}));

vi.mock('../../../services/http/financeiro-api', () => ({
  financeiroApi: financeiroApiMock
}));

vi.mock('../../../services/http/cadastros-api', () => ({
  cadastrosApi: cadastrosApiMock
}));

function makeFatura(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f-1',
    cartaoId: 'c-1',
    cartaoNome: 'Nubank',
    competencia: '2026-07',
    valorTotal: 1500,
    status: 'Aberta',
    dataVencimento: '2026-07-15',
    ...overrides
  };
}

function renderComponent() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardCartoesBreakdown />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardCartoesBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cadastrosApiMock.cartoes.listar.mockResolvedValue({ items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 1 });
  });

  it('shows loading state', () => {
    financeiroApiMock.faturas.listar.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('shows empty state when no faturas', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 1 });
    renderComponent();
    expect(await screen.findByText('Nenhuma fatura no mês.')).toBeInTheDocument();
  });

  it('shows faturas grouped by cartao', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [makeFatura({ cartaoId: 'c-1', cartaoNome: 'Nubank', valorTotal: 1500 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    expect(await screen.findByText('Nubank')).toBeInTheDocument();
  });

  it('groups multiple faturas of same cartao', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [
        makeFatura({ id: 'f-1', cartaoId: 'c-1', cartaoNome: 'Nubank', valorTotal: 1000 }),
        makeFatura({ id: 'f-2', cartaoId: 'c-1', cartaoNome: 'Nubank', valorTotal: 500 })
      ],
      page: 1, pageSize: 50, totalItems: 2, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Nubank');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
  });

  it('shows total faturas amount', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [
        makeFatura({ cartaoId: 'c-1', cartaoNome: 'Nubank', valorTotal: 1000 }),
        makeFatura({ id: 'f-2', cartaoId: 'c-2', cartaoNome: 'Itaú', valorTotal: 500 })
      ],
      page: 1, pageSize: 50, totalItems: 2, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Total em cartões');
    expect(screen.getByText('Total em cartões')).toBeInTheDocument();
  });

  it('uses cartao metadata for icon and color when available', async () => {
    cadastrosApiMock.cartoes.listar.mockResolvedValue({
      items: [{ id: 'c-1', nome: 'Nubank', icone: 'savings', cor: '#ff6600', numeroFinal: '1234', ativo: true }],
      page: 1, pageSize: 100, totalItems: 1, totalPages: 1
    });
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [makeFatura({ cartaoId: 'c-1', cartaoNome: 'Nubank', valorTotal: 1000 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    const { container } = renderComponent();
    await screen.findByText('Nubank');
    const iconEl = container.querySelector('[style*="color: rgb(255, 102, 0)"]');
    expect(iconEl).toBeInTheDocument();
  });

  it('uses fallback color when cartao not in metadata', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [makeFatura({ cartaoId: 'unknown', cartaoNome: 'Unknown Card', valorTotal: 500 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    const { container } = renderComponent();
    await screen.findByText('Unknown Card');
    // Fallback color is #2bf58e; browser may convert to rgba
    const iconContainer = container.querySelector('[style*="background-color"]') as HTMLElement;
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer.style.backgroundColor).toMatch(/43.*245.*142|2bf58e/i);
  });

  it('shows "Ver todas" link to /faturas', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 1 });
    renderComponent();
    await screen.findByText('Nenhuma fatura no mês.');
    expect(screen.getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/faturas');
  });

  it('sorts grouped faturas descending by valor', async () => {
    financeiroApiMock.faturas.listar.mockResolvedValue({
      items: [
        makeFatura({ cartaoId: 'c-1', cartaoNome: 'Baixo', valorTotal: 200 }),
        makeFatura({ id: 'f-2', cartaoId: 'c-2', cartaoNome: 'Alto', valorTotal: 2000 })
      ],
      page: 1, pageSize: 50, totalItems: 2, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Alto');
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Alto');
  });
});
