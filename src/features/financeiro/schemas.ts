import { z } from 'zod';
import { calculateValorLiquido } from './module-config';

const rateioSchema = z.object({
  contaGerencialId: z.string().min(1, 'Conta gerencial obrigatoria'),
  valor: z.number().positive('Valor do rateio deve ser maior que zero')
});

export const financialAccountFormSchema = z
  .object({
    numeroDocumento: z.string(),
    pessoaId: z.string().min(1, 'Selecione a pessoa'),
    responsavelId: z.string(),
    dataEmissao: z.string().min(1, 'Informe a data de emissao'),
    dataVencimento: z.string().min(1, 'Informe a data de vencimento'),
    formaPagamentoId: z.string().min(1, 'Selecione a forma de pagamento'),
    cartaoId: z.string(),
    contaBancariaId: z.string(),
    dataLiquidacao: z.string(),
    valorOriginal: z.number().nonnegative(),
    valorDesconto: z.number().nonnegative(),
    valorJuros: z.number().nonnegative(),
    valorMulta: z.number().nonnegative(),
    quantidadeParcelas: z.number().int().min(1, 'Quantidade de parcelas invalida'),
    descricao: z.string().min(1, 'Descricao obrigatoria'),
    observacao: z.string(),
    rateios: z.array(rateioSchema).min(1, 'Informe ao menos um rateio'),
    ehRecorrente: z.boolean(),
    recorrenciaTipoPeriodicidade: z.literal('Mensal'),
    recorrenciaDiaGeracaoMensal: z.number().int().min(1).max(31),
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
        message: 'A soma dos rateios deve fechar exatamente o valor liquido.'
      });
    }

    if (values.ehRecorrente) {
      if (values.quantidadeParcelas !== 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quantidadeParcelas'],
          message: 'Recorrencia nao pode ser combinada com parcelamento.'
        });
      }

      if (values.recorrenciaDataInicio.trim() === '') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recorrenciaDataInicio'],
          message: 'Informe a data de inicio da recorrencia.'
        });
      }

      if (values.recorrenciaDataFim.trim() !== '' && values.recorrenciaDataFim < values.recorrenciaDataInicio) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recorrenciaDataFim'],
          message: 'Data fim deve ser maior ou igual a data de inicio.'
        });
      }
    }
  });
