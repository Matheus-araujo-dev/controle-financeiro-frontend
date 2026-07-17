import {
  agingBucket,
  buildAlertas,
  buildExportDefinition,
  buildInadimplenciaRows,
  daysOverdue,
  emptyPaged,
  exportarPdf,
  getCurrentReferenceMonth,
  getMonthRange,
  getRecorrenciaTipoLabel
} from './relatorios-helpers';
import type { ReportKey, ReportState } from './relatorios-config';

const referenceMonth = '2026-06';

function reportData(): ReportState {
  return {
    resumo: {
      saldoAtual: 0,
      totalAPagar: 0,
      totalAReceber: 0,
      saldoProjetado: 0,
      riscoSaldoNegativo: false,
      contasVencidas: [
        {
          id: 'cv-1',
          descricao: 'Aluguel',
          pessoaNome: 'Imobiliaria',
          dataVencimento: '2026-06-10',
          statusNome: 'Vencida',
          valor: 1200
        }
      ],
      contasAVencer: [],
      movimentacoesRecentes: [
        {
          id: 'mov-1',
          dataMovimentacao: '2026-06-12',
          tipo: 'ContaPagar',
          natureza: 'Debito',
          observacao: null,
          valor: 50
        }
      ]
    } as never,
    responsaveis: {
      itens: [
        {
          responsavelNome: 'Maria',
          totalDespesas: 100,
          totalDespesasCartao: 30,
          totalReceitas: 200,
          saldoLiquido: 100,
          quantidadeLancamentos: 3
        }
      ]
    } as never,
    contasGerenciais: {
      itens: [
        {
          codigo: null,
          descricao: 'Alimentacao',
          tipo: 'Despesa',
          valorTotal: 80,
          quantidadeLancamentos: 2,
          ultimaDataLancamento: '2026-06-11'
        }
      ]
    } as never,
    fluxoCaixa: {
      itens: [
        {
          data: '2026-06-01',
          saldoInicial: 1000,
          entradasPrevistas: 200,
          saidasPrevistas: 150,
          saldoFinalPrevisto: 1050,
          riscoSaldoNegativo: true
        },
        {
          data: '2026-06-02',
          saldoInicial: 1050,
          entradasPrevistas: 0,
          saidasPrevistas: 10,
          saldoFinalPrevisto: 1040,
          riscoSaldoNegativo: false
        }
      ]
    } as never,
    previsoes: {
      itens: [
        {
          data: '2026-06-03',
          origem: 'Recorrencia',
          status: 'Previsto',
          tipoMovimentacao: 'Saida',
          quantidadeItens: 1,
          valorTotal: 99
        }
      ]
    } as never,
    contasPagarVencidas: {
      items: [
        {
          id: 'pagar-1',
          descricao: 'Boleto',
          recebedorNome: 'Fornecedor',
          dataVencimento: '2026-06-01',
          valorLiquido: 300,
          statusNome: 'Vencida'
        }
      ]
    } as never,
    contasReceberVencidas: {
      items: [
        {
          id: 'receber-1',
          descricao: 'Cliente',
          pagadorNome: 'Cliente A',
          dataVencimento: '2026-06-15',
          valorLiquido: 500,
          statusNome: 'Vencida'
        }
      ]
    } as never,
    faturas: {
      items: [
        {
          cartaoNome: 'Visa',
          competencia: '2026-06',
          dataFechamento: '2026-06-20',
          dataVencimento: '2026-06-28',
          statusNome: 'Aberta',
          quantidadeItens: 4,
          valorTotal: 700
        }
      ]
    } as never,
    recorrencias: {
      items: [
        {
          contaOrigemTipo: 'ContaPagar',
          descricao: 'Internet',
          pessoaNome: 'Operadora',
          responsavelNome: null,
          valorLiquido: 120,
          dataInicio: '2026-01-01',
          dataFim: null,
          diaOrdemMensal: 10,
          ativa: false
        }
      ]
    } as never,
    compras: {
      items: [
        {
          titulo: 'Notebook',
          responsavelNome: 'Joao',
          contaGerencialDescricao: 'Equipamentos',
          prioridade: 'Alta',
          status: 'Planejada',
          dataDesejada: null,
          parcelavel: true,
          quantidadeParcelasDesejada: null,
          valorEstimado: 3500,
          link: null
        }
      ]
    } as never
  };
}

describe('relatorios helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('builds date helpers, empty pages and overdue buckets', () => {
    expect(getCurrentReferenceMonth()).toBe('2026-06');
    expect(getMonthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(emptyPaged({ total: 1 })).toEqual({
      items: [],
      page: 1,
      pageSize: 250,
      totalItems: 0,
      totalPages: 0,
      summary: { total: 1 }
    });
    expect(daysOverdue('2026-06-10')).toBe(11);
    expect(daysOverdue('2026-06-30')).toBe(0);
    expect([agingBucket(7), agingBucket(15), agingBucket(30), agingBucket(31)]).toEqual([
      'Até 7 dias',
      '8 a 15 dias',
      '16 a 30 dias',
      'Acima de 30 dias'
    ]);
    expect(getRecorrenciaTipoLabel('ContaPagar')).toBe('A pagar');
    expect(getRecorrenciaTipoLabel('ContaReceber')).toBe('A receber');
  });

  it('sorts inadimplencia rows by overdue days and due date', () => {
    const rows = buildInadimplenciaRows(reportData());

    expect(rows.map((row) => row.id)).toEqual(['pagar-1', 'receber-1']);
    expect(rows[0]).toEqual(expect.objectContaining({ tipo: 'A pagar', dias: 20 }));
    expect(rows[1]).toEqual(expect.objectContaining({ tipo: 'A receber', dias: 6 }));
  });

  it.each<ReportKey>([
    'responsaveis',
    'contas-gerenciais',
    'fluxo-caixa',
    'previsoes',
    'inadimplencia',
    'faturas',
    'recorrencias',
    'compras',
    'geral'
  ])('builds export definition for %s', (reportKey) => {
    const definition = buildExportDefinition(reportKey, referenceMonth, reportData());

    expect(definition.filename).toContain(referenceMonth);
    expect(definition.sheets.length).toBeGreaterThan(0);
    expect(definition.sheets[0].filters).toEqual([['Mês de referência', referenceMonth]]);
    expect(definition.sheets[0].rows.length).toBeGreaterThan(0);
  });

  it('uses empty arrays when report data is not loaded yet', () => {
    expect(buildExportDefinition('responsaveis', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('contas-gerenciais', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('fluxo-caixa', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('previsoes', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('inadimplencia', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('faturas', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('recorrencias', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('compras', referenceMonth, {}).sheets[0].rows).toEqual([]);
    expect(buildExportDefinition('geral', referenceMonth, {}).sheets.flatMap((sheet) => sheet.rows)).toEqual([]);
  });

  it('delegates pdf export to browser print', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});

    exportarPdf();

    expect(print).toHaveBeenCalledTimes(1);
  });

  it.each<ReportKey>(['comparativo', 'dre', 'alertas'])(
    'builds export definition for %s',
    (reportKey) => {
      const definition = buildExportDefinition(reportKey, referenceMonth, {
        ...reportData(),
        comparativo: {
          itens: [
            { competenciaLabel: 'Mai/2026', receitas: 4000, despesas: 3000, saldo: 1000, variacaoReceitas: null, variacaoDespesas: null },
            { competenciaLabel: 'Jun/2026', receitas: 5000, despesas: 3200, saldo: 1800, variacaoReceitas: 25, variacaoDespesas: 6.7 }
          ]
        } as never
      });
      expect(definition.filename).toContain(referenceMonth);
      expect(definition.sheets.length).toBeGreaterThan(0);
    }
  );
});

describe('buildAlertas', () => {
  it('pushes danger alert when overdue accounts exist', () => {
    const state: ReportState = {
      resumo: {
        contasVencidas: [{ descricao: 'Aluguel', pessoaNome: 'João', dataVencimento: '2026-06-01', statusNome: 'Vencida', valor: 1000 }],
        saldoAtual: 500,
        movimentacoesRecentes: []
      } as never
    };
    const alertas = buildAlertas(state);
    expect(alertas.some((a) => a.id === 'contas-vencidas' && a.severity === 'danger')).toBe(true);
  });

  it('pushes info alert when no overdue accounts', () => {
    const alertas = buildAlertas({
      resumo: { contasVencidas: [], saldoAtual: 0, movimentacoesRecentes: [] } as never
    });
    expect(alertas.some((a) => a.id === 'sem-contas-vencidas' && a.severity === 'info')).toBe(true);
  });

  it('pushes danger alert for negative saldo', () => {
    const alertas = buildAlertas({
      resumo: { contasVencidas: [], saldoAtual: -100, movimentacoesRecentes: [] } as never
    });
    expect(alertas.some((a) => a.id === 'saldo-negativo')).toBe(true);
  });

  it('pushes warning alert for fluxo risco', () => {
    const alertas = buildAlertas({
      fluxoCaixa: {
        itens: [{ data: '2026-07-01', saldoInicial: 0, entradasPrevistas: 0, saidasPrevistas: 100, saldoFinalPrevisto: -100, riscoSaldoNegativo: true }]
      } as never
    });
    expect(alertas.some((a) => a.id === 'fluxo-risco')).toBe(true);
  });

  it('pushes warning when despesas rise more than 20%', () => {
    const alertas = buildAlertas({
      comparativo: {
        itens: [
          { competenciaLabel: 'Mai/2026', receitas: 5000, despesas: 3000, saldo: 2000, variacaoReceitas: 0, variacaoDespesas: 0 },
          { competenciaLabel: 'Jun/2026', receitas: 5000, despesas: 3700, saldo: 1300, variacaoReceitas: 0, variacaoDespesas: 25 }
        ]
      } as never
    });
    expect(alertas.some((a) => a.id === 'despesa-alta')).toBe(true);
  });

  it('does not push despesa alert when variation is exactly 20%', () => {
    const alertas = buildAlertas({
      comparativo: {
        itens: [
          { competenciaLabel: 'Mai', receitas: 5000, despesas: 3000, saldo: 2000, variacaoReceitas: 0, variacaoDespesas: 0 },
          { competenciaLabel: 'Jun', receitas: 5000, despesas: 3600, saldo: 1400, variacaoReceitas: 0, variacaoDespesas: 20 }
        ]
      } as never
    });
    expect(alertas.some((a) => a.id === 'despesa-alta')).toBe(false);
  });

  it('pushes warning when receitas fall more than 20%', () => {
    const alertas = buildAlertas({
      comparativo: {
        itens: [
          { competenciaLabel: 'Mai', receitas: 5000, despesas: 3000, saldo: 2000, variacaoReceitas: 0, variacaoDespesas: 0 },
          { competenciaLabel: 'Jun', receitas: 3500, despesas: 3000, saldo: 500, variacaoReceitas: -30, variacaoDespesas: 0 }
        ]
      } as never
    });
    expect(alertas.some((a) => a.id === 'receita-queda')).toBe(true);
  });

  it('pushes info for active recorrencias', () => {
    const alertas = buildAlertas({
      recorrencias: {
        items: [{ ativa: true, valorLiquido: 200, descricao: 'Netflix', pessoaNome: '', responsavelNome: null, contaOrigemTipo: 'ContaPagar', dataInicio: '', dataFim: null, diaOrdemMensal: 1, id: 'r1' }],
        page: 1, pageSize: 250, totalItems: 1, totalPages: 1
      } as never
    });
    expect(alertas.some((a) => a.id === 'recorrencias-ativas')).toBe(true);
  });

  it('does not push recorrencia alert when total is 0', () => {
    const alertas = buildAlertas({
      recorrencias: {
        items: [{ ativa: false, valorLiquido: 200, descricao: 'Pausada', pessoaNome: '', responsavelNome: null, contaOrigemTipo: 'ContaPagar', dataInicio: '', dataFim: null, diaOrdemMensal: 1, id: 'r2' }],
        page: 1, pageSize: 250, totalItems: 1, totalPages: 1
      } as never
    });
    expect(alertas.some((a) => a.id === 'recorrencias-ativas')).toBe(false);
  });

  it('sorts by severity: danger before warning before info', () => {
    const alertas = buildAlertas({
      resumo: { contasVencidas: [], saldoAtual: -100, movimentacoesRecentes: [] } as never,
      fluxoCaixa: {
        itens: [{ data: '2026-07-01', saldoInicial: 0, entradasPrevistas: 0, saidasPrevistas: 100, saldoFinalPrevisto: -100, riscoSaldoNegativo: true }]
      } as never
    });
    const severities = alertas.map((a) => a.severity);
    const dangerIdx = severities.indexOf('danger');
    const warningIdx = severities.indexOf('warning');
    const infoIdx = severities.indexOf('info');
    if (dangerIdx >= 0 && warningIdx >= 0) expect(dangerIdx).toBeLessThan(warningIdx);
    if (warningIdx >= 0 && infoIdx >= 0) expect(warningIdx).toBeLessThan(infoIdx);
  });

  it('returns only the sem-contas-vencidas info when state is empty', () => {
    const alertas = buildAlertas({});
    expect(alertas).toHaveLength(1);
    expect(alertas[0].id).toBe('sem-contas-vencidas');
  });
});
