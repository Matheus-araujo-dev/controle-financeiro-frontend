import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';
import { dashboardApi } from '../../../services/http/dashboard-api';

vi.mock('../../../services/http/dashboard-api', () => ({
  dashboardApi: {
    obterResumo: vi.fn(),
    obterFluxoCaixa: vi.fn()
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

const fluxoEconomicoMock = {
  visao: 'Economica',
  dataInicial: '2026-04-05',
  dias: 15,
  riscoSaldoNegativo: false,
  itens: [
    {
      data: '2026-04-06',
      saldoInicial: 700,
      entradasPrevistas: 0,
      saidasPrevistas: 0,
      saldoFinalPrevisto: 700,
      riscoSaldoNegativo: false
    }
  ]
} as const;

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the dashboard, renders real data and toggles the flow view', async () => {
    vi.mocked(dashboardApi.obterResumo).mockResolvedValue(resumoMock as never);
    vi.mocked(dashboardApi.obterFluxoCaixa)
      .mockResolvedValueOnce(fluxoCaixaMock as never)
      .mockResolvedValueOnce(fluxoEconomicoMock as never);

    render(<DashboardPage />);

    expect((await screen.findAllByText(/1\.150,00/)).length).toBeGreaterThan(0);
    expect(screen.getByText('Fornecedor atrasado')).toBeInTheDocument();
    expect(screen.getByText('Cliente da semana')).toBeInTheDocument();
    expect(screen.getByText('Receita recebida')).toBeInTheDocument();
    expect(screen.getByText('Risco de saldo negativo projetado')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Visao economica'));

    await waitFor(() =>
      expect(dashboardApi.obterFluxoCaixa).toHaveBeenLastCalledWith({
        dias: 15,
        visao: 'Economica'
      })
    );

    expect(await screen.findByText('06/04/2026')).toBeInTheDocument();
  }, 10000);

  it('renders the error state and allows retry', async () => {
    vi.mocked(dashboardApi.obterResumo)
      .mockRejectedValueOnce(new Error('Falha controlada'))
      .mockResolvedValueOnce(resumoMock as never);
    vi.mocked(dashboardApi.obterFluxoCaixa)
      .mockResolvedValueOnce(fluxoCaixaMock as never);

    render(<DashboardPage />);

    expect(await screen.findByText('Falha ao carregar dashboard')).toBeInTheDocument();
    expect(screen.getByText('Falha controlada')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => {
      expect(dashboardApi.obterResumo).toHaveBeenCalledTimes(2);
      expect(dashboardApi.obterFluxoCaixa).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => expect(screen.queryByTestId('page-state-error')).not.toBeInTheDocument());
    expect((await screen.findAllByText(/1\.150,00/)).length).toBeGreaterThan(0);
  });
});
