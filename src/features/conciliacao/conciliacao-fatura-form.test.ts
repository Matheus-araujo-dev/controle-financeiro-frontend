import { criarRascunho, montarCriacao, aplicarCampoEmLote, montarReembolso, ratearValor } from './conciliacao-fatura-form';
import type { ItemFaturaConciliacao } from '../../types/conciliacao-fatura';

const item: ItemFaturaConciliacao = { id: 'i', data: '2026-09-01', descricaoOriginal: 'ASAAS*NEXTFITago 26', valor: 33.33,
  numeroParcela: 1, quantidadeParcelas: 1, status: 'Pendente', contaPagarVinculadaId: null, valorAnteriorSistema: null, candidatos: [],
  preferencias: { descricao: 'Sistema do pilates', responsavelCompraId: 'p1', recebedorId: 'p2',
    rateios: [{ contaGerencialId: 'a', proporcao: 0.5 }, { contaGerencialId: 'b', proporcao: 0.5 }], ehRecorrente: false, gerarReembolso: false, reembolsoPagadoresIds: [] } };

describe('rascunho da conciliação', () => {
  it('aplica memória sem perder o título original e fecha os centavos dos rateios', () => {
    const draft = criarRascunho(item, '2026-09-20', 'cartao');
    expect(draft.descricao).toBe('Sistema do pilates');
    expect(draft.rateios.map(r => r.valor)).toEqual([16.67, 16.66]);
    expect(item.descricaoOriginal).toBe('ASAAS*NEXTFITago 26');
    expect(montarCriacao(item, draft)).not.toHaveProperty('valorOriginal');
  });
  it('exige os campos do reembolso antes de enviar a linha', () => {
    const draft = criarRascunho(item, '2026-09-20', 'cartao');
    draft.gerarReembolso = true;
    expect(() => montarCriacao(item, draft)).toThrow('pagador');
  });
  it('aplica responsável em lote sem substituir valores e descrições', () => {
    const a = criarRascunho(item, '2026-09-20', 'cartao');
    const b = { ...criarRascunho({ ...item, id: 'j', valor: 60 }, '2026-09-20', 'cartao'), descricao: 'Outra compra' };
    const updated = aplicarCampoEmLote({ i: a, j: b }, ['i', 'j'], 'responsavelCompraId', 'p3');
    expect(updated.j.responsavelCompraId).toBe('p3');
    expect(updated.j.descricao).toBe('Outra compra');
    expect(updated.j.rateios.reduce((s, r) => s + r.valor, 0)).toBe(60);
    expect(a.responsavelCompraId).toBe('p1');
  });
});

describe('validações da revisão financeira', () => {
  const draft = () => criarRascunho(item, '2026-09-20', 'cartao');
  it('restaura decisões do rascunho em vez de reaplicar memória', () => {
    const saved = { ...draft(), descricao: 'Decisão manual', aprender: false, vinculo: 'novo', selecionado: false };
    expect(criarRascunho({ ...item, rascunho: saved }, '2027-01-01', 'outro')).toEqual(saved);
  });
  it('ignora rascunho inválido e não sugere recorrência ou reembolso para estorno', () => {
    const result = criarRascunho({ ...item, valor: -33.33, rascunho: { descricao: 123 },
      preferencias: { descricao: null, responsavelCompraId: null, recebedorId: null, rateios: null, reembolsoPagadoresIds: null, ehRecorrente: true, gerarReembolso: true } }, '2026-09-20', 'cartao');
    expect(result.descricao).toBe(item.descricaoOriginal);
    expect(result.ehRecorrente).toBe(false);
    expect(result.gerarReembolso).toBe(false);
    expect(result.rateios).toEqual([{ contaGerencialId: '', valor: -33.33 }]);
  });
  it('preserva sinal e soma dos centavos de crédito', () => {
    expect(ratearValor(-0.03, [{ contaGerencialId: 'a', proporcao: 1 }, { contaGerencialId: 'b', proporcao: 1 }]))
      .toEqual([{ contaGerencialId: 'a', valor: -0.02 }, { contaGerencialId: 'b', valor: -0.01 }]);
    expect(ratearValor(10, [{ contaGerencialId: 'a', proporcao: 0 }])).toEqual([{ contaGerencialId: '', valor: 10 }]);
  });
  it.each(['descricao', 'recebedorId', 'responsavelCompraId', 'formaPagamentoId'] as const)('bloqueia compra sem %s', campo => {
    expect(() => montarCriacao(item, { ...draft(), [campo]: '' })).toThrow('Complete');
  });
  it.each([
    [], [{ contaGerencialId: '', valor: 33.33 }], [{ contaGerencialId: 'a', valor: NaN }],
    [{ contaGerencialId: 'a', valor: -33.33 }], [{ contaGerencialId: 'a', valor: 33.34 }]
  ])('bloqueia rateio inválido %#', (...rateios) => {
    expect(() => montarCriacao(item, { ...draft(), rateios })).toThrow('rateios');
  });
  it('monta recorrência com fim e observações e bloqueia parcelamento', () => {
    const row = { ...draft(), ehRecorrente: true, recorrenciaInicio: '', recorrenciaFim: '2026-12-01',
      recorrenciaObservacao: 'Mensal', observacao: 'Compra', aprender: false };
    expect(montarCriacao(item, row)).toMatchObject({ aprender: false, observacao: 'Compra',
      recorrencia: { dataInicio: item.data, dataFim: '2026-12-01', observacao: 'Mensal' } });
    expect(() => montarCriacao({ ...item, quantidadeParcelas: 3 }, row)).toThrow('parcelamento');
  });
  it('remove pagadores repetidos sem perder campos do reembolso', () => {
    const row = draft(); row.gerarReembolso = true;
    row.reembolso = { ...row.reembolso, pagadoresIds: ['p1', 'p2', 'p1'], formaPagamentoId: 'pix',
      rateios: [{ contaGerencialId: 'receita', valor: 33.33 }], observacao: 'Acerto', parcelarIgual: true };
    expect(montarReembolso(row)).toMatchObject({ pagadoresIds: ['p1', 'p2'], observacao: 'Acerto', parcelarIgual: true });
  });
  it.each(['formaPagamentoId', 'dataVencimento', 'descricao'] as const)('bloqueia reembolso sem %s', campo => {
    const row = draft(); row.gerarReembolso = true;
    row.reembolso = { ...row.reembolso, pagadoresIds: ['p'], formaPagamentoId: 'pix', [campo]: '' };
    expect(() => montarReembolso(row)).toThrow('Complete');
  });
  it('não altera linha fora da seleção', () => {
    const row = draft();
    expect(aplicarCampoEmLote({ a: row }, [], 'descricao', 'Outra').a).toEqual(row);
  });
});
