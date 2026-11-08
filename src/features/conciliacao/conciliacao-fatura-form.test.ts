import { criarRascunho, montarCriacao, aplicarCampoEmLote, montarReembolso, ratearValor, applySmartFill, normalizarEstabelecimento } from './conciliacao-fatura-form';
import type { RascunhoLancamento } from './conciliacao-fatura-form';
import type { ItemFaturaConciliacao } from '../../types/conciliacao-fatura';

const item: ItemFaturaConciliacao = { id: 'i', data: '2026-09-01', descricaoOriginal: 'ASAAS*NEXTFITago 26', valor: 33.33,
  numeroParcela: 1, quantidadeParcelas: 1, status: 'Pendente', contaPagarVinculadaId: null, valorAnteriorSistema: null, candidatos: [],
  preferencias: { descricao: 'Sistema do pilates', pagadorId: 'p1', recebedorId: 'p2',
    rateios: [{ contaGerencialId: 'a', proporcao: 0.5 }, { contaGerencialId: 'b', proporcao: 0.5 }], ehRecorrente: false, gerarReembolso: false, reembolsoPagadoresIds: [], pagadoresAdicionaisIds: [] } };

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
  it('aplica pagador em lote sem substituir valores e descrições', () => {
    const a = criarRascunho(item, '2026-09-20', 'cartao');
    const b = { ...criarRascunho({ ...item, id: 'j', valor: 60 }, '2026-09-20', 'cartao'), descricao: 'Outra compra' };
    const updated = aplicarCampoEmLote({ i: a, j: b }, ['i', 'j'], 'pagadorId', 'p3');
    expect(updated.j.pagadorId).toBe('p3');
    expect(updated.j.descricao).toBe('Outra compra');
    expect(updated.j.rateios.reduce((s, r) => s + r.valor, 0)).toBe(60);
    expect(a.pagadorId).toBe('p1');
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
      preferencias: { descricao: null, pagadorId: null, recebedorId: null, rateios: null, reembolsoPagadoresIds: null, pagadoresAdicionaisIds: null, ehRecorrente: true, gerarReembolso: true } }, '2026-09-20', 'cartao');
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
  it.each(['descricao', 'recebedorId', 'pagadorId', 'formaPagamentoId'] as const)('bloqueia compra sem %s', campo => {
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
  it('inclui pagadoresAdicionaisIds e valoresPorPagador quando preenchidos', () => {
    const d = { ...draft(), pagadoresAdicionaisIds: ['x', 'y'], pagadoresValores: [10, 23.33] };
    const result = montarCriacao(item, d);
    expect(result.pagadoresAdicionaisIds).toEqual(['x', 'y']);
    expect(result.valoresPorPagador).toEqual([10, 23.33]);
  });
  it('omite pagadoresAdicionaisIds e valoresPorPagador quando vazios', () => {
    const result = montarCriacao(item, draft());
    expect(result.pagadoresAdicionaisIds).toBeUndefined();
    expect(result.valoresPorPagador).toBeUndefined();
  });
  it('retorna observação null no reembolso quando string vazia', () => {
    const d = draft();
    d.gerarReembolso = true;
    d.reembolso = { ...d.reembolso, pagadoresIds: ['p1'], formaPagamentoId: 'pix', observacao: '', rateios: [{ contaGerencialId: 'r', valor: 33.33 }] };
    const r = montarReembolso(d)!;
    expect(r.observacao).toBeNull();
  });
});

describe('normalizarEstabelecimento', () => {
  it('remove acentos e normaliza para upper', () => {
    expect(normalizarEstabelecimento('Café do João')).toBe('CAFE DO JOAO');
  });
  it('remove sufixo de mês/ano', () => {
    expect(normalizarEstabelecimento('ASAAS*NEXTFIT AGO 26')).toBe('ASAAS NEXTFIT');
    expect(normalizarEstabelecimento('MERCADO LIVRE DEZ 2026')).toBe('MERCADO LIVRE');
  });
  it('remove sufixo de parcela', () => {
    expect(normalizarEstabelecimento('AMAZON 3/12')).toBe('AMAZON');
  });
  it('retorna string vazia para input de apenas símbolos', () => {
    expect(normalizarEstabelecimento('***')).toBe('');
  });
});

describe('applySmartFill', () => {
  const mkItem = (overrides: Partial<ItemFaturaConciliacao> = {}): ItemFaturaConciliacao => ({
    id: 'i1', data: '2026-09-01', descricaoOriginal: 'ASAAS*NEXTFIT', valor: 50,
    numeroParcela: 1, quantidadeParcelas: 1, status: 'Pendente',
    contaPagarVinculadaId: null, valorAnteriorSistema: null, candidatos: [],
    ...overrides
  });
  const mkDraft = (overrides: Partial<RascunhoLancamento> = {}): RascunhoLancamento => ({
    descricao: 'Test', recebedorId: '', pagadorId: '', formaPagamentoId: 'pix',
    pagadoresAdicionaisIds: [], pagadoresValores: [],
    rateios: [{ contaGerencialId: '', valor: 50 }], observacao: '', aprender: true,
    camposParaAprender: [], ehRecorrente: false, recorrenciaTipoDia: 'DiaFixo',
    recorrenciaDia: 1, recorrenciaInicio: '', recorrenciaFim: '', permiteEdicao: true,
    recorrenciaObservacao: '', gerarReembolso: false,
    reembolso: { parcelarIgual: false, valorTotal: 50, pagadoresIds: [],
      formaPagamentoId: '', dataVencimento: '', descricao: '', observacao: '', rateios: [] },
    ...overrides
  });

  const despesas = [
    { value: 'cg1', responsavelPadraoId: 'resp1' },
    { value: 'cg2', responsavelPadraoId: null }
  ];

  it('auto-preenche pagadorId quando single rateio com despesa correspondente', () => {
    const rows = { i1: mkDraft() };
    const itens = [mkItem()];
    const result = applySmartFill(rows, 'i1', { rateios: [{ contaGerencialId: 'cg1', valor: 50 }] }, itens, despesas);
    expect(result.i1.pagadorId).toBe('resp1');
  });

  it('não preenche pagadorId quando despesa não tem responsável', () => {
    const rows = { i1: mkDraft() };
    const itens = [mkItem()];
    const result = applySmartFill(rows, 'i1', { rateios: [{ contaGerencialId: 'cg2', valor: 50 }] }, itens, despesas);
    expect(result.i1.pagadorId).toBe('');
  });

  it('não preenche pagadorId quando já existe', () => {
    const rows = { i1: mkDraft({ pagadorId: 'existing' }) };
    const itens = [mkItem()];
    const result = applySmartFill(rows, 'i1', { rateios: [{ contaGerencialId: 'cg1', valor: 50 }] }, itens, despesas);
    expect(result.i1.pagadorId).toBe('existing');
  });

  it('retorna sem alteração quando patch não tem campos propagáveis', () => {
    const rows = { i1: mkDraft() };
    const itens = [mkItem()];
    const result = applySmartFill(rows, 'i1', { descricao: 'Nova desc' }, itens, despesas);
    expect(result).toBe(rows);
  });

  it('retorna sem alteração quando item não encontrado', () => {
    const rows = { i1: mkDraft() };
    const itens = [mkItem({ id: 'other' })];
    const result = applySmartFill(rows, 'i1', { pagadorId: 'p1' }, itens, despesas);
    expect(result).toBe(rows);
  });

  it('retorna sem alteração quando estabelecimento é vazio', () => {
    const rows = { i1: mkDraft() };
    const itens = [mkItem({ descricaoOriginal: '***' })];
    const result = applySmartFill(rows, 'i1', { pagadorId: 'p1' }, itens, despesas);
    expect(result).toBe(rows);
  });

  it('propaga pagadorId para siblings com mesmo estabelecimento', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'ASAAS*NEXTFIT SET 26' });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'ASAAS*NEXTFIT OUT 26', status: 'Pendente' });
    const rows = { i1: mkDraft({ pagadorId: '' }), i2: mkDraft({ pagadorId: '' }) };
    const result = applySmartFill(rows, 'i1', { pagadorId: 'p1' }, [i1, i2], despesas);
    expect(result.i2.pagadorId).toBe('p1');
  });

  it('não propaga pagadorId para sibling que já tem pagador', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT' });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', status: 'Pendente' });
    const rows = { i1: mkDraft(), i2: mkDraft({ pagadorId: 'existing' }) };
    const result = applySmartFill(rows, 'i1', { pagadorId: 'p1' }, [i1, i2], despesas);
    expect(result.i2.pagadorId).toBe('existing');
  });

  it('não propaga para sibling com estabelecimento diferente', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT' });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'MERCADO', status: 'Pendente' });
    const rows = { i1: mkDraft(), i2: mkDraft() };
    const result = applySmartFill(rows, 'i1', { pagadorId: 'p1' }, [i1, i2], despesas);
    expect(result.i2.pagadorId).toBe('');
  });

  it('não propaga para sibling com status != Pendente', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT' });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', status: 'Conciliado' as never });
    const rows = { i1: mkDraft(), i2: mkDraft() };
    const result = applySmartFill(rows, 'i1', { pagadorId: 'p1' }, [i1, i2], despesas);
    expect(result.i2.pagadorId).toBe('');
  });

  it('propaga recebedorId para siblings', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT' });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', status: 'Pendente' });
    const rows = { i1: mkDraft(), i2: mkDraft({ recebedorId: '' }) };
    const result = applySmartFill(rows, 'i1', { recebedorId: 'r1' }, [i1, i2], despesas);
    expect(result.i2.recebedorId).toBe('r1');
  });

  it('propaga rateios para siblings sem conta gerencial e seta responsável', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT', valor: 100 });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', valor: 60, status: 'Pendente' });
    const rows = {
      i1: mkDraft({ rateios: [{ contaGerencialId: '', valor: 100 }] }),
      i2: mkDraft({ rateios: [{ contaGerencialId: '', valor: 60 }] })
    };
    const result = applySmartFill(rows, 'i1', { rateios: [{ contaGerencialId: 'cg1', valor: 100 }] }, [i1, i2], despesas);
    expect(result.i2.rateios[0].contaGerencialId).toBe('cg1');
    expect(result.i2.pagadorId).toBe('resp1');
  });

  it('não propaga rateios para sibling com conta gerencial já preenchida', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT', valor: 100 });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', valor: 60, status: 'Pendente' });
    const rows = {
      i1: mkDraft(),
      i2: mkDraft({ rateios: [{ contaGerencialId: 'filled', valor: 60 }] })
    };
    const result = applySmartFill(rows, 'i1', { rateios: [{ contaGerencialId: 'cg1', valor: 100 }] }, [i1, i2], despesas);
    expect(result.i2.rateios[0].contaGerencialId).toBe('filled');
  });

  it('propaga gerarReembolso apenas para itens positivos', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT', valor: 100 });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', valor: 50, status: 'Pendente' });
    const i3 = mkItem({ id: 'i3', descricaoOriginal: 'NEXTFIT', valor: -20, status: 'Pendente' });
    const rows = {
      i1: mkDraft({ gerarReembolso: false }),
      i2: mkDraft({ gerarReembolso: false }),
      i3: mkDraft({ gerarReembolso: false })
    };
    const result = applySmartFill(rows, 'i1', { gerarReembolso: true }, [i1, i2, i3], despesas);
    expect(result.i2.gerarReembolso).toBe(true);
    expect(result.i3.gerarReembolso).toBe(false);
  });

  it('não propaga gerarReembolso quando sibling já tem o mesmo valor', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT', valor: 100 });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', valor: 50, status: 'Pendente' });
    const rows = {
      i1: mkDraft({ gerarReembolso: true }),
      i2: mkDraft({ gerarReembolso: true })
    };
    const result = applySmartFill(rows, 'i1', { gerarReembolso: true }, [i1, i2], despesas);
    expect(result.i2.gerarReembolso).toBe(true);
  });

  it('ignora sibling sem rascunho no mapa', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT' });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', status: 'Pendente' });
    const rows = { i1: mkDraft() };
    const result = applySmartFill(rows, 'i1', { pagadorId: 'p1' }, [i1, i2], despesas);
    expect(result.i2).toBeUndefined();
  });

  it('sem despesas não preenche responsável automaticamente', () => {
    const rows = { i1: mkDraft() };
    const itens = [mkItem()];
    const result = applySmartFill(rows, 'i1', { rateios: [{ contaGerencialId: 'cg1', valor: 50 }] }, itens);
    expect(result.i1.pagadorId).toBe('');
  });

  it('propaga rateios com múltiplas parcelas para sibling', () => {
    const i1 = mkItem({ id: 'i1', descricaoOriginal: 'NEXTFIT', valor: 100 });
    const i2 = mkItem({ id: 'i2', descricaoOriginal: 'NEXTFIT', valor: 100, status: 'Pendente' });
    const rows = {
      i1: mkDraft({ rateios: [{ contaGerencialId: '', valor: 100 }] }),
      i2: mkDraft({ rateios: [{ contaGerencialId: '', valor: 100 }] })
    };
    const result = applySmartFill(rows, 'i1', { rateios: [{ contaGerencialId: 'a', valor: 60 }, { contaGerencialId: 'b', valor: 40 }] }, [i1, i2], despesas);
    expect(result.i2.rateios).toHaveLength(2);
    expect(result.i2.rateios[0].contaGerencialId).toBe('a');
  });
});
