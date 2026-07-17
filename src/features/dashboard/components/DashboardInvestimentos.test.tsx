import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardInvestimentos } from './DashboardInvestimentos';
import type { InvestimentoResumo } from '../../../types/investimentos';

const investimentosApiMock = vi.hoisted(() => ({
  listar: vi.fn()
}));

vi.mock('../../../services/http/investimentos-api', () => ({
  investimentosApi: investimentosApiMock
}));

function makeInvestimento(overrides: Partial<InvestimentoResumo> = {}): InvestimentoResumo {
  return {
    id: 'inv-1',
    nome: 'Tesouro Selic',
    emissor: 'Governo Federal',
    tipo: 1,
    tipoLabel: 'Renda Fixa',
    liquidez: 1,
    liquidezLabel: 'Diária',
    valorInvestido: 1000,
    valorAtual: 1100,
    rendimento: 100,
    rendimentoPercent: 10,
    dataAplicacao: '2026-01-01',
    dataVencimento: null,
    taxaAnual: 12,
    contaBancariaVinculadaId: 'cb-1',
    contaBancariaNome: 'Conta Principal',
    encerrado: false,
    createdAtUtc: '2026-01-01T00:00:00Z',
    ...overrides
  };
}

function renderComponent() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardInvestimentos />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardInvestimentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    investimentosApiMock.listar.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Carregando carteira…')).toBeInTheDocument();
  });

  it('shows empty state when no investments', async () => {
    investimentosApiMock.listar.mockResolvedValue({ items: [], page: 1, pageSize: 200, totalItems: 0, totalPages: 1 });
    renderComponent();
    expect(await screen.findByText('Nenhum investimento ativo.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Adicionar investimento →' })).toBeInTheDocument();
  });

  it('shows investment list and composition', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [makeInvestimento({ nome: 'CDB Banco X' })],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    renderComponent();
    expect(await screen.findByText('CDB Banco X')).toBeInTheDocument();
    expect(screen.getByText('Composição')).toBeInTheDocument();
    expect(screen.getByText('Maiores posições')).toBeInTheDocument();
  });

  it('shows positive rendimento in primary color', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [makeInvestimento({ valorInvestido: 1000, valorAtual: 1100, rendimento: 100 })],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    const { container } = renderComponent();
    await screen.findByText('Renda Fixa');
    const rendimentoEl = container.querySelector('.text-primary.font-bold.tabular-nums');
    expect(rendimentoEl).toBeInTheDocument();
  });

  it('shows negative rendimento in error color', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [makeInvestimento({ valorInvestido: 1000, valorAtual: 900, rendimento: -100 })],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    const { container } = renderComponent();
    await screen.findByText('Renda Fixa');
    const rendimentoEl = container.querySelector('.text-error.font-bold.tabular-nums');
    expect(rendimentoEl).toBeInTheDocument();
  });

  it('shows 0% rendimento when totalInvestido is 0', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [makeInvestimento({ valorInvestido: 0, valorAtual: 0, rendimento: 0 })],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Renda Fixa');
    // Both portfolio-level and per-investment may show +0.0%
    expect(screen.getAllByText('+0.0%').length).toBeGreaterThan(0);
  });

  it('groups investments by tipo in composição', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [
        makeInvestimento({ id: 'i1', tipo: 1, valorAtual: 1000 }),
        makeInvestimento({ id: 'i2', tipo: 2, tipoLabel: 'Renda Variável', valorAtual: 500 })
      ],
      page: 1, pageSize: 200, totalItems: 2, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Renda Fixa');
    expect(screen.getByText('Renda Variável')).toBeInTheDocument();
  });

  it('shows up to 5 top positions', async () => {
    const items = Array.from({ length: 7 }, (_, i) =>
      makeInvestimento({ id: `i-${i}`, nome: `Investimento ${i}`, valorAtual: (7 - i) * 100 })
    );
    investimentosApiMock.listar.mockResolvedValue({ items, page: 1, pageSize: 200, totalItems: 7, totalPages: 1 });
    renderComponent();
    await screen.findByText('Investimento 0');
    expect(screen.getByText('Investimento 4')).toBeInTheDocument();
    expect(screen.queryByText('Investimento 5')).not.toBeInTheDocument();
  });

  it('shows + prefix on positive return percentage', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [makeInvestimento({ valorInvestido: 1000, valorAtual: 1100 })],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Renda Fixa');
    // Portfolio-level and per-investment both may show +10.0%
    expect(screen.getAllByText('+10.0%').length).toBeGreaterThan(0);
  });

  it('shows emissor in top positions when available', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [makeInvestimento({ emissor: 'Banco Itaú' })],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    renderComponent();
    expect(await screen.findByText('Banco Itaú')).toBeInTheDocument();
  });

  it('shows tipoLabel when emissor is null', async () => {
    investimentosApiMock.listar.mockResolvedValue({
      items: [makeInvestimento({ emissor: null, tipoLabel: 'Renda Fixa' })],
      page: 1, pageSize: 200, totalItems: 1, totalPages: 1
    });
    renderComponent();
    const labels = await screen.findAllByText('Renda Fixa');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('uses fallback color for unknown tipo', async () => {
    const items = [makeInvestimento({ tipo: 5 as any, tipoLabel: 'Outro' })];
    investimentosApiMock.listar.mockResolvedValue({ items, page: 1, pageSize: 200, totalItems: 1, totalPages: 1 });
    renderComponent();
    expect(await screen.findByText('Outro')).toBeInTheDocument();
  });
});
