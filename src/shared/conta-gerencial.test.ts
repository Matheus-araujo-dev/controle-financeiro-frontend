import {
  buildContaGerencialOptionLabel,
  compareContaGerencialByCodigo,
  filterContaGerencialLancavel,
  mapContaGerencialHierarchyData,
  mapContaGerencialSelectOptions,
  mapContaGerencialSelectOptionsWithData,
  sortContasGerenciaisByCodigo
} from './conta-gerencial';

describe('sortContasGerenciaisByCodigo', () => {
  it('sorts by code numerically, items without code go last', () => {
    const items = [
      { id: '3', codigo: null, descricao: 'Sem código' },
      { id: '2', codigo: 'DES.10.02', descricao: 'Móveis e casa' },
      { id: '1', codigo: 'DES.02.04', descricao: 'Lanches e delivery' },
      { id: '4', codigo: 'DES.02.10', descricao: 'Restaurantes premium' }
    ];
    expect(sortContasGerenciaisByCodigo(items).map((i) => i.id)).toEqual(['1', '4', '2', '3']);
  });

  it('sorts items without code alphabetically by description', () => {
    const items = [
      { id: 'b', codigo: null, descricao: 'Zelador' },
      { id: 'a', codigo: null, descricao: 'Almoxarifado' }
    ];
    expect(sortContasGerenciaisByCodigo(items).map((i) => i.id)).toEqual(['a', 'b']);
  });
});

describe('compareContaGerencialByCodigo', () => {
  it('coded account comes before no-code account', () => {
    expect(
      compareContaGerencialByCodigo({ codigo: 'REC.01', descricao: 'Salários' }, { codigo: null, descricao: 'Sem código' })
    ).toBeLessThan(0);
  });

  it('no-code account comes after coded account', () => {
    expect(
      compareContaGerencialByCodigo({ codigo: null, descricao: 'Sem código' }, { codigo: 'REC.01', descricao: 'Salários' })
    ).toBeGreaterThan(0);
  });

  it('two no-code accounts are sorted by description', () => {
    const result = compareContaGerencialByCodigo({ codigo: null, descricao: 'Zelador' }, { codigo: null, descricao: 'Almoxarifado' });
    expect(result).toBeGreaterThan(0);
  });
});

describe('buildContaGerencialOptionLabel', () => {
  it('builds "codigo - descricao" label when code present', () => {
    expect(buildContaGerencialOptionLabel({ codigo: 'DES.10', descricao: 'Tecnologia' })).toBe('DES.10 - Tecnologia');
  });

  it('returns just description when code is null', () => {
    expect(buildContaGerencialOptionLabel({ codigo: null, descricao: 'Sem código' })).toBe('Sem código');
  });
});

describe('mapContaGerencialSelectOptions', () => {
  it('maps items to sorted select options', () => {
    const items = [
      { id: 'cg-2', codigo: 'DES.10', descricao: 'Tecnologia' },
      { id: 'cg-1', codigo: 'DES.02', descricao: 'Alimentação' }
    ];
    expect(mapContaGerencialSelectOptions(items)).toEqual([
      { label: 'DES.02 - Alimentação', value: 'cg-1' },
      { label: 'DES.10 - Tecnologia', value: 'cg-2' }
    ]);
  });
});

describe('filterContaGerencialLancavel', () => {
  it('includes items where aceitaLancamentos is true or undefined', () => {
    const items = [
      { id: '1', codigo: null, descricao: 'A', aceitaLancamentos: true },
      { id: '2', codigo: null, descricao: 'B', aceitaLancamentos: undefined },
      { id: '3', codigo: null, descricao: 'C', aceitaLancamentos: false }
    ];
    const result = filterContaGerencialLancavel(items);
    expect(result.map((i) => i.id)).toEqual(['1', '2']);
  });
});

describe('mapContaGerencialHierarchyData', () => {
  it('includes parent chain in parentheses for child items', () => {
    const items = [
      { id: 'pai', codigo: 'DES', descricao: 'Despesas', contaPaiId: null, aceitaLancamentos: true },
      { id: 'filho', codigo: 'DES.01', descricao: 'Alimentação', contaPaiId: 'pai', aceitaLancamentos: true }
    ];
    const result = mapContaGerencialHierarchyData(items);
    const filho = result.find((r) => r.value === 'filho');
    expect(filho?.chain).toBe('(DES - Despesas)');
  });

  it('returns null chain for root items', () => {
    const items = [{ id: 'raiz', codigo: 'REC', descricao: 'Receitas', contaPaiId: null, aceitaLancamentos: true }];
    const result = mapContaGerencialHierarchyData(items);
    expect(result[0].chain).toBeNull();
  });

  it('excludes items with aceitaLancamentos = false', () => {
    const items = [
      { id: 'grupo', codigo: 'GRP', descricao: 'Grupo', contaPaiId: null, aceitaLancamentos: false },
      { id: 'folha', codigo: 'GRP.01', descricao: 'Folha', contaPaiId: 'grupo', aceitaLancamentos: true }
    ];
    const result = mapContaGerencialHierarchyData(items);
    expect(result.map((r) => r.value)).not.toContain('grupo');
    expect(result.map((r) => r.value)).toContain('folha');
  });
});

describe('mapContaGerencialSelectOptionsWithData', () => {
  it('maps items to select options with nested data payload', () => {
    const items = [
      {
        id: 'cg-1',
        codigo: 'REC.01',
        descricao: 'Salários',
        tipo: 'Receita',
        contaPaiId: null,
        responsavelPadraoId: 'rp-1',
        responsavelPadraoNome: 'Ana'
      }
    ];
    const result = mapContaGerencialSelectOptionsWithData(items);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      label: 'REC.01 - Salários',
      value: 'cg-1',
      data: {
        codigo: 'REC.01',
        descricao: 'Salários',
        tipo: 'Receita',
        contaPaiId: null,
        responsavelPadraoId: 'rp-1',
        responsavelPadraoNome: 'Ana'
      }
    });
  });

  it('normalizes undefined optional fields to null', () => {
    const items = [{ id: 'cg-2', codigo: null, descricao: 'Outros' }];
    const result = mapContaGerencialSelectOptionsWithData(items);
    expect(result[0].data.contaPaiId).toBeNull();
    expect(result[0].data.responsavelPadraoId).toBeNull();
    expect(result[0].data.responsavelPadraoNome).toBeNull();
  });
});
