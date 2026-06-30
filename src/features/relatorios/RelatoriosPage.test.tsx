import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelatoriosPage } from './RelatoriosPage';
import { comprasPlanejadasApi } from '../../services/http/compras-planejadas-api';
import { dashboardApi } from '../../services/http/dashboard-api';
import { financeiroApi } from '../../services/http/financeiro-api';

vi.mock('../../services/http/dashboard-api', () => ({
  dashboardApi: {
    obterResumo: vi.fn(),
    obterResumoPorResponsaveis: vi.fn(),
    obterResumoContasGerenciais: vi.fn(),
    obterFluxoCaixa: vi.fn(),
    obterResumoCentralPrevisao: vi.fn(),
    obterComparativoMensal: vi.fn()
  }
}));

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { listar: vi.fn() },
    contasReceber: { listar: vi.fn() },
    faturas: { listar: vi.fn() },
    recorrencias: { listar: vi.fn() }
  }
}));

vi.mock('../../services/http/compras-planejadas-api', () => ({
  comprasPlanejadasApi: {
    listar: vi.fn()
  }
}));

const resumo = {
  saldoAtual: 1000,
  totalAPagar: 500,
  totalAReceber: 1200,
  saldoProjetado: 1700,
  riscoSaldoNegativo: false,
  contasVencidas: [
    {
      id: 'cp-1',
      tipoLancamento: 'ContaPagar',
      descricao: 'Conta vencida',
      pessoaNome: 'Fornecedor',
      dataVencimento: '2026-06-10',
      valor: 250,
      statusCodigo: 'VENCIDA',
      statusNome: 'Vencida'
    }
  ],
  contasAVencer: [],
  movimentacoesRecentes: []
} as const;

const responsaveis = {
  dataInicial: '2026-06-01',
  dias: 30,
  totalDespesas: 500,
  totalReceitas: 1200,
  itens: [
    {
      responsavelId: 'p-1',
      responsavelNome: 'Matheus',
      totalDespesas: 500,
      totalDespesasCartao: 150,
      totalReceitas: 1200,
      saldoLiquido: 700,
      quantidadeLancamentos: 3
    }
  ]
} as const;

const contasGerenciais = {
  dataInicial: '2026-06-01',
  dias: 30,
  totalReceitas: 1200,
  totalDespesas: 500,
  saldo: 700,
  itens: [
    {
      contaGerencialId: 'cg-1',
      codigo: 'DES.01',
      descricao: 'Moradia',
      tipo: 'Despesa',
      valorTotal: 500,
      quantidadeLancamentos: 2,
      ultimaDataLancamento: '2026-06-15'
    }
  ]
} as const;

const fluxoCaixa = {
  visao: 'Caixa',
  dataInicial: '2026-06-01',
  dias: 30,
  riscoSaldoNegativo: false,
  itens: [
    {
      data: '2026-06-01',
      saldoInicial: 1000,
      entradasPrevistas: 1200,
      saidasPrevistas: 500,
      saldoFinalPrevisto: 1700,
      riscoSaldoNegativo: false
    }
  ]
} as const;

const previsoes = {
  dataInicial: '2026-06-01',
  dias: 30,
  origem: null,
  status: null,
  itens: [
    {
      data: '2026-06-20',
      tipoMovimentacao: 'Saida',
      origem: 'Recorrencia',
      status: 'Previsto',
      quantidadeItens: 1,
      valorTotal: 300
    }
  ]
} as const;

const pagedBase = {
  page: 1,
  pageSize: 250,
  totalItems: 1,
  totalPages: 1
};

function mockReports() {
  vi.mocked(dashboardApi.obterResumo).mockResolvedValue(resumo as never);
  vi.mocked(dashboardApi.obterResumoPorResponsaveis).mockResolvedValue(responsaveis as never);
  vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue(contasGerenciais as never);
  vi.mocked(dashboardApi.obterFluxoCaixa).mockResolvedValue(fluxoCaixa as never);
  vi.mocked(dashboardApi.obterResumoCentralPrevisao).mockResolvedValue(previsoes as never);
  vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue({
    ...pagedBase,
    summary: { totalRegistros: 1, valorTotal: 250, totalPendente: 0, totalVencido: 250, totalVencendoHoje: 0, totalLiquidado: 0 },
    items: [
      {
        id: 'pagar-1',
        numeroDocumento: '1',
        descricao: 'Aluguel vencido',
        recebedorId: 'for-1',
        recebedorNome: 'Imobiliária',
        dataEmissao: '2026-06-01',
        dataVencimento: '2026-06-10',
        dataLiquidacao: null,
        formaPagamentoId: 'fp-1',
        formaPagamentoNome: 'Boleto',
        valorLiquido: 250,
        statusCodigo: 'VENCIDA',
        statusNome: 'Vencida',
        quantidadeParcelas: 1,
        numeroParcela: 1,
        grupoParcelamentoId: null,
        ehRecorrente: false
      }
    ]
  } as never);
  vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue({ ...pagedBase, summary: {}, items: [] } as never);
  vi.mocked(financeiroApi.faturas.listar).mockResolvedValue({
    ...pagedBase,
    summary: { totalRegistros: 1, valorTotal: 900, porCartao: [], porCompetencia: [] },
    items: [
      {
        id: 'fat-1',
        cartaoId: 'card-1',
        cartaoNome: 'Nubank',
        competencia: '2026-06',
        dataFechamento: '2026-06-15',
        dataVencimento: '2026-06-20',
        valorTotal: 900,
        dataPagamento: null,
        statusCodigo: 'ABERTA',
        statusNome: 'Aberta',
        quantidadeItens: 8
      }
    ]
  } as never);
  vi.mocked(financeiroApi.recorrencias.listar).mockResolvedValue({
    ...pagedBase,
    summary: {},
    items: [
      {
        id: 'rec-1',
        tipoPeriodicidade: 'Mensal',
        tipoDia: 'DiaFixo',
        diaOrdemMensal: 10,
        dataInicio: '2026-06-01',
        dataFim: null,
        ativa: true,
        permiteEdicaoOcorrenciaIndividual: true,
        observacao: null,
        contaOrigemTipo: 'ContaPagar',
        contaOrigemId: 'cp-1',
        descricao: 'Internet recorrente',
        valorLiquido: 150,
        pessoaNome: 'Sempre Internet',
        responsavelNome: 'Matheus'
      }
    ]
  } as never);
  vi.mocked(dashboardApi.obterComparativoMensal).mockResolvedValue({
    itens: [
      {
        competencia: '2026-06',
        competenciaLabel: 'Jun/26',
        receitas: 1200,
        despesas: 500,
        saldo: 700,
        variacaoReceitas: null,
        variacaoDespesas: null
      }
    ]
  } as never);
  vi.mocked(comprasPlanejadasApi.listar).mockResolvedValue({
    ...pagedBase,
    summary: { totalRegistros: 1, valorTotalEstimado: 17000 },
    items: [
      {
        id: 'compra-1',
        titulo: 'Aparelho auditivo vó',
        valorEstimado: 17000,
        dataDesejada: '2026-07-01',
        prioridade: 'Alta',
        status: 'Planejada',
        parcelavel: true,
        quantidadeParcelasDesejada: 10,
        contaGerencialId: 'cg-1',
        contaGerencialDescricao: 'Saúde de alto valor',
        responsavelId: 'p-1',
        responsavelNome: 'Vilani',
        link: null,
        contaPagarGeradaId: null,
        convertidaEmContaPagarEmUtc: null
      }
    ]
  } as never);
}

describe('RelatoriosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReports();
  });

  it('loads all report sources and renders the overview', async () => {
    render(<RelatoriosPage />);

    expect(await screen.findByText(/Leitura gerencial do período/i)).toBeInTheDocument();
    expect(await screen.findByText('Conta vencida')).toBeInTheDocument();

    await waitFor(() => {
      expect(dashboardApi.obterResumo).toHaveBeenCalledWith(expect.objectContaining({ mesReferencia: expect.any(String) }));
      expect(dashboardApi.obterResumoPorResponsaveis).toHaveBeenCalled();
      expect(dashboardApi.obterResumoContasGerenciais).toHaveBeenCalled();
      expect(dashboardApi.obterFluxoCaixa).toHaveBeenCalled();
      expect(dashboardApi.obterResumoCentralPrevisao).toHaveBeenCalled();
      expect(financeiroApi.contasPagar.listar).toHaveBeenCalledWith(expect.objectContaining({ statusCodigo: ['VENCIDA'] }));
      expect(financeiroApi.faturas.listar).toHaveBeenCalled();
      expect(financeiroApi.recorrencias.listar).toHaveBeenCalled();
      expect(comprasPlanejadasApi.listar).toHaveBeenCalled();
    });
  });

  it('allows switching between the available report tabs', async () => {
    render(<RelatoriosPage />);

    await screen.findByText('Conta vencida');

    await userEvent.click(screen.getByRole('button', { name: /responsáveis/i }));
    expect(await screen.findByText('Matheus')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /contas gerenciais/i }));
    expect(await screen.findByText(/DES.01 - Moradia/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /fluxo de caixa/i }));
    expect(await screen.findByText('Dias projetados')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /previsões/i }));
    expect(await screen.findByText('Recorrência')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /inadimplência/i }));
    expect(await screen.findByText('Aluguel vencido')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /faturas/i }));
    expect(await screen.findByText('Nubank')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /recorrências/i }));
    expect(await screen.findByText('Internet recorrente')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /compras planejadas/i }));
    expect(await screen.findByText('Aparelho auditivo vó')).toBeInTheDocument();
  });

  it('applies report-specific filters to backend calls', async () => {
    render(<RelatoriosPage />);

    await screen.findByText('Conta vencida');
    await userEvent.click(screen.getByRole('button', { name: /faturas/i }));
    await userEvent.click(screen.getByLabelText('Status da fatura'));
    await userEvent.click(await screen.findByRole('button', { name: 'Abertas' }));

    await waitFor(() => {
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(expect.objectContaining({ statusCodigo: 'ABERTA' }));
    });
  });
});
