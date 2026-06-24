import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { dashboardApi } from '../../../services/http/dashboard-api';
import { orcamentosApi } from '../../../services/http/orcamentos-api';
import { selectMonthInDateInput } from '../../../test/date-input';

vi.mock('../../../services/http/dashboard-api', () => ({
  dashboardApi: {
    obterResumo: vi.fn(),
    obterFluxoCaixa: vi.fn()
  }
}));

vi.mock('../../../services/http/orcamentos-api', () => ({
  orcamentosApi: {
    obterPorCompetencia: vi.fn()
  }
}));

const resumoMock = {
  saldoAtual: 1150,
  totalAPagar: 1500,
  totalAReceber: 200,
  saldoProjetado: -150,
  riscoSaldoNegativo: true,
  contasVencidas: [
    {
      id: 'cp1',
      tipoLancamento: 'ContaPagar',
      descricao: 'Fornecedor atrasado',
      pessoaNome: 'Fornecedor Fase 3',
      dataVencimento: '2026-04-03',
      valor: 800,
      statusCodigo: 'VENCIDA',
      statusNome: 'Vencida'
    }
  ],
  contasAVencer: [
    {
      id: 'cp2',
      tipoLancamento: 'ContaPagar',
      descricao: 'Imposto da semana',
      pessoaNome: 'Fornecedor Fase 3',
      dataVencimento: '2026-04-08',
      valor: 700,
      statusCodigo: 'PENDENTE',
      statusNome: 'Pendente'
    },
    {
      id: 'cr1',
      tipoLancamento: 'ContaReceber',
      descricao: 'Cliente da semana',
      pessoaNome: 'Cliente Fase 3',
      dataVencimento: '2026-04-09',
      valor: 200,
      statusCodigo: 'PENDENTE',
      statusNome: 'Pendente'
    }
  ],
  movimentacoesRecentes: [
    {
      id: 'm1',
      dataMovimentacao: '2026-04-04',
      tipo: 'Entrada',
      natureza: 'Realizada',
      valor: 250,
      observacao: 'Receita recebida',
      contaPagarId: null,
      contaReceberId: 'cr1',
      faturaCartaoId: null
    }
  ]
} as const;

const fluxoCaixaMock = {
  visao: 'Caixa',
  dataInicial: '2026-04-05',
  dias: 15,
  riscoSaldoNegativo: true,
  itens: [
    {
      data: '2026-04-05',
      saldoInicial: 1150,
      entradasPrevistas: 0,
      saidasPrevistas: 800,
      saldoFinalPrevisto: 350,
      riscoSaldoNegativo: false
    }
  ]
} as const;

const defaultReferenceMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });
}

function renderWithQueryClient(ui: Parameters<typeof render>[0]) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      {ui}
    </QueryClientProvider>
  );
}
function mockDashboardBase() {
  vi.mocked(dashboardApi.obterResumo).mockResolvedValue(resumoMock as never);
  vi.mocked(dashboardApi.obterFluxoCaixa).mockResolvedValue(fluxoCaixaMock as never);
}

function renderPage() {
  return renderWithQueryClient(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orcamentosApi.obterPorCompetencia).mockResolvedValue({ itens: [] } as never);
  });

  it('loads the dashboard and renders real data', async () => {
    mockDashboardBase();

    renderPage();

    expect(await screen.findByText('Saldo Atual')).toBeInTheDocument();
    expect((await screen.findAllByText(/1\.150,00/)).length).toBeGreaterThan(0);
    expect(await screen.findByText('Imposto da semana')).toBeInTheDocument();
    expect(screen.getByText('Cliente da semana')).toBeInTheDocument();
    expect(await screen.findByText('Receita recebida')).toBeInTheDocument();

    await waitFor(() =>
      expect(dashboardApi.obterFluxoCaixa).toHaveBeenLastCalledWith({
        mesReferencia: defaultReferenceMonth
      })
    );
  }, 30000);

  it('renders the KPI cards with the summary values', async () => {
    mockDashboardBase();

    renderPage();

    expect(await screen.findByText('Saldo Atual')).toBeInTheDocument();
    expect(screen.getByText('A Pagar (Hoje)')).toBeInTheDocument();
    expect(screen.getByText('A Receber')).toBeInTheDocument();
    expect(screen.getByText('Projetado (Fim de Mês)')).toBeInTheDocument();
    expect(await screen.findByText('R$1.500,00')).toBeInTheDocument();
    expect(screen.getAllByText('R$200,00').length).toBeGreaterThan(0);
    // 1 vencida + 1 conta a pagar a vencer
    expect(screen.getByText('2 faturas pendentes')).toBeInTheDocument();
  });

  it('renders the error state when the summary request fails', async () => {
    vi.mocked(dashboardApi.obterResumo).mockRejectedValue(new Error('Falha controlada'));
    vi.mocked(dashboardApi.obterFluxoCaixa).mockResolvedValue(fluxoCaixaMock as never);

    renderPage();

    expect(await screen.findByText('Falha controlada')).toBeInTheDocument();
  });

  it('reloads the dashboard when the reference month changes', async () => {
    mockDashboardBase();

    renderPage();

    expect(await screen.findByText('Imposto da semana')).toBeInTheDocument();

    await selectMonthInDateInput('Mês de referência do dashboard', '2026-05');

    await waitFor(() =>
      expect(dashboardApi.obterResumo).toHaveBeenLastCalledWith({
        mesReferencia: '2026-05'
      })
    );

    await waitFor(() =>
      expect(dashboardApi.obterFluxoCaixa).toHaveBeenLastCalledWith({
        mesReferencia: '2026-05'
      })
    );
  });
});
