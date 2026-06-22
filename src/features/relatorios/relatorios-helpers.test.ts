import {
  agingBucket,
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
});
