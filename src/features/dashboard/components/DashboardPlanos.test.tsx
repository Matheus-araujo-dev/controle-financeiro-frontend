import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPlanos } from './DashboardPlanos';
import type { PlanoResumo } from '../../../types/planos';

const planosApiMock = vi.hoisted(() => ({
  listar: vi.fn()
}));

vi.mock('../../../services/http/planos-api', () => ({
  planosApi: planosApiMock
}));

function makePlano(overrides: Partial<PlanoResumo> = {}): PlanoResumo {
  return {
    id: 'p-1',
    nome: 'Reserva de Emergência',
    descricao: null,
    valorMensal: 500,
    numParcelas: 12,
    contaBancariaCaixaId: 'cb-1',
    contaBancariaNome: 'Conta Principal',
    parcelasPagas: 3,
    totalRetirado: 0,
    valorTotal: 6000,
    totalAcumulado: 1500,
    concluido: false,
    cancelado: false,
    formaPagamentoId: null,
    recebedorId: null,
    contaGerencialId: null,
    createdAtUtc: '2026-01-01T00:00:00Z',
    ...overrides
  };
}

function renderComponent() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPlanos />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardPlanos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    planosApiMock.listar.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Carregando planos…')).toBeInTheDocument();
  });

  it('shows empty state when no active plans', async () => {
    planosApiMock.listar.mockResolvedValue({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 });
    renderComponent();
    expect(await screen.findByText('Nenhum plano ativo.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar plano →' })).toBeInTheDocument();
  });

  it('shows active plans list', async () => {
    planosApiMock.listar.mockResolvedValue({
      items: [makePlano({ nome: 'Viagem Europa' })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    expect(await screen.findByText('Viagem Europa')).toBeInTheDocument();
  });

  it('filters out concluded and cancelled plans from actives', async () => {
    planosApiMock.listar.mockResolvedValue({
      items: [
        makePlano({ id: 'p-1', nome: 'Ativo' }),
        makePlano({ id: 'p-2', nome: 'Concluído', concluido: true }),
        makePlano({ id: 'p-3', nome: 'Cancelado', cancelado: true })
      ],
      page: 1, pageSize: 50, totalItems: 3, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Ativo');
    expect(screen.queryByText('Concluído')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelado')).not.toBeInTheDocument();
  });

  it('counts concluded plans separately', async () => {
    planosApiMock.listar.mockResolvedValue({
      items: [
        makePlano({ id: 'p-1', nome: 'Ativo' }),
        makePlano({ id: 'p-2', concluido: true }),
        makePlano({ id: 'p-3', concluido: true })
      ],
      page: 1, pageSize: 50, totalItems: 3, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Ativo');
    const concluidos = screen.getAllByText('2');
    expect(concluidos.length).toBeGreaterThan(0);
  });

  it('shows total acumulado footer when plans exist', async () => {
    planosApiMock.listar.mockResolvedValue({
      items: [makePlano({ totalAcumulado: 2000 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    await screen.findByText('Total acumulado (ativos)');
  });

  it('shows progress percentage for each plan', async () => {
    planosApiMock.listar.mockResolvedValue({
      items: [makePlano({ parcelasPagas: 6, numParcelas: 12 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    await screen.findByText('50%');
  });

  it('shows 0% progress when numParcelas is 0', async () => {
    planosApiMock.listar.mockResolvedValue({
      items: [makePlano({ parcelasPagas: 0, numParcelas: 0 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    await screen.findByText('0%');
  });

  it('slices to 4 plans in the list when there are more', async () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      makePlano({ id: `p-${i}`, nome: `Plano ${i}` })
    );
    planosApiMock.listar.mockResolvedValue({ items, page: 1, pageSize: 50, totalItems: 6, totalPages: 1 });
    renderComponent();
    await screen.findByText('Plano 0');
    expect(screen.getByText('Plano 3')).toBeInTheDocument();
    expect(screen.queryByText('Plano 4')).not.toBeInTheDocument();
  });

  it('displays "Ver todos" link', async () => {
    planosApiMock.listar.mockResolvedValue({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 });
    renderComponent();
    await screen.findByText('Nenhum plano ativo.');
    expect(screen.getByRole('link', { name: /Ver todos/i })).toHaveAttribute('href', '/planos');
  });

  it('displays parcelas and valorMensal details', async () => {
    planosApiMock.listar.mockResolvedValue({
      items: [makePlano({ parcelasPagas: 3, numParcelas: 12, valorMensal: 500 })],
      page: 1, pageSize: 50, totalItems: 1, totalPages: 1
    });
    renderComponent();
    expect(await screen.findByText(/3\/12 parcelas/)).toBeInTheDocument();
  });
});
