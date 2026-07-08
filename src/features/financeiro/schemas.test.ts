import { financialAccountFormSchema } from './schemas';

const validValues = {
  origemCompraPlanejadaId: '',
  numeroDocumento: '',
  pessoaId: 'p1',
  responsavelId: 'p2',
  dataEmissao: '2026-04-04',
  dataVencimento: '2026-04-20',
  formaPagamentoId: 'f1',
  cartaoId: '',
  contaBancariaId: '',
  dataLiquidacao: '',
  dataCompra: '',
  valorOriginal: 100,
  valorDesconto: 10,
  valorJuros: 5,
  valorMulta: 0,
  quantidadeParcelas: 1,
  descricao: 'Despesa mensal',
  observacao: '',
  rateios: [{ contaGerencialId: 'cg1', valor: 95 }],
  ehRecorrente: false,
  recorrenciaTipoPeriodicidade: 'Mensal',
  recorrenciaTipoDia: 'DiaFixo',
  recorrenciaDiaOrdemMensal: 20,
  recorrenciaDataInicio: '',
  recorrenciaDataFim: '',
  recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
  recorrenciaObservacao: '',
  recorrenciaGerarAteData: ''
};

describe('financialAccountFormSchema', () => {
  it('accepts a payload with rateio matching the valor líquido', () => {
    expect(() => financialAccountFormSchema.parse(validValues)).not.toThrow();
  });

  it('rejects payloads when the rateio total does not close the valor líquido', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        rateios: [{ contaGerencialId: 'cg1', valor: 90 }]
      })
    ).toThrow(/A soma dos rateios deve fechar exatamente o valor líquido/i);
  });

  it('rejects payloads without rateio entries', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        rateios: []
      })
    ).toThrow('Informe ao menos um rateio');
  });

  it('rejects recorrência combined with parcelamento', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        ehRecorrente: true,
        quantidadeParcelas: 2
      })
    ).toThrow('Recorrência não pode ser combinada com parcelamento.');
  });

  it('accepts recurring payload without explicit recurrence start date', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        ehRecorrente: true,
        recorrenciaDataInicio: ''
      })
    ).not.toThrow();
  });

  it('accepts recurrence end as month reference and rejects full dates', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        ehRecorrente: true,
        recorrenciaDataFim: '2026-08'
      })
    ).not.toThrow();

    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        ehRecorrente: true,
        recorrenciaDataFim: '2026-08-20'
      })
    ).toThrow('Informe o mês final no formato mês/ano.');
  });
});
