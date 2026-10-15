import { describe, expect, it } from 'vitest';
import { resolveColumnLayout, tableMinimumWidth } from './table-layout';

describe('shared table layout', () => {
  it('keeps explicit widths and permits a semantic override', () => {
    expect(resolveColumnLayout({ key: 'dataImportacao', title: 'Importação', width: 240, layout: 'text' })).toMatchObject({ role: 'text', width: '240px' });
  });
  it('limits technical columns independently of their position', () => {
    expect(resolveColumnLayout({ key: 'actions', title: 'Ações' }).role).toBe('actions');
    expect(resolveColumnLayout({ key: 'valorLiquido', title: 'Valor' }).role).toBe('money');
    expect(resolveColumnLayout({ key: 'dataVencimento', title: 'Vencimento' }).role).toBe('date');
    expect(resolveColumnLayout({ key: 'statusCodigo', title: 'Status' }).role).toBe('status');
    expect(resolveColumnLayout({ key: 'quantidadeItens', title: 'Itens' }).role).toBe('number');
    expect(resolveColumnLayout({ key: 'pessoa', title: 'Pessoa' })).toMatchObject({ role: 'text', width: undefined });
  });
  it('uses mobile roles without guessing from translated titles', () => {
    expect(resolveColumnLayout({ key: 'total', title: 'Amount', mobileRole: 'value' }).role).toBe('money');
    expect(resolveColumnLayout({ key: 'nome', title: 'Data especial' }).role).toBe('text');
  });
  it('gives narrow and wide tables a minimum based on their columns', () => {
    expect(tableMinimumWidth([{ key: 'nome', title: 'Nome' }, { key: 'actions', title: 'Ações', width: 160 }])).toBe(300);
    expect(tableMinimumWidth(Array.from({ length: 12 }, (_, index) => ({ key: `mes${index}`, title: 'Mês', layout: 'money' as const })))).toBe(1776);
  });
});
