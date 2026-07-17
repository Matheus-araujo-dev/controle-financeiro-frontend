import { normalizeRecurringFormValues } from './useFinancialAccountForm';
import type { FinanceiroFormValues } from '../module-config';

function makeValues(overrides: Partial<FinanceiroFormValues> = {}): FinanceiroFormValues {
  return {
    descricao: 'Teste',
    dataEmissao: '2026-06-01',
    dataVencimento: '2026-06-15',
    dataCompra: '',
    pessoaId: '',
    responsavelId: '',
    valorOriginal: 100,
    valorDesconto: 0,
    valorJuros: 0,
    valorMulta: 0,
    formaPagamentoId: '',
    contaBancariaId: '',
    cartaoId: '',
    quantidadeParcelas: 1,
    observacao: '',
    rateios: [],
    ehRecorrente: false,
    recorrenciaDataInicio: '',
    recorrenciaTipoDia: 'DiaFixo',
    recorrenciaDiaOrdemMensal: 1,
    origemCompraPlanejadaId: '',
    ...overrides
  };
}

describe('normalizeRecurringFormValues', () => {
  it('returns values unchanged when ehRecorrente is false', () => {
    const values = makeValues({ ehRecorrente: false, quantidadeParcelas: 3 });
    const result = normalizeRecurringFormValues(values);
    expect(result).toBe(values); // same reference
    expect(result.quantidadeParcelas).toBe(3);
  });

  it('returns values unchanged when ehRecorrente is true but quantidadeParcelas is already 1', () => {
    const values = makeValues({ ehRecorrente: true, quantidadeParcelas: 1 });
    const result = normalizeRecurringFormValues(values);
    expect(result).toBe(values);
    expect(result.quantidadeParcelas).toBe(1);
  });

  it('resets quantidadeParcelas to 1 when ehRecorrente is true and parcelas > 1', () => {
    const values = makeValues({ ehRecorrente: true, quantidadeParcelas: 6 });
    const result = normalizeRecurringFormValues(values);
    expect(result).not.toBe(values); // different reference (new object)
    expect(result.quantidadeParcelas).toBe(1);
    // Other properties preserved
    expect(result.descricao).toBe('Teste');
    expect(result.valorOriginal).toBe(100);
  });

  it('handles quantidadeParcelas of 12 → resets to 1', () => {
    const values = makeValues({ ehRecorrente: true, quantidadeParcelas: 12 });
    const result = normalizeRecurringFormValues(values);
    expect(result.quantidadeParcelas).toBe(1);
  });
});
