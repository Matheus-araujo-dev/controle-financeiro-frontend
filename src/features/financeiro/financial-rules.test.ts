import { vi, describe, it, expect, beforeEach } from 'vitest';
import { checkContaPagarDuplicate, checkContaReceberDuplicate } from './financial-rules';
import { financeiroApi } from '../../services/http/financeiro-api';

vi.mock('../../services/http/financeiro-api', () => ({
  financeiroApi: {
    contasPagar: { listar: vi.fn() },
    contasReceber: { listar: vi.fn() }
  }
}));

const mockPagarResult = {
  items: [
    {
      id: 'cp-1',
      descricao: 'Aluguel',
      recebedorNome: 'Imobiliária',
      valorLiquido: 1200,
      dataVencimento: '2026-07-10',
      statusNome: 'Pendente',
      statusCodigo: 'PENDENTE'
    }
  ],
  totalItems: 1,
  page: 1,
  pageSize: 5,
  totalPages: 1
};

const mockReceberResult = {
  items: [
    {
      id: 'cr-1',
      descricao: 'Freelance',
      pagadorNome: 'Cliente',
      valorLiquido: 3000,
      dataVencimento: '2026-07-15',
      statusNome: 'Futuro',
      statusCodigo: 'FUTURO'
    }
  ],
  totalItems: 1,
  page: 1,
  pageSize: 5,
  totalPages: 1
};

describe('checkContaPagarDuplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue(mockPagarResult as never);
  });

  it('returns null when descricao is blank', async () => {
    const result = await checkContaPagarDuplicate('   ', '2026-07-10');
    expect(result).toBeNull();
    expect(financeiroApi.contasPagar.listar).not.toHaveBeenCalled();
  });

  it('returns null when dataVencimento is empty', async () => {
    const result = await checkContaPagarDuplicate('Aluguel', '');
    expect(result).toBeNull();
    expect(financeiroApi.contasPagar.listar).not.toHaveBeenCalled();
  });

  it('returns mapped items when duplicates are found', async () => {
    const result = await checkContaPagarDuplicate('Aluguel', '2026-07-10', 'rec-1', 1200);
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      id: 'cp-1',
      descricao: 'Aluguel',
      pessoaNome: 'Imobiliária',
      valorLiquido: 1200,
      dataVencimento: '2026-07-10',
      statusNome: 'Pendente',
      statusCodigo: 'PENDENTE'
    });
  });

  it('returns null when no duplicates found', async () => {
    vi.mocked(financeiroApi.contasPagar.listar).mockResolvedValue({ ...mockPagarResult, totalItems: 0, items: [] } as never);
    const result = await checkContaPagarDuplicate('Aluguel', '2026-07-10');
    expect(result).toBeNull();
  });

  it('calls API with correct parameters including valor range', async () => {
    await checkContaPagarDuplicate('Boleto', '2026-07-05', 'rec-2', 500);
    expect(financeiroApi.contasPagar.listar).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      pageSize: 5,
      search: 'Boleto',
      dataInicial: '2026-07-05',
      dataFinal: '2026-07-05',
      recebedorId: 'rec-2',
      valorMinimo: expect.closeTo(499.99, 2),
      valorMaximo: 500.01
    }));
  });

  it('calls API without valor range when valor is undefined', async () => {
    await checkContaPagarDuplicate('Boleto', '2026-07-05');
    const call = vi.mocked(financeiroApi.contasPagar.listar).mock.calls[0][0];
    expect(call.valorMinimo).toBeUndefined();
    expect(call.valorMaximo).toBeUndefined();
  });

  it('calls API with recebedorId undefined when empty string', async () => {
    await checkContaPagarDuplicate('Boleto', '2026-07-05', '');
    const call = vi.mocked(financeiroApi.contasPagar.listar).mock.calls[0][0];
    expect(call.recebedorId).toBeUndefined();
  });

  it('uses 0 as minimum when valor is negative', async () => {
    await checkContaPagarDuplicate('Boleto', '2026-07-05', undefined, -50);
    const call = vi.mocked(financeiroApi.contasPagar.listar).mock.calls[0][0];
    expect(call.valorMinimo).toBe(0);
  });
});

describe('checkContaReceberDuplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue(mockReceberResult as never);
  });

  it('returns null when descricao is blank', async () => {
    const result = await checkContaReceberDuplicate('', '2026-07-15');
    expect(result).toBeNull();
  });

  it('returns null when dataVencimento is empty', async () => {
    const result = await checkContaReceberDuplicate('Freelance', '');
    expect(result).toBeNull();
  });

  it('returns mapped items using pagadorNome', async () => {
    const result = await checkContaReceberDuplicate('Freelance', '2026-07-15', 'pag-1', 3000);
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      id: 'cr-1',
      descricao: 'Freelance',
      pessoaNome: 'Cliente',
      valorLiquido: 3000,
      dataVencimento: '2026-07-15',
      statusNome: 'Futuro',
      statusCodigo: 'FUTURO'
    });
  });

  it('returns null when no duplicates found', async () => {
    vi.mocked(financeiroApi.contasReceber.listar).mockResolvedValue({ ...mockReceberResult, totalItems: 0, items: [] } as never);
    const result = await checkContaReceberDuplicate('Freelance', '2026-07-15');
    expect(result).toBeNull();
  });

  it('calls API with correct parameters', async () => {
    await checkContaReceberDuplicate('Honorário', '2026-07-20', 'pag-3', 1500);
    expect(financeiroApi.contasReceber.listar).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      pageSize: 5,
      search: 'Honorário',
      pagadorId: 'pag-3',
      valorMinimo: expect.closeTo(1499.99, 2),
      valorMaximo: 1500.01
    }));
  });
});
