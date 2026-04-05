import { financialAccountFormSchema } from './schemas';

const validValues = {
  numeroDocumento: '',
  pessoaId: 'p1',
  responsavelId: '',
  dataEmissao: '2026-04-04',
  dataVencimento: '2026-04-20',
  formaPagamentoId: 'f1',
  cartaoId: '',
  contaBancariaId: '',
  dataLiquidacao: '',
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
  recorrenciaDiaGeracaoMensal: 20,
  recorrenciaDataInicio: '',
  recorrenciaDataFim: '',
  recorrenciaPermiteEdicaoOcorrenciaIndividual: true,
  recorrenciaObservacao: '',
  recorrenciaGerarAteData: ''
};

describe('financialAccountFormSchema', () => {
  it('accepts a payload with rateio matching the valor liquido', () => {
    expect(() => financialAccountFormSchema.parse(validValues)).not.toThrow();
  });

  it('rejects payloads when the rateio total does not close the valor liquido', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        rateios: [{ contaGerencialId: 'cg1', valor: 90 }]
      })
    ).toThrow('A soma dos rateios deve fechar exatamente o valor liquido.');
  });

  it('rejects payloads without rateio entries', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        rateios: []
      })
    ).toThrow('Informe ao menos um rateio');
  });

  it('rejects recorrencia combined with parcelamento', () => {
    expect(() =>
      financialAccountFormSchema.parse({
        ...validValues,
        ehRecorrente: true,
        recorrenciaDataInicio: '2026-04-20',
        quantidadeParcelas: 2
      })
    ).toThrow('Recorrencia nao pode ser combinada com parcelamento.');
  });
});
