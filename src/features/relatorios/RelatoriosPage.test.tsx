import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelatoriosPage } from './RelatoriosPage';

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RelatoriosPage />
    </QueryClientProvider>
  );
}
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

// ── Extra rich data fixtures for additional branch coverage ───────────────
const richFluxoCaixa = {
  visao: 'Caixa',
  dataInicial: '2026-06-01',
  dias: 2,
  riscoSaldoNegativo: true,
  itens: [
    {
      data: '2026-06-01',
      saldoInicial: 100,
      entradasPrevistas: 0,
      saidasPrevistas: 500,
      saldoFinalPrevisto: -400,
      riscoSaldoNegativo: true
    },
    {
      data: '2026-06-02',
      saldoInicial: -400,
      entradasPrevistas: 200,
      saidasPrevistas: 0,
      saldoFinalPrevisto: -200,
      riscoSaldoNegativo: false
    }
  ]
} as const;

const richContasGerenciais = {
  dataInicial: '2026-06-01',
  dias: 30,
  totalReceitas: 3000,
  totalDespesas: 4000,
  saldo: -1000,
  itens: [
    {
      contaGerencialId: 'cg-r1',
      codigo: 'REC.01',
      descricao: 'Salário',
      tipo: 'Receita' as const,
      valorTotal: 3000,
      quantidadeLancamentos: 1,
      ultimaDataLancamento: '2026-06-05'
    },
    {
      contaGerencialId: 'cg-d1',
      codigo: null as null,
      descricao: 'Moradia',
      tipo: 'Despesa' as const,
      valorTotal: 4000,
      quantidadeLancamentos: 3,
      ultimaDataLancamento: '2026-06-15'
    }
  ]
} as const;

const richComparativo = {
  itens: [
    {
      competencia: '2026-05',
      competenciaLabel: 'Mai/26',
      receitas: 1000,
      despesas: 800,
      saldo: 200,
      variacaoReceitas: null as null,
      variacaoDespesas: null as null
    },
    {
      competencia: '2026-06',
      competenciaLabel: 'Jun/26',
      receitas: 1400,
      despesas: 600,
      saldo: -50,
      variacaoReceitas: 40.0,
      variacaoDespesas: -25.0
    }
  ]
} as const;

const previsaoEntrada = {
  dataInicial: '2026-06-01',
  dias: 30,
  origem: null,
  status: null,
  itens: [
    {
      data: '2026-06-10',
      tipoMovimentacao: 'Entrada' as const,
      origem: 'ContaPagar' as const,
      status: 'Previsto' as const,
      quantidadeItens: 2,
      valorTotal: 800
    },
    {
      data: '2026-06-20',
      tipoMovimentacao: 'Saida' as const,
      origem: 'Recorrencia' as const,
      status: 'Previsto' as const,
      quantidadeItens: 1,
      valorTotal: 300
    }
  ]
} as const;

const recorrenciasRich = {
  ...{ page: 1, pageSize: 250, totalItems: 2, totalPages: 1 },
  summary: {},
  items: [
    {
      id: 'rec-active',
      tipoPeriodicidade: 'Mensal',
      tipoDia: 'DiaFixo',
      diaOrdemMensal: 10,
      dataInicio: '2026-01-01',
      dataFim: '2026-12-31',
      ativa: true,
      permiteEdicaoOcorrenciaIndividual: true,
      observacao: null,
      contaOrigemTipo: 'ContaReceber' as const,
      contaOrigemId: 'cr-1',
      descricao: 'Aluguel recebido',
      valorLiquido: 200,
      pessoaNome: 'Inquilino',
      responsavelNome: null as null
    },
    {
      id: 'rec-paused',
      tipoPeriodicidade: 'Mensal',
      tipoDia: 'DiaFixo',
      diaOrdemMensal: 5,
      dataInicio: '2026-02-01',
      dataFim: null as null,
      ativa: false,
      permiteEdicaoOcorrenciaIndividual: false,
      observacao: null,
      contaOrigemTipo: 'ContaPagar' as const,
      contaOrigemId: 'cp-2',
      descricao: 'Assinatura pausada',
      valorLiquido: 50,
      pessoaNome: 'Serviço',
      responsavelNome: 'Gerente'
    }
  ]
};

const comprasRich = {
  page: 1,
  pageSize: 250,
  totalItems: 3,
  totalPages: 1,
  summary: { totalRegistros: 3, valorTotalEstimado: 10000 },
  items: [
    {
      id: 'c-1',
      titulo: 'Notebook novo',
      valorEstimado: 8000,
      dataDesejada: null as null,
      prioridade: 'Media' as const,
      status: 'Planejada' as const,
      parcelavel: false,
      quantidadeParcelasDesejada: null as null,
      contaGerencialId: 'cg-1',
      contaGerencialDescricao: 'Equipamentos',
      responsavelId: 'p-1',
      responsavelNome: 'Joao',
      link: 'https://example.com/notebook',
      contaPagarGeradaId: null as null,
      convertidaEmContaPagarEmUtc: null as null
    },
    {
      id: 'c-2',
      titulo: 'Mesa',
      valorEstimado: 2000,
      dataDesejada: '2026-07-15',
      prioridade: 'Alta' as const,
      status: 'Planejada' as const,
      parcelavel: true,
      quantidadeParcelasDesejada: 3,
      contaGerencialId: 'cg-1',
      contaGerencialDescricao: 'Movel',
      responsavelId: 'p-1',
      responsavelNome: 'Maria',
      link: null as null,
      contaPagarGeradaId: null as null,
      convertidaEmContaPagarEmUtc: null as null
    }
  ]
};

describe('RelatoriosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReports();
  });

  it('loads all report sources and renders the overview', async () => {
    renderPage();

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
    renderPage();

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
    renderPage();

    await screen.findByText('Conta vencida');
    await userEvent.click(screen.getByRole('button', { name: /faturas/i }));
    await userEvent.click(screen.getByLabelText('Status da fatura'));
    await userEvent.click(await screen.findByRole('button', { name: 'Abertas' }));

    await waitFor(() => {
      expect(financeiroApi.faturas.listar).toHaveBeenLastCalledWith(expect.objectContaining({ statusCodigo: 'ABERTA' }));
    });
  });

  it('shows loading page state while initial fetch is in flight', async () => {
    vi.mocked(dashboardApi.obterResumo).mockReturnValue(new Promise(() => {}) as never);
    renderPage();
    expect(await screen.findByText('Carregando relatórios')).toBeInTheDocument();
  });

  it('shows error message when API rejects with an Error instance', async () => {
    vi.mocked(dashboardApi.obterResumo).mockRejectedValue(new Error('Rede indisponível'));
    renderPage();
    expect(await screen.findByText('Rede indisponível')).toBeInTheDocument();
  });

  it('shows fallback error message when rejection is not an Error instance', async () => {
    vi.mocked(dashboardApi.obterResumo).mockRejectedValue('bad');
    renderPage();
    expect(await screen.findByText(/Falha ao carregar relatórios/i)).toBeInTheDocument();
  });

  it('renders saldo projetado as danger and shows hint when riscoSaldoNegativo is true', async () => {
    vi.mocked(dashboardApi.obterResumo).mockResolvedValue({
      ...resumo,
      riscoSaldoNegativo: true,
      saldoProjetado: -500
    } as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Há risco de saldo negativo.')).toBeInTheDocument();
    });
  });

  it('renders contas-vencidas with zero items (empty state for overview table)', async () => {
    vi.mocked(dashboardApi.obterResumo).mockResolvedValue({
      ...resumo,
      contasVencidas: []
    } as never);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Nenhuma conta vencida no período')).toBeInTheDocument();
    });
  });

  it('renders fluxo-caixa tab with risk rows covering riscoSaldoNegativo branches', async () => {
    vi.mocked(dashboardApi.obterFluxoCaixa).mockResolvedValue(richFluxoCaixa as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /fluxo de caixa/i }));
    expect(await screen.findByText('Saldo negativo')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    // Negative final balance triggers 'danger' tone
    expect(screen.getByText('Dias com risco')).toBeInTheDocument();
  });

  it('renders previsoes tab with Entrada type covering tipoMovimentacao branch', async () => {
    vi.mocked(dashboardApi.obterResumoCentralPrevisao).mockResolvedValue(previsaoEntrada as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /previsões/i }));
    // Both tipoMovimentacao values (Entrada and Saida) are rendered
    expect(await screen.findByText('Entrada')).toBeInTheDocument();
    expect(screen.getByText('Saida')).toBeInTheDocument();
  });

  it('renders recorrencias tab covering responsavelNome null, ativa false, and dataFim branches', async () => {
    vi.mocked(financeiroApi.recorrencias.listar).mockResolvedValue(recorrenciasRich as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /recorrências/i }));
    // null responsavelNome → shows '-'
    const dashes = await screen.findAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
    // ativa=false → shows 'Pausada'
    expect(await screen.findByText('Pausada')).toBeInTheDocument();
    // ativa=true → shows 'Ativa'
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    // ContaReceber type → 'A receber' (may appear in multiple places)
    expect((await screen.findAllByText('A receber')).length).toBeGreaterThan(0);
    // dataFim non-null → formatted date shown
    expect(screen.getByText(/31\/12\/2026/)).toBeInTheDocument();
  });

  it('renders compras tab covering prioridade Media, no dataDesejada, parcelavel false, link branches', async () => {
    vi.mocked(comprasPlanejadasApi.listar).mockResolvedValue(comprasRich as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /compras planejadas/i }));
    // prioridade 'Media' → renders 'Média'
    expect(await screen.findByText('Média')).toBeInTheDocument();
    // dataDesejada=null → renders '-'
    const dashes = await screen.findAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
    // parcelavel=false → renders 'Única'
    expect(screen.getByText('Única')).toBeInTheDocument();
    // parcelavel=true with 3 parcelas → '3x'
    expect(screen.getByText('3x')).toBeInTheDocument();
    // link non-null → link value shown
    expect(screen.getByText('https://example.com/notebook')).toBeInTheDocument();
  });

  it('renders responsaveis tab empty state when no responsaveis returned', async () => {
    vi.mocked(dashboardApi.obterResumoPorResponsaveis).mockResolvedValue({
      ...responsaveis,
      itens: []
    } as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /responsáveis/i }));
    expect(await screen.findByText(/Nenhum lançamento no período/i)).toBeInTheDocument();
  });

  it('renders contas-gerenciais tab empty state when no itens returned', async () => {
    vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue({
      ...contasGerenciais,
      itens: []
    } as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /contas gerenciais/i }));
    expect(await screen.findByText(/Nenhuma conta gerencial com movimento/i)).toBeInTheDocument();
  });

  it('renders contas-gerenciais tab with items covering codigo and tipo branches', async () => {
    vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue(richContasGerenciais as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /contas gerenciais/i }));
    // item with codigo → 'REC.01 - Salário'
    expect(await screen.findByText(/REC\.01 - Salário/)).toBeInTheDocument();
    // item without codigo → just 'Moradia'
    expect(screen.getByText('Moradia')).toBeInTheDocument();
  });

  it('renders comparativo tab covering null and non-null variation branches', async () => {
    vi.mocked(dashboardApi.obterComparativoMensal).mockResolvedValue(richComparativo as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /comparativo mensal/i }));
    // null variation → shows '—'
    const dashes = await screen.findAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
    // positive variation → shows '+40.0%'
    expect(await screen.findByText('+40.0%')).toBeInTheDocument();
    // negative despesas variation → shows '-25.0%'
    expect(screen.getByText('-25.0%')).toBeInTheDocument();
    // negative saldo → table row renders it in error color (text still visible)
    expect(screen.getByText('Jun/26')).toBeInTheDocument();
  });

  it('renders DRE tab with Receita and Despesa items covering tipo and codigo branches', async () => {
    vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue(richContasGerenciais as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /dre/i }));
    // DRE shows 'Salário' under Receitas (with codigo → 'REC.01 · Salário')
    expect(await screen.findByText('REC.01 · Salário')).toBeInTheDocument();
    // Despesa item without codigo → just 'Moradia'
    expect(screen.getByText('Moradia')).toBeInTheDocument();
    // Resultado section header
    expect(screen.getByText('Resultado do Período')).toBeInTheDocument();
    // Multiple 'Receitas' elements may appear (metric card + DRE section)
    expect(screen.getAllByText('Receitas').length).toBeGreaterThan(0);
  });

  it('renders DRE tab empty states when no receita or despesa items', async () => {
    vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue({
      ...contasGerenciais,
      itens: []
    } as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /dre/i }));
    expect(await screen.findByText('Nenhuma receita no período.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma despesa no período.')).toBeInTheDocument();
  });

  it('renders alertas tab with alerts list when data has overdue accounts', async () => {
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /alertas/i }));
    // resumo has contasVencidas → danger alert
    expect(await screen.findByText(/conta\(s\) vencida\(s\)/i)).toBeInTheDocument();
  });

  it('renders alertas tab showing info alert when no overdue accounts', async () => {
    vi.mocked(dashboardApi.obterResumo).mockResolvedValue({
      ...resumo,
      contasVencidas: [],
      saldoAtual: 100,
      movimentacoesRecentes: []
    } as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /alertas/i }));
    // sem-contas-vencidas info alert
    expect(await screen.findByText(/Nenhuma conta vencida/i)).toBeInTheDocument();
  });

  it('renders analises tab with despesa breakdown bars', async () => {
    vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue(richContasGerenciais as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /análises/i }));
    // Should show despesa item
    expect(await screen.findByText('Moradia')).toBeInTheDocument();
    // Percentage shown
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('renders analises tab empty state when no Despesa items', async () => {
    vi.mocked(dashboardApi.obterResumoContasGerenciais).mockResolvedValue({
      ...richContasGerenciais,
      itens: richContasGerenciais.itens.filter((i) => i.tipo === 'Receita')
    } as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /análises/i }));
    expect(await screen.findByText(/Sem despesas no período/i)).toBeInTheDocument();
  });

  it('renders balanço mensal tab with chart and table data', async () => {
    vi.mocked(dashboardApi.obterComparativoMensal).mockResolvedValue(richComparativo as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /balanço mensal/i }));
    // Table rows rendered
    expect(await screen.findByText('Mai/26')).toBeInTheDocument();
    expect(screen.getByText('Jun/26')).toBeInTheDocument();
    // Variation columns
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders balanço mensal tab empty state when no comparativo data', async () => {
    vi.mocked(dashboardApi.obterComparativoMensal).mockResolvedValue({ itens: [] } as never);
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /balanço mensal/i }));
    expect(await screen.findByText(/Sem dados comparativos/i)).toBeInTheDocument();
  });

  it('handles Excel export button click', async () => {
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    // Should not throw; button exists and is clickable
    const excelBtn = screen.getByRole('button', { name: /excel/i });
    await userEvent.click(excelBtn);
  });

  it('handles PDF export button click via window.print', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderPage();
    await screen.findByText(/Leitura gerencial/);
    await userEvent.click(screen.getByRole('button', { name: /pdf/i }));
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
