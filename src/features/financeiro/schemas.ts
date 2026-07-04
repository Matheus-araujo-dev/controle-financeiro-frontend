import { z } from 'zod';
import { calculateValorLiquido } from './module-config';

const rateioSchema = z.object({
  contaGerencialId: z.string().min(1, 'Conta gerencial obrigatória'),
  valor: z.number().positive('Valor do rateio deve ser maior que zero')
});

export const financialAccountFormSchema = z
  .object({
    origemCompraPlanejadaId: z.string(),
    numeroDocumento: z.string(),
    pessoaId: z.string().min(1, 'Selecione a pessoa'),
    responsavelId: z.string().min(1, 'Selecione o responsável'),
    dataEmissao: z.string(),
    dataVencimento: z.string().min(1, 'Informe a data de vencimento'),
    formaPagamentoId: z.string().min(1, 'Selecione a forma de pagamento'),
    cartaoId: z.string(),
    contaBancariaId: z.string(),
    dataLiquidacao: z.string(),
    valorOriginal: z.number().nonnegative(),
    valorDesconto: z.number().nonnegative(),
    valorJuros: z.number().nonnegative(),
    valorMulta: z.number().nonnegative(),
    quantidadeParcelas: z.number().int().min(1, 'Quantidade de parcelas inválida'),
    descricao: z.string().min(1, 'Descrição obrigatória'),
    observacao: z.string(),
    rateios: z.array(rateioSchema).min(1, 'Informe ao menos um rateio'),
    ehRecorrente: z.boolean(),
    recorrenciaTipoPeriodicidade: z.literal('Mensal'),
    recorrenciaTipoDia: z.enum(['DiaFixo', 'DiaUtil']),
    recorrenciaDiaOrdemMensal: z.number().int().min(1).max(31),
    recorrenciaDataInicio: z.string(),
    recorrenciaDataFim: z.string(),
    recorrenciaPermiteEdicaoOcorrenciaIndividual: z.boolean(),
    recorrenciaObservacao: z.string(),
    recorrenciaGerarAteData: z.string()
  })
  .superRefine((values, context) => {
    const valorLiquido = calculateValorLiquido(values);
    const totalRateios = values.rateios.reduce((total, item) => total + item.valor, 0);

    if (Math.abs(totalRateios - valorLiquido) > 0.009) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rateios'],
        message: 'A soma dos rateios deve fechar exatamente o valor líquido.'
      });
    }

    if (
      values.dataEmissao.trim() !== '' &&
      values.dataVencimento.trim() !== '' &&
      values.dataVencimento < values.dataEmissao
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataVencimento'],
        message: 'A data de vencimento não pode ser anterior à data de emissão.'
      });
    }

    if (values.ehRecorrente) {
      if (values.quantidadeParcelas !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quantidadeParcelas'],
          message: 'Recorrência não pode ser combinada com parcelamento.'
        });
      }

      if (values.recorrenciaDataFim.trim() !== '' && !/^\d{4}-\d{2}$/.test(values.recorrenciaDataFim.trim())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recorrenciaDataFim'],
          message: 'Informe o mês final no formato mês/ano.'
        });
      }

      if (
        values.recorrenciaDataFim.trim() !== '' &&
        values.recorrenciaDataInicio.trim() !== '' &&
        values.recorrenciaDataFim < values.recorrenciaDataInicio.slice(0, 7)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recorrenciaDataFim'],
          message: 'Data fim deve ser maior ou igual à data de início.'
        });
      }
    }
  });
