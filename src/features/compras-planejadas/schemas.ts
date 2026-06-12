import { z } from 'zod';

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} é obrigatório.`);

export const compraPlanejadaSchema = z.object({
  titulo: requiredText('Título'),
  descricao: z.string().trim(),
  valorEstimado: z.number().positive('Valor estimado deve ser maior que zero.'),
  dataDesejada: z.string().trim(),
  prioridade: z.enum(['Baixa', 'Media', 'Alta']),
  status: z.enum(['Planejada', 'Comprada', 'Cancelada']),
  parcelavel: z.boolean(),
  quantidadeParcelasDesejada: z.number().nullable(),
  contaGerencialId: requiredText('Conta gerencial'),
  responsavelId: requiredText('Responsável'),
  link: z.string().trim().refine((value) => value === '' || z.string().url().safeParse(value).success, {
    message: 'Link deve ser uma URL válida.'
  }),
  observacao: z.string().trim()
}).superRefine((values, context) => {
  if (values.quantidadeParcelasDesejada !== null && values.quantidadeParcelasDesejada < 2) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['quantidadeParcelasDesejada'],
      message: 'Quantidade de parcelas desejada deve ser maior ou igual a 2.'
    });
  }
});

export const realizarCompraPlanejadaSchema = z.object({
  dataCompra: requiredText('Data da compra'),
  dataVencimento: z.string().trim(),
  recebedorId: requiredText('Recebedor'),
  formaPagamentoId: requiredText('Forma de pagamento'),
  cartaoId: z.string().trim(),
  contaBancariaId: z.string().trim(),
  quantidadeParcelas: z.number().int().min(1, 'Quantidade de parcelas deve ser maior que zero.'),
  numeroDocumento: z.string().trim(),
  descricao: requiredText('Descrição'),
  observacao: z.string().trim(),
  formaEhCartao: z.boolean(),
  formaBaixarAutomaticamente: z.boolean(),
  compraParcelavel: z.boolean()
}).superRefine((values, context) => {
  if (values.formaEhCartao) {
    if (!values.cartaoId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cartaoId'],
        message: 'Cartão é obrigatório.'
      });
    }

    if (values.quantidadeParcelas > 1 && !values.compraParcelavel) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantidadeParcelas'],
        message: 'Esta compra planejada não está marcada como parcelável.'
      });
    }
  }

  if (!values.formaEhCartao && !values.formaBaixarAutomaticamente && !values.dataVencimento) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dataVencimento'],
      message: 'Data de vencimento é obrigatória quando a forma não faz baixa automática.'
    });
  }

  if (!values.formaEhCartao && values.formaBaixarAutomaticamente && !values.contaBancariaId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contaBancariaId'],
      message: 'Conta bancária é obrigatória para baixa automática.'
    });
  }
});
