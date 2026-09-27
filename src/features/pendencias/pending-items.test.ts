import { describe, expect, it } from 'vitest';
import { buildPendingItems } from './pending-items';

const account = (overrides = {}) => ({ id: '1', descricao: 'Internet', dataVencimento: '2026-09-10', valorLiquido: 100, valorPago: 0, statusCodigo: 'PENDENTE', pessoaNome: 'Fornecedor', ...overrides });

describe('central de pendências', () => {
  it('exibe saldo restante, prioriza vencidas e não duplica contas', () => {
    const rows = buildPendingItems({ pagar: [account(), account(), account({ id: '2', dataVencimento: '2026-09-01', statusCodigo: 'PARCIAL', valorPago: 40 })], receber: [], importacoes: [] }, '2026-09-10');
    expect(rows.map(row => [row.id, row.valor, row.motivo])).toEqual([['pagar:2', 60, 'Vencida'], ['pagar:1', 100, 'Vence hoje']]);
    expect(rows[0].href).toBe('/contas-pagar/2');
  });
  it('omite quitadas, canceladas, itens em fatura e valores sem saldo restante', () => {
    const pagar = ['LIQUIDADA', 'CANCELADA', 'EM_FATURA'].map((statusCodigo, id) => account({ id: String(id), statusCodigo }));
    pagar.push(account({ id: 'paid', statusCodigo: 'PARCIAL', valorPago: 100 }));
    expect(buildPendingItems({ pagar, receber: [], importacoes: [] }, '2026-09-10')).toEqual([]);
  });
  it('separa receber e pagar com mesmo id e limita próximos vencimentos a sete dias', () => {
    const rows = buildPendingItems({ pagar: [account()], receber: [account({ dataVencimento: '2026-09-16' }), account({ id: 'future', dataVencimento: '2026-09-17' })], importacoes: [] }, '2026-09-10');
    expect(rows.map(row => row.id)).toEqual(['pagar:1', 'receber:1']);
    expect(rows[1].href).toBe('/contas-receber/1');
  });
  it('importações exigem revisão, têm origem própria e não são somadas como valores financeiros', () => {
    const rows = buildPendingItems({ pagar: [], receber: [], importacoes: [{ id: 'a', statusCodigo: 'PENDENTE_REVISAO', quantidadePendentes: 2, nomeArquivo: 'fatura.pdf' }, { id: 'b', statusCodigo: 'CONFIRMADO', quantidadePendentes: 0 }] }, '2026-09-10');
    expect(rows).toEqual([expect.objectContaining({ id: 'importacao:a', valor: null, href: '/importacoes-whatsapp/a', motivo: '2 itens para revisar' })]);
  });
  it('não apresenta datas inválidas como compromissos confiáveis', () => {
    expect(() => buildPendingItems({ pagar: [account({ dataVencimento: 'inválida' })], receber: [], importacoes: [] }, '2026-09-10')).toThrow('Data de vencimento inválida');
  });
});

it.each([NaN, Infinity])('recusa valores financeiros inválidos (%s)', valorLiquido => {
  expect(() => buildPendingItems({ pagar: [account({ valorLiquido })], receber: [], importacoes: [] }, '2026-09-10')).toThrow('Valor financeiro inválido');
});
