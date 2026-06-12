import {
  buildContaGerencialOptionLabel,
  compareContaGerencialByCodigo,
  mapContaGerencialSelectOptions,
  sortContasGerenciaisByCodigo
} from './conta-gerencial';

describe('conta-gerencial helpers', () => {
  it('sorts launchable accounts by code before description', () => {
    const items = [
      { id: '3', codigo: null, descricao: 'Sem código' },
      { id: '2', codigo: 'DES.10.02', descricao: 'Móveis e casa' },
      { id: '1', codigo: 'DES.02.04', descricao: 'Lanches e delivery' },
      { id: '4', codigo: 'DES.02.10', descricao: 'Restaurantes premium' }
    ];

    expect(sortContasGerenciaisByCodigo(items).map((item) => item.id)).toEqual(['1', '4', '2', '3']);
  });

  it('builds labels and select options with the same ordering rule', () => {
    const items = [
      { id: 'cg-2', codigo: 'DES.10', descricao: 'Tecnologia' },
      { id: 'cg-1', codigo: 'DES.02', descricao: 'Alimentação' }
    ];

    expect(buildContaGerencialOptionLabel(items[0])).toBe('DES.10 - Tecnologia');
    expect(mapContaGerencialSelectOptions(items)).toEqual([
      { label: 'DES.02 - Alimentação', value: 'cg-1' },
      { label: 'DES.10 - Tecnologia', value: 'cg-2' }
    ]);
  });

  it('keeps accounts without code after coded accounts', () => {
    expect(
      compareContaGerencialByCodigo(
        { codigo: null, descricao: 'Sem código' },
        { codigo: 'REC.01', descricao: 'Salários' }
      )
    ).toBeGreaterThan(0);
  });
});
