import { useMonthClosingChecklist } from './useMonthClosingChecklist';
import { renderHook } from '@testing-library/react';
import type { DashboardResumo } from '../../types/dashboard';
import type { DashboardContaGerencialResumo } from '../../types/dashboard';
import type { OrcamentoCompetencia } from '../../types/orcamento';

function makeResumo(overrides: Partial<DashboardResumo> = {}): DashboardResumo {
  return {
    saldoAtual: 5000,
    totalAPagar: 1000,
    totalAReceber: 2000,
    saldoProjetado: 6000,
    contasVencidas: [],
    contasAVencer: [],
    movimentacoesRecentes: [],
    ...overrides,
  } as DashboardResumo;
}

function makeCG(overrides: Partial<DashboardContaGerencialResumo> = {}): DashboardContaGerencialResumo {
  return {
    totalReceitas: 5000,
    totalDespesas: 3000,
    saldo: 2000,
    itens: [],
    ...overrides,
  } as DashboardContaGerencialResumo;
}

function makeOrcamento(overrides: Partial<OrcamentoCompetencia> = {}): OrcamentoCompetencia {
  return {
    competencia: '2026-09',
    totalMeta: 5000,
    totalRealizado: 3000,
    percentualConsumido: 60,
    possuiEstouro: false,
    itens: [],
    ...overrides,
  } as OrcamentoCompetencia;
}

describe('useMonthClosingChecklist', () => {
  it('returns loading items when isLoading is true', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({ isLoading: true, mesReferencia: '2026-09' })
    );
    expect(result.current.items.every(i => i.status === 'loading')).toBe(true);
    expect(result.current.score).toBe(0);
  });

  it('returns all OK when no issues', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({
        resumo: makeResumo(),
        contasGerenciais: makeCG(),
        orcamento: makeOrcamento({ itens: [{ contaGerencialId: 'cg1', contaGerencialDescricao: 'Alimentacao', valorMeta: 1000, valorRealizado: 500, estourado: false } as never] }),
        isLoading: false,
        mesReferencia: '2026-09',
      })
    );
    expect(result.current.score).toBe(100);
    expect(result.current.items.every(i => i.status === 'ok')).toBe(true);
  });

  it('marks vencidas as error when there are overdue items', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({
        resumo: makeResumo({
          contasVencidas: [
            { id: 'v1', tipoLancamento: 'ContaPagar', descricao: 'Aluguel', valor: 1500, dataVencimento: '2026-09-01', statusCodigo: 'VENCIDA', statusNome: 'Vencida', pessoaNome: '' },
          ],
        }),
        contasGerenciais: makeCG(),
        orcamento: makeOrcamento(),
        isLoading: false,
        mesReferencia: '2026-09',
      })
    );
    const vencidas = result.current.items.find(i => i.id === 'vencidas');
    expect(vencidas?.status).toBe('error');
    expect(vencidas?.actionRoute).toBe('/contas-pagar?status=VENCIDA');
  });

  it('marks orcamento as warning when categories are over budget', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({
        resumo: makeResumo(),
        contasGerenciais: makeCG(),
        orcamento: makeOrcamento({
          itens: [
            { contaGerencialId: 'cg1', contaGerencialDescricao: 'Transporte', valorMeta: 500, valorRealizado: 800, estourado: true } as never,
          ],
        }),
        isLoading: false,
        mesReferencia: '2026-09',
      })
    );
    const orc = result.current.items.find(i => i.id === 'orcamento');
    expect(orc?.status).toBe('warning');
    expect(orc?.detail).toContain('Transporte');
  });

  it('marks orcamento as warning when no metas defined', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({
        resumo: makeResumo(),
        contasGerenciais: makeCG(),
        orcamento: makeOrcamento({ itens: [] }),
        isLoading: false,
        mesReferencia: '2026-09',
      })
    );
    const orc = result.current.items.find(i => i.id === 'orcamento');
    expect(orc?.status).toBe('warning');
  });

  it('marks receitas-despesas as warning when deficit', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({
        resumo: makeResumo(),
        contasGerenciais: makeCG({ saldo: -500, totalReceitas: 2000, totalDespesas: 2500 }),
        orcamento: makeOrcamento(),
        isLoading: false,
        mesReferencia: '2026-09',
      })
    );
    const rd = result.current.items.find(i => i.id === 'receitas-despesas');
    expect(rd?.status).toBe('warning');
    expect(rd?.description).toContain('ficit');
  });

  it('computes correct score with mixed statuses', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({
        resumo: makeResumo({
          contasVencidas: [
            { id: 'v1', tipoLancamento: 'ContaPagar', descricao: 'X', valor: 100, dataVencimento: '2026-09-01', statusCodigo: 'VENCIDA', statusNome: 'Vencida', pessoaNome: '' },
          ],
        }),
        contasGerenciais: makeCG(),
        orcamento: makeOrcamento({ itens: [{ contaGerencialId: 'cg1', contaGerencialDescricao: 'A', valorMeta: 1000, valorRealizado: 500, estourado: false } as never] }),
        isLoading: false,
        mesReferencia: '2026-09',
      })
    );
    expect(result.current.score).toBe(80);
  });

  it('returns 5 checklist items', () => {
    const { result } = renderHook(() =>
      useMonthClosingChecklist({
        resumo: makeResumo(),
        contasGerenciais: makeCG(),
        orcamento: makeOrcamento(),
        isLoading: false,
        mesReferencia: '2026-09',
      })
    );
    expect(result.current.items).toHaveLength(5);
  });
});
