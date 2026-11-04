type ContaGerencialLike = {
  id: string;
  codigo: string | null;
  descricao: string;
  aceitaLancamentos?: boolean;
};

type ContaGerencialWithParent = ContaGerencialLike & { contaPaiId?: string | null };

type SelectOption = {
  label: string;
  value: string;
};

type SelectOptionWithContaGerencialData = SelectOption & {
  data: {
    codigo: string | null;
    descricao: string;
    tipo?: string;
    contaPaiId?: string | null;
    responsavelPadraoId?: string | null;
    responsavelPadraoNome?: string | null;
  };
};

export function compareContaGerencialByCodigo(
  left: Pick<ContaGerencialLike, 'codigo' | 'descricao'>,
  right: Pick<ContaGerencialLike, 'codigo' | 'descricao'>
) {
  if (left.codigo && right.codigo) {
    return left.codigo.localeCompare(right.codigo, 'pt-BR', { numeric: true, sensitivity: 'base' });
  }

  if (left.codigo) {
    return -1;
  }

  if (right.codigo) {
    return 1;
  }

  return left.descricao.localeCompare(right.descricao, 'pt-BR', { sensitivity: 'base' });
}

export function sortContasGerenciaisByCodigo<T extends Pick<ContaGerencialLike, 'codigo' | 'descricao'>>(items: T[]) {
  return [...items].sort(compareContaGerencialByCodigo);
}

export function buildContaGerencialOptionLabel(item: Pick<ContaGerencialLike, 'codigo' | 'descricao'>) {
  return item.codigo ? `${item.codigo} - ${item.descricao}` : item.descricao;
}

export function mapContaGerencialSelectOptions<T extends ContaGerencialLike>(items: T[]): SelectOption[] {
  return sortContasGerenciaisByCodigo(items).map((item) => ({
    label: buildContaGerencialOptionLabel(item),
    value: item.id
  }));
}

export function filterContaGerencialLancavel<T extends ContaGerencialLike>(items: T[]) {
  return items.filter((item) => item.aceitaLancamentos !== false);
}

function buildContaGerencialParentChain<T extends ContaGerencialWithParent>(
  item: T,
  allById: Map<string, T>
): string | null {
  const ancestors: string[] = [];
  let current = item.contaPaiId ? allById.get(item.contaPaiId) : undefined;
  while (current) {
    ancestors.push(buildContaGerencialOptionLabel(current));
    current = current.contaPaiId ? allById.get(current.contaPaiId) : undefined;
  }
  return ancestors.length > 0 ? `(${ancestors.join(', ')})` : null;
}

export function mapContaGerencialHierarchyData<T extends ContaGerencialWithParent>(
  allItems: T[]
): Array<{ value: string; main: string; chain: string | null }> {
  const allById = new Map(allItems.map((item) => [item.id, item]));
  return sortContasGerenciaisByCodigo(filterContaGerencialLancavel(allItems)).map((item) => ({
    value: item.id,
    main: buildContaGerencialOptionLabel(item),
    chain: buildContaGerencialParentChain(item, allById)
  }));
}

export function mapContaGerencialSelectOptionsWithData<
  T extends ContaGerencialLike & {
    tipo?: string;
    contaPaiId?: string | null;
    responsavelPadraoId?: string | null;
    responsavelPadraoNome?: string | null;
  }
>(items: T[]): SelectOptionWithContaGerencialData[] {
  return sortContasGerenciaisByCodigo(items).map((item) => ({
    label: buildContaGerencialOptionLabel(item),
    value: item.id,
    data: {
      codigo: item.codigo,
      descricao: item.descricao,
      tipo: item.tipo,
      contaPaiId: item.contaPaiId ?? null,
      responsavelPadraoId: item.responsavelPadraoId ?? null,
      responsavelPadraoNome: item.responsavelPadraoNome ?? null
    }
  }));
}
